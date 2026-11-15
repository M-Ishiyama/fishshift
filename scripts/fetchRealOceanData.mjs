import fs from 'node:fs/promises';
import path from 'node:path';

const REGIONS = {
  tsugaru: {
    id: 'tsugaru',
    bbox: { west: 139.5, south: 40.5, east: 143.0, north: 43.0 },
    landPolygons: [
      [
        { lat: 43.05, lon: 139.75 },
        { lat: 42.65, lon: 139.85 },
        { lat: 42.15, lon: 140.05 },
        { lat: 41.72, lon: 140.02 },
        { lat: 41.42, lon: 140.18 },
        { lat: 41.55, lon: 140.52 },
        { lat: 41.78, lon: 140.72 },
        { lat: 41.76, lon: 141.15 },
        { lat: 41.96, lon: 141.18 },
        { lat: 42.22, lon: 140.35 },
        { lat: 42.45, lon: 140.82 },
        { lat: 42.68, lon: 141.65 },
        { lat: 42.55, lon: 142.35 },
        { lat: 42.08, lon: 143.05 },
        { lat: 43.05, lon: 143.05 },
      ],
      [
        { lat: 40.45, lon: 139.85 },
        { lat: 40.95, lon: 140.25 },
        { lat: 41.26, lon: 140.34 },
        { lat: 41.18, lon: 140.62 },
        { lat: 40.85, lon: 140.75 },
        { lat: 41.16, lon: 141.05 },
        { lat: 41.54, lon: 140.92 },
        { lat: 41.44, lon: 141.46 },
        { lat: 40.82, lon: 141.42 },
        { lat: 40.45, lon: 141.65 },
        { lat: 40.45, lon: 139.85 },
      ],
    ],
  },
  sanriku: {
    id: 'sanriku',
    bbox: { west: 141.5, south: 37.5, east: 145.5, north: 40.5 },
    landPolygons: [
      [
        { lat: 40.55, lon: 141.45 },
        { lat: 40.25, lon: 141.82 },
        { lat: 39.82, lon: 141.98 },
        { lat: 39.42, lon: 142.04 },
        { lat: 39.05, lon: 141.88 },
        { lat: 38.75, lon: 141.56 },
        { lat: 38.32, lon: 141.52 },
        { lat: 37.95, lon: 141.02 },
        { lat: 37.45, lon: 141.05 },
        { lat: 37.45, lon: 141.45 },
      ],
    ],
  },
  houston: {
    id: 'houston',
    bbox: { west: -96.2, south: 27.0, east: -92.8, north: 30.0 },
    landPolygons: [
      [
        { lat: 30.05, lon: -96.25 },
        { lat: 28.45, lon: -96.25 },
        { lat: 28.78, lon: -95.65 },
        { lat: 28.94, lon: -95.28 },
        { lat: 29.31, lon: -94.77 },
        { lat: 29.68, lon: -94.98 },
        { lat: 29.58, lon: -94.72 },
        { lat: 29.41, lon: -94.66 },
        { lat: 29.67, lon: -94.04 },
        { lat: 29.74, lon: -93.84 },
        { lat: 29.78, lon: -93.32 },
        { lat: 29.71, lon: -92.75 },
        { lat: 30.05, lon: -92.75 },
        { lat: 30.05, lon: -96.25 },
      ],
    ],
  },
};

const SPECIES = [
  { id: 'thunnus_orientalis', scientificName: 'Thunnus orientalis' },
  { id: 'oncorhynchus_keta', scientificName: 'Oncorhynchus keta' },
  { id: 'sardinops_melanostictus', scientificName: 'Sardinops melanostictus' },
  { id: 'thunnus_albacares', scientificName: 'Thunnus albacares' },
];

const ROWS = 20;
const COLS = 26;
const START_YEAR = 2016;
const END_YEAR = 2025;

