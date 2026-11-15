/**
 * FishShift — NASA real-data prefetch batch.
 *
 * Design doc §4.1 requires NASA data acquisition to be separated from UI display:
 * the browser must never call NASA/Earthdata APIs directly. ERDDAP also sends no
 * CORS headers and a full 10-year grid is ~3.4MB / 22s, so everything is fetched
 * here, quality-controlled, and written as committed JSON under src/data/nasa/.
 *
 * Usage: npm run prepare:nasa
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(HERE, '../src/data/nasa');

// Overridable so the batch can be smoke-tested on a short span before a full run.
const START_YEAR = Number(process.env.FISHSHIFT_START_YEAR ?? 2016);
const END_YEAR = Number(process.env.FISHSHIFT_END_YEAR ?? 2025);

// Must stay in sync with GRID_ROWS / GRID_COLS in src/data/oceanData.ts.
const GRID_ROWS = 20;
const GRID_COLS = 26;

const ERDDAP_BASE = 'https://coastwatch.pfeg.noaa.gov/erddap/griddap';

const REGIONS = {
  tsugaru: { bbox: { west: 139.5, south: 40.5, east: 143.0, north: 43.0 } },
  sanriku: { bbox: { west: 141.5, south: 37.5, east: 145.5, north: 40.5 } },
};

// Verified against the live servers on 2026-11-14: period, bbox coverage and units
// were all confirmed by real requests before being hard-coded here.
const PRODUCTS = {
  sst: {
    datasetId: 'jplMURSST41mday',
    variable: 'analysed_sst',
    erddapVar: 'sst',
    provider: 'NASA JPL (via NOAA CoastWatch ERDDAP)',
    productName: 'GHRSST Level 4 MUR Global Foundation SST Analysis v4.1 (Monthly)',
    // NASA is the producer; ERDDAP only redistributes. Keep the two separate so the
    // UI can lead with the NASA product and mention the mirror as a footnote.
    nasaShortName: 'NASA JPL MUR L4 v4.1',
    nasaPlatform: 'GHRSST / 多衛星統合 (MODIS, AVHRR, AMSR-E 等)',
    distribution: 'NOAA CoastWatch ERDDAP',
    unit: 'degC',
    // MUR monthly timestamps are the 16th at 00:00Z.
    timeFor: (y, m) => `${y}-${String(m).padStart(2, '0')}-16T00:00:00Z`,
    valid: [-2, 40],
    // Native resolution 0.01 deg, latitude ascending.
    nativeStep: 0.01,
    latDescending: false,
  },
  chlorA: {
    datasetId: 'erdMH1chlamday_R2022SQ',
    variable: 'chlor_a',
    erddapVar: 'chlor_a',
    provider: 'NASA OB.DAAC / MODIS-Aqua (via NOAA CoastWatch ERDDAP)',
    productName: 'Chlorophyll-a, Aqua MODIS, NPP, L3SMI, Global 4km, R2022 Science Quality (Monthly)',
    nasaShortName: 'NASA OB.DAAC MODIS-Aqua L3SMI R2022 SQ',
    nasaPlatform: 'NASA Aqua 衛星 / MODIS センサー',
    distribution: 'NOAA CoastWatch ERDDAP',
    unit: 'mg m-3',
    timeFor: (y, m) => `${y}-${String(m).padStart(2, '0')}-16T00:00:00Z`,
    valid: [0, 100],
    // Native resolution ~0.0417 deg (4km), latitude DESCENDING: ERDDAP requires the
    // bounds in descending order with a positive stride for this axis.
    nativeStep: 1 / 24,
    latDescending: true,
  },
};

const SPECIES = {
  thunnus_orientalis: 'Thunnus orientalis',
  oncorhynchus_keta: 'Oncorhynchus keta',
  sardinops_melanostictus: 'Sardinops melanostictus',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url, label, attempt = 1) {
  // ERDDAP intermittently answers 503 "temporary problem" under load, so retries
  // need to be generous rather than failing the whole batch.
  const MAX = 6;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(180_000) });
    const text = await res.text();
    if (!res.ok) {
      // ERDDAP answers 404 for "no matching data" (e.g. a month past the time axis).
      if (res.status === 404 && text.includes('produced no matching results')) return null;
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 180)}`);
    }
    return JSON.parse(text);
  } catch (err) {
    if (attempt >= MAX) throw new Error(`${label} failed after ${MAX} attempts: ${err.message}`);
    const backoff = 2000 * attempt;
    process.stdout.write(`    retry ${attempt}/${MAX - 1} in ${backoff / 1000}s (${err.message.slice(0, 70)})\n`);
    await sleep(backoff);
    return fetchJson(url, label, attempt + 1);
  }
}

/**
 * Fetch one month of one variable over a region and resample onto the fixed
 * GRID_ROWS x GRID_COLS cell centers by nearest neighbour.
 *
 * ERDDAP returns null both over land and under cloud; we keep null as-is and let
 * the app's existing land polygons decide which is which (sea + null = cloud gap).
 */
