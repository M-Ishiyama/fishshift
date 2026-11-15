import type {
  FishOccurrence,
  HotspotCandidate,
  HotspotDescriptorKey,
  MonthlyObservation,
  OceanGridCell,
  PointLatLon,
  Provenance,
  Region,
  RegionId,
  SpeciesId,
  SpeciesInfo,
} from '../types/ocean';
import monthlySeriesJson from './nasa/monthly_series.json';
import obisJson from './nasa/obis_occurrences.json';
import provenanceJson from './nasa/provenance.json';
import sanrikuGridJson from './nasa/sanriku_grid.json';
import tsugaruGridJson from './nasa/tsugaru_grid.json';

/**
 * Grid shape of the prefetched NASA products. The batch in scripts/prepare_nasa.mjs
 * writes this shape, so it is the single source of truth for every consumer.
 */
export const GRID_ROWS = tsugaruGridJson.rows;
export const GRID_COLS = tsugaruGridJson.cols;

interface MonthGrid {
  sst: (number | null)[] | null;
  chlorA: (number | null)[] | null;
}

const GRIDS: Record<RegionId, { months: Record<string, MonthGrid> }> = {
  tsugaru: tsugaruGridJson as unknown as { months: Record<string, MonthGrid> },
  sanriku: sanrikuGridJson as unknown as { months: Record<string, MonthGrid> },
};

/** Acquisition trail for every prefetched product, surfaced in the UI as the data source. */
export const PROVENANCE = provenanceJson as unknown as {
  sst: Provenance;
  chlorA: Provenance;
  obis: Provenance & { record_counts: Record<string, number> };
  estimated_fields: { fields: string[]; data_kind: 'estimated'; note: string };
};

export const DATA_PERIOD = {
  start: provenanceJson.sst.observation_start,
  end: provenanceJson.sst.observation_end,
};

/** The parts of a NASA source credit, assembled into a sentence by the i18n layer. */
export interface NasaSourceRef {
  lead: string;
  distribution: string | null;
  datasetId: string | null;
}

/**
 * Builds the source credit for a NASA product.
 *
 * NASA produced the data; ERDDAP only redistributes it, so the NASA product name
 * leads and the mirror follows as a footnote. Every view uses this one function so
 * the attribution cannot drift between screens.
 */
export function nasaSourceRef(p: Provenance, opts?: { withDataset?: boolean }): NasaSourceRef {
  return {
    lead: p.nasa_short_name ?? p.product_name,
    distribution: p.distribution ?? null,
    datasetId: opts?.withDataset ? p.dataset_id : null,
  };
}