function pointInPolygon(pt, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].lon;
    const yi = poly[i].lat;
    const xj = poly[j].lon;
    const yj = poly[j].lat;
    const intersect =
      yi > pt.lat !== yj > pt.lat &&
      pt.lon < ((xj - xi) * (pt.lat - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function isPointOnLand(regionId, pt) {
  return REGIONS[regionId].landPolygons.some((poly) => pointInPolygon(pt, poly));
}

function median(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function mean(values) {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

async function fetchWithRetry(url, retries = 4) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 90000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      const text = await res.text();
      if (!res.ok || text.trimStart().startsWith('Error {')) {
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 220)}`);
      }
      return text;
    } catch (err) {
      if (attempt === retries) throw err;
      const waitMs = 1500 * attempt;
      console.warn(`  Retry ${attempt}/${retries} after error (${err.message}) in ${waitMs}ms...`);
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
}

async function fetchErddapYearCsv({ datasetId, variable, bbox, year, stride }) {
  const start = `${year}-01-01T00:00:00Z`;
  const end = `${year}-12-31T23:59:59Z`;
  const query = `${variable}[(${start}):1:(${end})][(${bbox.south}):${stride}:(${bbox.north})][(${bbox.west}):${stride}:(${bbox.east})]`;
  const url = `https://coastwatch.pfeg.noaa.gov/erddap/griddap/${datasetId}.csv?${query}`;
  return fetchWithRetry(url);
}

function accumulateCsvIntoMonthlyBins({ csvText, regionId, isLandMask, monthlyBins, varKey }) {
  const region = REGIONS[regionId];
  const { west, south, east, north } = region.bbox;
  const dLat = (north - south) / ROWS;
  const dLon = (east - west) / COLS;

  const lines = csvText.split('\n');
  // Line 0: header (time,latitude,longitude,<var>)
  // Line 1: units
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(',');
    if (parts.length < 4) continue;
    const ym = parts[0].slice(0, 7); // YYYY-MM
    const lat = Number(parts[1]);
    const lon = Number(parts[2]);
    const val = Number(parts[3]);
    if (!Number.isFinite(val)) continue;

    // Bin into 20x26 grid cells
    let r = Math.floor((north - lat) / dLat);
    let c = Math.floor((lon - west) / dLon);
    if (r === ROWS) r = ROWS - 1;
    if (c === COLS) c = COLS - 1;
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;

    const idx = r * COLS + c;
    if (isLandMask[idx]) continue;

    let monthBucket = monthlyBins.get(ym);
    if (!monthBucket) {
      monthBucket = {
        sstCells: Array.from({ length: ROWS * COLS }, () => []),
        chlCells: Array.from({ length: ROWS * COLS }, () => []),
        sstPixels: [],
        chlPixels: [],
      };
      monthlyBins.set(ym, monthBucket);
    }

    if (varKey === 'sst') {
      monthBucket.sstCells[idx].push(val);
      monthBucket.sstPixels.push(val);
    } else {
      monthBucket.chlCells[idx].push(val);
      monthBucket.chlPixels.push(val);
    }
  }
}

async function processRegion(regionId, outDir) {
  const region = REGIONS[regionId];
  const { west, south, east, north } = region.bbox;
  const dLat = (north - south) / ROWS;
  const dLon = (east - west) / COLS;

  const isLandMask = new Array(ROWS * COLS).fill(false);
  let seaCellCount = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const lat = north - (r + 0.5) * dLat;
      const lon = west + (c + 0.5) * dLon;
      const onLand = isPointOnLand(regionId, { lat, lon });
      isLandMask[r * COLS + c] = onLand;
      if (!onLand) seaCellCount++;
    }
  }

  console.log(`\n=== Region: ${regionId} (sea cells: ${seaCellCount}/${ROWS * COLS}) ===`);
  const monthlyBins = new Map();

  for (let yr = START_YEAR; yr <= END_YEAR; yr++) {
    process.stdout.write(`  [${regionId}] ${yr} SST + Chl-a ... `);
    const [sstCsv, chlCsv] = await Promise.all([
      fetchErddapYearCsv({
        datasetId: 'jplMURSST41mday',
        variable: 'sst',
        bbox: region.bbox,
        year: yr,
        stride: 4, // ~0.04 deg (~4.4km)
      }),
      fetchErddapYearCsv({
        datasetId: 'erdMH1chlamday_R2022SQ',
        variable: 'chlor_a',
        bbox: region.bbox,
        year: yr,
        stride: 1, // ~0.04167 deg (~4km)
      }),
    ]);

    accumulateCsvIntoMonthlyBins({
      csvText: sstCsv,
      regionId,
      isLandMask,
      monthlyBins,
      varKey: 'sst',
    });
    accumulateCsvIntoMonthlyBins({
      csvText: chlCsv,
      regionId,
      isLandMask,
      monthlyBins,
      varKey: 'chlorA',
    });
    console.log('OK');
  }

  const monthlySeries = [];
  const grids = {};

  for (let yr = START_YEAR; yr <= END_YEAR; yr++) {
    for (let mo = 1; mo <= 12; mo++) {
      const label = `${yr}-${String(mo).padStart(2, '0')}`;
      const bucket = monthlyBins.get(label);

      const sstGrid = new Array(ROWS * COLS).fill(null);
      const chlGrid = new Array(ROWS * COLS).fill(null);
      let validSstCells = 0;
      let validChlCells = 0;

      if (bucket) {
        for (let idx = 0; idx < ROWS * COLS; idx++) {
          if (isLandMask[idx]) continue;
          const sVals = bucket.sstCells[idx];
          if (sVals.length > 0) {
            sstGrid[idx] = Number(mean(sVals).toFixed(2));
            validSstCells++;
          }
          const cVals = bucket.chlCells[idx];
          if (cVals.length > 0) {
            chlGrid[idx] = Number(median(cVals).toFixed(3));
            validChlCells++;
          }
        }
      }

      const sstCoverage = Number((validSstCells / seaCellCount).toFixed(3));
      const chlCoverage = Number((validChlCells / seaCellCount).toFixed(3));

      const sstMeanVal =
        bucket && bucket.sstPixels.length > 0 && sstCoverage >= 0.05
          ? Number(mean(bucket.sstPixels).toFixed(3))
          : null;
      const chlMedianVal =
        bucket && bucket.chlPixels.length > 0 && chlCoverage >= 0.05
          ? Number(median(bucket.chlPixels).toFixed(4))
          : null;

      monthlySeries.push({
        year: yr,
        month: mo,
        label,
        sst: sstMeanVal,
        chlorA: chlMedianVal,
        coverageRatio: chlCoverage,
        sstCoverage,
        chlCoverage,
      });

      grids[label] = {
        sst: sstGrid,
        chlorA: chlGrid,
      };
    }
  }

  const payload = {
    regionId,
    rows: ROWS,
    cols: COLS,
    seaCellCount,
    sources: {
      sst: {
        datasetId: 'jplMURSST41mday',
        product: 'GHRSST Level 4 MUR Global Foundation SST Analysis v4.1 (Monthly)',
        producer: 'NASA JPL',
        variable: 'analysed_sst (ERDDAP: sst)',
        unit: '°C',
        mirror: 'NOAA CoastWatch ERDDAP',
      },
      chlorA: {
        datasetId: 'erdMH1chlamday_R2022SQ',
        product: 'Chlorophyll-a, Aqua MODIS, NPP, L3SMI, Global 4km, R2022 Science Quality (Monthly)',
        producer: 'NASA OB.DAAC',
        variable: 'chlor_a',
        unit: 'mg m⁻³',
        mirror: 'NOAA CoastWatch ERDDAP',
      },
    },
    fetchedAt: new Date().toISOString(),
    monthlySeries,
    grids,
  };

  const outFile = path.join(outDir, `region_${regionId}.json`);
  await fs.writeFile(outFile, JSON.stringify(payload));
  const stat = await fs.stat(outFile);
  const validSstMonths = monthlySeries.filter((m) => m.sst !== null).length;
  const validChlMonths = monthlySeries.filter((m) => m.chlorA !== null).length;
  console.log(
    `  Saved ${outFile} (${(stat.size / 1024).toFixed(1)} KB) | Valid months: SST=${validSstMonths}/120, Chl-a=${validChlMonths}/120`
  );
}