async function fetchMonthGrid(product, bbox, year, month) {
  const time = product.timeFor(year, month);

  // Subsample server-side with a stride instead of pulling the native grid: the
  // full 0.01 deg box is ~5MB / 94k rows per month, while striding to roughly the
  // target cell spacing is ~30KB and under a second (measured).
  // Sample several source pixels per target cell (~4 per axis) rather than one, so
  // a single coastal or cloudy pixel cannot blank out an otherwise valid sea cell.
  const dLat = (bbox.north - bbox.south) / GRID_ROWS;
  const dLon = (bbox.east - bbox.west) / GRID_COLS;
  const SAMPLES_PER_CELL = 4;
  const strideLat = Math.max(1, Math.round(dLat / product.nativeStep / SAMPLES_PER_CELL));
  const strideLon = Math.max(1, Math.round(dLon / product.nativeStep / SAMPLES_PER_CELL));

  // Cover the whole bbox, not just cell centres, so edge columns/rows are populated.
  const latRange = product.latDescending
    ? `(${bbox.north.toFixed(4)}):${strideLat}:(${bbox.south.toFixed(4)})`
    : `(${bbox.south.toFixed(4)}):${strideLat}:(${bbox.north.toFixed(4)})`;

  const q =
    `${product.erddapVar}[(${time})]` +
    `[${latRange}]` +
    `[(${bbox.west.toFixed(4)}):${strideLon}:(${bbox.east.toFixed(4)})]`;
  const url = `${ERDDAP_BASE}/${product.datasetId}.json?${encodeURIComponent(q).replace(/%5B/g, '[').replace(/%5D/g, ']')}`;

  const json = await fetchJson(url, `${product.datasetId} ${year}-${month}`);
  if (!json) return null;

  const cols = json.table.columnNames;
  const iLat = cols.indexOf('latitude');
  const iLon = cols.indexOf('longitude');
  const iVal = cols.length - 1;

  // Bucket source pixels by nearest target cell, then average, which keeps a
  // valid value wherever the coarse cell contains any valid pixel.
  const sum = new Float64Array(GRID_ROWS * GRID_COLS);
  const cnt = new Int32Array(GRID_ROWS * GRID_COLS);
  const [lo, hi] = product.valid;

  // Bin by cell index: row 0 is the northernmost band, matching buildOceanGrid.
  const clamp = (i, n) => Math.min(n - 1, Math.max(0, i));

  for (const row of json.table.rows) {
    const v = row[iVal];
    if (v === null || !Number.isFinite(v) || v < lo || v > hi) continue;
    const r = clamp(Math.floor((bbox.north - row[iLat]) / dLat), GRID_ROWS);
    const c = clamp(Math.floor((row[iLon] - bbox.west) / dLon), GRID_COLS);
    const k = r * GRID_COLS + c;
    sum[k] += v;
    cnt[k] += 1;
  }

  const out = new Array(GRID_ROWS * GRID_COLS);
  for (let k = 0; k < out.length; k++) {
    out[k] = cnt[k] === 0 ? null : Number((sum[k] / cnt[k]).toFixed(2));
  }
  return out;
}