export const REGIONS: Record<RegionId, Region> = {
  tsugaru: {
    id: 'tsugaru',
    nameJa: '北海道南部・津軽海峡',
    nameEn: 'Hokkaido South / Tsugaru Strait',
    shortNameKey: 'region.tsugaru.shortName',
    bbox: { west: 139.5, south: 40.5, east: 143.0, north: 43.0 },
    defaultPort: { nameKey: 'region.tsugaru.port', lat: 41.68, lon: 140.66 },
    descriptionKey: 'region.tsugaru.description',
    landPolygons: [
      // Southern Hokkaido (Oshima Peninsula & Hidaka coast)
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
      // Northern Aomori / Tsugaru & Shimokita Peninsulas
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
    nameJa: '三陸沖・黒潮親潮混合域',
    nameEn: 'Sanriku / Kuroshio-Oyashio Confluence',
    shortNameKey: 'region.sanriku.shortName',
    bbox: { west: 141.5, south: 37.5, east: 145.5, north: 40.5 },
    defaultPort: { nameKey: 'region.sanriku.port', lat: 38.85, lon: 141.72 },
    descriptionKey: 'region.sanriku.description',
    landPolygons: [
      // Sanriku Coast (Iwate / Miyagi)
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
};

export const SPECIES_LIST: Record<SpeciesId, SpeciesInfo> = {
  thunnus_orientalis: {
    id: 'thunnus_orientalis',
    scientificName: 'Thunnus orientalis',
    nameJa: 'クロマグロ',
    nameEn: 'Pacific Bluefin Tuna',
    optimalSstRange: [15.0, 21.5],
    optimalChlRange: [0.35, 1.4],
    forageNoteKey: 'species.thunnus_orientalis.forageNote',
    obisCountTsugaru: 2,
    obisCountSanriku: 9,
  },
  oncorhynchus_keta: {
    id: 'oncorhynchus_keta',
    scientificName: 'Oncorhynchus keta',
    nameJa: 'サケ（シロザケ）',
    nameEn: 'Chum Salmon',
    optimalSstRange: [7.5, 13.5],
    optimalChlRange: [0.6, 2.5],
    forageNoteKey: 'species.oncorhynchus_keta.forageNote',
    obisCountTsugaru: 8,
    obisCountSanriku: 1,
  },
  sardinops_melanostictus: {
    id: 'sardinops_melanostictus',
    scientificName: 'Sardinops melanostictus',
    nameJa: 'マイワシ',
    nameEn: 'Japanese Sardine',
    optimalSstRange: [12.0, 18.5],
    optimalChlRange: [0.8, 3.8],
    forageNoteKey: 'species.sardinops_melanostictus.forageNote',
    obisCountTsugaru: 7,
    obisCountSanriku: 0,
  },
};

function pointInPolygon(pt: PointLatLon, poly: PointLatLon[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].lon;
    const yi = poly[i].lat;
    const xj = poly[j].lon;
    const yj = poly[j].lat;
    const intersect = yi > pt.lat !== yj > pt.lat && pt.lon < ((xj - xi) * (pt.lat - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function isPointOnLand(regionId: RegionId, pt: PointLatLon): boolean {
  const polys = REGIONS[regionId].landPolygons;
  return polys.some((poly) => pointInPolygon(pt, poly));
}

function gaussianScore(val: number, min: number, max: number): number {
  const mid = (min + max) / 2;
  const halfWidth = Math.max(0.5, (max - min) / 2);
  const z = (val - mid) / halfWidth;
  return Math.exp(-0.5 * z * z);
}

/**
 * Builds the ocean grid for a region/month from the prefetched NASA products.
 *
 * SST and Chl-a are real observations (see PROVENANCE). ERDDAP returns null both
 * over land and under cloud, so land is decided by the region's own polygons and a
 * sea cell with no value is treated as a satellite gap -- exactly the distinction the
 * map already renders (hatched = gap, absent = land).
 *
 * Current, wave, wind remain parametric ESTIMATES: no NASA monthly product supplies
 * them at this resolution. They are labelled as estimates wherever they are shown.
 */
export function buildOceanGrid(
  regionId: RegionId,
  year: number,
  month: number,
  speciesId: SpeciesId
): OceanGridCell[] {
  const region = REGIONS[regionId];
  const species = SPECIES_LIST[speciesId];
  const rows = GRID_ROWS;
  const cols = GRID_COLS;
  const dLat = (region.bbox.north - region.bbox.south) / rows;
  const dLon = (region.bbox.east - region.bbox.west) / cols;

  const key = `${year}-${String(month).padStart(2, '0')}`;
  const monthGrid = GRIDS[regionId].months[key];
  const sstPlane = monthGrid?.sst ?? null;
  const chlPlane = monthGrid?.chlorA ?? null;

  const cells: OceanGridCell[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // r=0 is top (north), r=rows-1 is bottom (south)
      const lat = region.bbox.north - (r + 0.5) * dLat;
      const lon = region.bbox.west + (c + 0.5) * dLon;
      const onLand = isPointOnLand(regionId, { lat, lon });

      if (onLand) {
        cells.push({
          row: r,
          col: c,
          lat,
          lon,
          isLand: true,
          sst: null,
          chlorA: null,
          currentSpeedMs: 0,
          currentDirDeg: 0,
          waveHeightM: 0,
          windSpeedMs: 0,
          windDirDeg: 0,
          obisDensity: 0,
          habitatScore: null,
          tempSuitability: 0,
          chlContext: 0,
          obisContext: 0,
        });
        continue;
      }

      const idx = r * cols + c;
      const sst = sstPlane?.[idx] ?? null;
      const chlorA = chlPlane?.[idx] ?? null;

      // Estimated transport/sea-state fields (NOT observations). Offshore distance and
      // a winter/summer monsoon split drive a coarse, deterministic approximation.
      const offshoreDist =
        regionId === 'tsugaru' ? Math.max(0, lon - 141.0) * 0.4 : Math.max(0, lon - 142.0) * 0.35;
      const winterFactor = month <= 3 || month >= 11 ? 0.85 : 0.25;
      const currentSpeedMs = Number((0.35 + offshoreDist * 0.5).toFixed(2));
      const currentDirDeg = regionId === 'tsugaru' ? 75 : 40;
      const waveHeightM = Number((0.75 + winterFactor + offshoreDist * 0.65).toFixed(2));
      const windSpeedMs = Number((5.2 + winterFactor * 4.2 + offshoreDist * 2.2).toFixed(1));
      const windDirDeg = month >= 10 || month <= 3 ? 305 : 145; // NW winter monsoon / SE summer

      // Species suitability from the observed fields (design doc 7.2 weights).
      const tempSuit = sst === null ? 0 : gaussianScore(sst, species.optimalSstRange[0], species.optimalSstRange[1]);
      const chlCtx = chlorA === null ? 0 : gaussianScore(chlorA, species.optimalChlRange[0], species.optimalChlRange[1]);
      // Real OBIS coverage here is far too sparse to build a density field from
      // (measured 0-9 records per species/region), so the habitat index's third term
      // is derived from the environment only; occurrences are drawn as points, never
      // interpolated into a heatmap.
      const obisCtx = Math.min(1, 0.55 * tempSuit + 0.45 * chlCtx);

      // Exploratory Habitat Index (Design doc 7.2: 0.40 * T + 0.35 * C + 0.25 * H)
      const habitatScore =
        sst === null || chlorA === null
          ? null
          : Math.round(100 * (0.4 * tempSuit + 0.35 * chlCtx + 0.25 * obisCtx));

      cells.push({
        row: r,
        col: c,
        lat: Number(lat.toFixed(3)),
        lon: Number(lon.toFixed(3)),
        isLand: false,
        sst,
        chlorA,
        currentSpeedMs,
        currentDirDeg,
        waveHeightM,
        windSpeedMs,
        windDirDeg,
        obisDensity: Number(obisCtx.toFixed(2)),
        habitatScore,
        tempSuitability: Number(tempSuit.toFixed(2)),
        chlContext: Number(chlCtx.toFixed(2)),
        obisContext: Number(obisCtx.toFixed(2)),
      });
    }
  }

  return cells;
}

const LETTERS = ['A', 'B', 'C'];

/** Ranked slots: strongest front first, then the plankton front, then an offshore control. */
const DESCRIPTOR_KEYS: HotspotDescriptorKey[] = [
  'hotspot.descriptor.primaryFront',
  'hotspot.descriptor.planktonFront',
  'hotspot.descriptor.offshoreReference',
];

export function extractHotspots(grid: OceanGridCell[], speciesId: SpeciesId): HotspotCandidate[] {
  const species = SPECIES_LIST[speciesId];
  const valid = grid
    .filter((c) => !c.isLand && c.habitatScore !== null && c.sst !== null && c.chlorA !== null)
    .sort((a, b) => (b.habitatScore ?? 0) - (a.habitatScore ?? 0));

  const picked: OceanGridCell[] = [];
  for (const cell of valid) {
    const farEnough = picked.every(
      (p) => Math.hypot(p.lat - cell.lat, p.lon - cell.lon) > 0.72
    );
    if (farEnough) picked.push(cell);
    if (picked.length >= 3) break;
  }

  return picked.map((c, idx) => ({
    id: `hotspot-${idx + 1}`,
    letter: LETTERS[idx] ?? String(idx + 1),
    descriptorKey: DESCRIPTOR_KEYS[idx] ?? 'hotspot.descriptor.generic',
    lat: c.lat,
    lon: c.lon,
    sst: c.sst ?? 0,
    chlorA: c.chlorA ?? 0,
    habitatScore: c.habitatScore ?? 0,
    tempSuitability: c.tempSuitability,
    chlContext: c.chlContext,
    obisContext: c.obisContext,
    currentSpeedMs: c.currentSpeedMs,
    waveHeightM: c.waveHeightM,
    rationale: {
      speciesId,
      optimalSstLow: species.optimalSstRange[0],
      optimalSstHigh: species.optimalSstRange[1],
      sst: c.sst ?? 0,
      chlorA: c.chlorA ?? 0,
    },
  }));
}

const OBIS_RECORDS = obisJson as unknown as FishOccurrence[];

/**
 * Real OBIS occurrence records for the region/species, straight from the prefetch.
 *
 * Coverage is genuinely sparse (0-9 records per pair; some pairs are empty). Nothing
 * is padded or jittered to fill the map -- an empty result is a real finding and the
 * map says so.
 */
export function buildObisOccurrences(regionId: RegionId, speciesId: SpeciesId): FishOccurrence[] {
  return OBIS_RECORDS.filter((o) => o.regionId === regionId && o.speciesId === speciesId);
}

const MONTHLY_SERIES = monthlySeriesJson as unknown as Record<RegionId, MonthlyObservation[]>;

/**
 * Observed monthly regional series for the Trend Explorer.
 *
 * Values are NASA observations aggregated per month; coverageRatio is the measured
 * valid-pixel fraction. No trend is assumed here -- whatever slope and p-value the
 * statistics produce from these numbers is the result.
 */
export function buildMonthlyTimeSeries(regionId: RegionId): MonthlyObservation[] {
  return MONTHLY_SERIES[regionId] ?? [];
}

export function buildCandidateRoutes(
  origin: PointLatLon,
  dest: PointLatLon,
  regionId: RegionId
): { routeA: PointLatLon[]; routeB: PointLatLon[] } {
  // Route A: Direct distance-priority sample line (4 segments)
  const routeA: PointLatLon[] = [0, 0.33, 0.66, 1].map((t) => ({
    lat: Number((origin.lat + (dest.lat - origin.lat) * t).toFixed(3)),
    lon: Number((origin.lon + (dest.lon - origin.lon) * t).toFixed(3)),
  }));

  // Route B: Offshore current-assist & lower-wave detour sample line
  const midLat = (origin.lat + dest.lat) / 2;
  const midLon = (origin.lon + dest.lon) / 2;
  const detourShiftLat = regionId === 'tsugaru' ? -0.18 : 0.22;
  const detourShiftLon = regionId === 'tsugaru' ? 0.24 : 0.28;

  const wp1: PointLatLon = {
    lat: Number((origin.lat + (midLat - origin.lat) * 0.55 + detourShiftLat * 0.6).toFixed(3)),
    lon: Number((origin.lon + (midLon - origin.lon) * 0.55 + detourShiftLon * 0.5).toFixed(3)),
  };
  const wp2: PointLatLon = {
    lat: Number((midLat + detourShiftLat).toFixed(3)),
    lon: Number((midLon + detourShiftLon).toFixed(3)),
  };
  const wp3: PointLatLon = {
    lat: Number((dest.lat + (midLat - dest.lat) * 0.4 + detourShiftLat * 0.5).toFixed(3)),
    lon: Number((dest.lon + (midLon - dest.lon) * 0.4 + detourShiftLon * 0.45).toFixed(3)),
  };

  // Ensure waypoints avoid land if possible
  const safeWp = (pt: PointLatLon, fallback: PointLatLon): PointLatLon =>
    isPointOnLand(regionId, pt) ? fallback : pt;

  const routeB: PointLatLon[] = [
    origin,
    safeWp(wp1, routeA[1]),
    safeWp(wp2, routeA[2]),
    safeWp(wp3, routeA[2]),
    dest,
  ];

  return { routeA, routeB };
}