async function fetchObisOccurrences(outDir) {
  console.log('\n=== Fetching OBIS API v3 Occurrences ===');
  const occurrences = [];
  const counts = {};
  const datasetMap = new Map();

  for (const regionId of Object.keys(REGIONS)) {
    counts[regionId] = {};
    const { west, south, east, north } = REGIONS[regionId].bbox;
    const wkt = `POLYGON((${west} ${south},${east} ${south},${east} ${north},${west} ${north},${west} ${south}))`;

    for (const sp of SPECIES) {
      const maxFetch = regionId === 'houston' && sp.id === 'thunnus_albacares' ? 500 : 1000;
      const url = `https://api.obis.org/v3/occurrence?scientificname=${encodeURIComponent(
        sp.scientificName
      )}&geometry=${encodeURIComponent(wkt)}&size=${maxFetch}`;

      const raw = await fetchWithRetry(url);
      const json = JSON.parse(raw);
      const total = Number(json.total ?? 0);
      const results = Array.isArray(json.results) ? json.results : [];
      const dsSet = new Set();

      for (const rec of results) {
        const lat = Number(rec.decimalLatitude);
        const lon = Number(rec.decimalLongitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

        const datasetId = String(rec.dataset_id ?? 'unknown');
        const datasetName = String(rec.datasetName ?? datasetId);
        dsSet.add(datasetId);
        if (!datasetMap.has(datasetId)) {
          datasetMap.set(datasetId, { id: datasetId, name: datasetName });
        }

        const rawDate =
          typeof rec.eventDate === 'string' && rec.eventDate.length >= 4
            ? rec.eventDate.slice(0, 10)
            : rec.date_year
              ? String(rec.date_year)
              : 'Unknown';

        const basisRaw = String(rec.basisOfRecord ?? 'Occurrence');
        const basisOfRecord =
          basisRaw === 'HumanObservation' || basisRaw === 'MachineObservation'
            ? basisRaw
            : 'Occurrence';

        occurrences.push({
          id: String(rec.id ?? `obis-${regionId}-${sp.id}-${occurrences.length}`),
          speciesId: sp.id,
          regionId,
          lat: Number(lat.toFixed(4)),
          lon: Number(lon.toFixed(4)),
          observedAt: rawDate,
          basisOfRecord,
          datasetId,
        });
      }

      counts[regionId][sp.id] = {
        totalCount: total,
        returnedCount: results.length,
        datasetCount: dsSet.size,
      };
      console.log(
        `  [${regionId}] ${sp.scientificName}: total=${total}, stored=${results.length}, datasets=${dsSet.size}`
      );
    }
  }

  const outFile = path.join(outDir, 'obis_occurrences.json');
  await fs.writeFile(
    outFile,
    JSON.stringify({
      source: 'OBIS (Ocean Biodiversity Information System) API v3',
      endpoint: 'https://api.obis.org/v3/occurrence',
      fetchedAt: new Date().toISOString(),
      counts,
      datasets: Object.fromEntries(datasetMap.entries()),
      occurrences,
    })
  );
  console.log(`  Saved ${outFile} (total stored points: ${occurrences.length})`);
}

async function main() {
  const outDir = path.resolve('public/data');
  await fs.mkdir(outDir, { recursive: true });

  await fetchObisOccurrences(outDir);
  for (const regionId of Object.keys(REGIONS)) {
    await processRegion(regionId, outDir);
  }
  console.log('\nAll real NASA + OBIS datasets ingested cleanly.');
}

main().catch((err) => {
  console.error('Ingestion failed:', err);
  process.exit(1);
});