function median(values) {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

async function buildRegion(regionId) {
  const { bbox } = REGIONS[regionId];
  const grid = {};
  const monthly = [];

  for (let year = START_YEAR; year <= END_YEAR; year++) {
    for (let month = 1; month <= 12; month++) {
      const key = `${year}-${String(month).padStart(2, '0')}`;
      const [sst, chlorA] = await Promise.all([
        fetchMonthGrid(PRODUCTS.sst, bbox, year, month),
        fetchMonthGrid(PRODUCTS.chlorA, bbox, year, month),
      ]);
      grid[key] = { sst, chlorA };

      // Regional monthly aggregate for the Trend Explorer. coverageRatio is the
      // measured valid-pixel fraction -- no longer a synthetic number.
      const sstVals = (sst ?? []).filter((v) => v !== null);
      const chlVals = (chlorA ?? []).filter((v) => v !== null);
      monthly.push({
        year,
        month,
        label: key,
        // Area-weighting is not applied; cells are near-equal area at this latitude span.
        sst: sstVals.length ? Number((sstVals.reduce((a, b) => a + b, 0) / sstVals.length).toFixed(2)) : null,
        // Design doc §7.1-2: Chl-a is strongly right-skewed, so the regional
        // summary uses the median rather than the arithmetic mean.
        chlorA: chlVals.length ? Number(median(chlVals).toFixed(3)) : null,
        coverageRatio: Number((sstVals.length / (GRID_ROWS * GRID_COLS)).toFixed(2)),
      });

      process.stdout.write(
        `  ${regionId} ${key}  sst=${String(sstVals.length).padStart(3)}  chl=${String(chlVals.length).padStart(3)}\n`
      );
      await sleep(250);
    }
  }

  return { grid, monthly };
}

function polygonWkt(bbox) {
  const { west: w, south: s, east: e, north: n } = bbox;
  return `POLYGON((${w} ${s},${e} ${s},${e} ${n},${w} ${n},${w} ${s}))`;
}

async function fetchObis() {
  const records = [];
  const counts = {};

  for (const [regionId, { bbox }] of Object.entries(REGIONS)) {
    for (const [speciesId, scientificName] of Object.entries(SPECIES)) {
      const params = new URLSearchParams({
        scientificname: scientificName,
        geometry: polygonWkt(bbox),
        size: '1000',
      });
      const url = `https://api.obis.org/v3/occurrence?${params}`;
      const json = await fetchJson(url, `OBIS ${regionId}/${speciesId}`);
      const results = json?.results ?? [];

      // Real OBIS coverage here is very sparse (measured 0-9 records per pair),
      // so every record is kept as-is. Nothing is synthesised or padded.
      for (const [i, rec] of results.entries()) {
        const lat = rec.decimalLatitude;
        const lon = rec.decimalLongitude;
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
        records.push({
          id: `obis-${regionId}-${speciesId}-${i}`,
          speciesId,
          regionId,
          lat: Number(lat.toFixed(3)),
          lon: Number(lon.toFixed(3)),
          observedAt: (rec.eventDate ?? '').slice(0, 10),
          basisOfRecord: ['HumanObservation', 'MachineObservation'].includes(rec.basisOfRecord)
            ? rec.basisOfRecord
            : 'Occurrence',
          datasetId: rec.dataset_id ?? 'unknown',
        });
      }

      counts[`${speciesId}:${regionId}`] = results.length;
      process.stdout.write(`  OBIS ${regionId.padEnd(8)} ${scientificName.padEnd(26)} ${results.length}\n`);
      await sleep(400);
    }
  }

  return { records, counts };
}

function provenanceFor(product, retrievedAt) {
  return {
    dataset_id: product.datasetId,
    provider: product.provider,
    product_name: product.productName,
    nasa_short_name: product.nasaShortName,
    nasa_platform: product.nasaPlatform,
    distribution: product.distribution,
    variable: product.variable,
    unit: product.unit,
    source_url: `${ERDDAP_BASE}/${product.datasetId}.html`,
    observation_start: `${START_YEAR}-01`,
    observation_end: `${END_YEAR}-12`,
    retrieved_at_utc: retrievedAt,
    processing: `regional monthly valid-pixel summary; server-side strided subsample averaged into a ${GRID_ROWS}x${GRID_COLS} cell grid; out-of-range values (${product.valid[0]}..${product.valid[1]}) dropped; null kept as null (land decided by region polygons, sea+null = cloud gap)`,
    license_note:
      'NASA data are open. Served via NOAA CoastWatch ERDDAP; cite both NASA as producer and the ERDDAP distribution path.',
    data_kind: 'observed',
  };
}

async function main() {
  const retrievedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  await mkdir(OUT_DIR, { recursive: true });

  const monthlySeries = {};
  for (const regionId of Object.keys(REGIONS)) {
    process.stdout.write(`\n[grid] ${regionId}\n`);
    const { grid, monthly } = await buildRegion(regionId);
    monthlySeries[regionId] = monthly;
    await writeFile(
      resolve(OUT_DIR, `${regionId}_grid.json`),
      JSON.stringify({ rows: GRID_ROWS, cols: GRID_COLS, months: grid })
    );
  }
  await writeFile(resolve(OUT_DIR, 'monthly_series.json'), JSON.stringify(monthlySeries));

  process.stdout.write(`\n[obis]\n`);
  const { records, counts } = await fetchObis();
  await writeFile(resolve(OUT_DIR, 'obis_occurrences.json'), JSON.stringify(records));

  await writeFile(
    resolve(OUT_DIR, 'provenance.json'),
    JSON.stringify(
      {
        sst: provenanceFor(PRODUCTS.sst, retrievedAt),
        chlorA: provenanceFor(PRODUCTS.chlorA, retrievedAt),
        obis: {
          dataset_id: 'OBIS occurrence API v3',
          provider: 'OBIS (Ocean Biodiversity Information System)',
          product_name: 'OBIS occurrence records',
          variable: 'occurrence',
          unit: 'count',
          source_url: 'https://api.obis.org/v3/occurrence',
          observation_start: 'all available',
          observation_end: retrievedAt.slice(0, 7),
          retrieved_at_utc: retrievedAt,
          processing: 'bbox + scientific name query; all returned records kept unmodified',
          license_note: 'OBIS records carry per-dataset licences; see dataset_id of each record.',
          data_kind: 'observed',
          record_counts: counts,
        },
        estimated_fields: {
          fields: ['currentSpeedMs', 'currentDirDeg', 'waveHeightM', 'windSpeedMs', 'windDirDeg'],
          data_kind: 'estimated',
          note: 'Not NASA observations. Parametric estimates retained for the Route Lab; must not be used for navigation.',
        },
      },
      null,
      2
    )
  );

  // Sanity report so a bad run is obvious rather than silently committed.
  process.stdout.write(`\n[verify]\n`);
  let bad = 0;
  for (const [regionId, rows] of Object.entries(monthlySeries)) {
    const n = rows.length;
    const sstOk = rows.filter((r) => r.sst !== null);
    const chlOk = rows.filter((r) => r.chlorA !== null);
    const sstRange = sstOk.length ? [Math.min(...sstOk.map((r) => r.sst)), Math.max(...sstOk.map((r) => r.sst))] : [];
    const chlRange = chlOk.length ? [Math.min(...chlOk.map((r) => r.chlorA)), Math.max(...chlOk.map((r) => r.chlorA))] : [];
    process.stdout.write(
      `  ${regionId}: months=${n} (expect 120), sst non-null=${sstOk.length} range=${sstRange.join('..')}, ` +
        `chl non-null=${chlOk.length} range=${chlRange.join('..')}\n`
    );
    if (n !== 120) {
      process.stdout.write(`  !! ${regionId}: expected 120 months, got ${n}\n`);
      bad++;
    }
    if (!sstOk.length) {
      process.stdout.write(`  !! ${regionId}: no valid SST at all\n`);
      bad++;
    }
  }
  process.stdout.write(`  obis records=${records.length}\n`);
  process.stdout.write(bad ? `\nDONE with ${bad} problem(s) -- inspect before committing.\n` : `\nDONE. Output: ${OUT_DIR}\n`);
}

main().catch((err) => {
  process.stderr.write(`\nFAILED: ${err.message}\n`);
  process.exit(1);
});
