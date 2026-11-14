import type {
  FishOccurrence,
  HotspotCandidate,
  MonthlyObservation,
  OceanGridCell,
  PointLatLon,
  Region,
  RegionId,
  SpeciesId,
  SpeciesInfo,
} from '../types/ocean';

export const REGIONS: Record<RegionId, Region> = {
  tsugaru: {
    id: 'tsugaru',
    nameJa: '北海道南部・津軽海峡',
    nameEn: 'Hokkaido South / Tsugaru Strait',
    bbox: { west: 139.5, south: 40.5, east: 143.0, north: 43.0 },
    defaultPort: { nameJa: '函館沖 仮想出港点', lat: 41.68, lon: 140.66 },
    descriptionJa:
      '対馬暖流系の津軽暖流と親潮系冷水が交差する実験対象海域（設計書サンプルBBox: 40.5–43.0°N, 139.5–143.0°E）。',
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
    bbox: { west: 141.5, south: 37.5, east: 145.5, north: 40.5 },
    defaultPort: { nameJa: '気仙沼沖 仮想出港点', lat: 38.85, lon: 141.72 },
    descriptionJa:
      '暖水塊（黒潮続流）と寒流（親潮）が衝突し、明瞭な潮目と植物プランクトン増殖帯が形成される比較海域。',
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
    forageNoteJa: '潮目周辺のイワシ・スルメイカ等の餌生物（高次捕食対象）が集まりやすい水温前線域に過去の回遊記録が集中。',
    obisCountTsugaru: 148,
    obisCountSanriku: 214,
  },
  oncorhynchus_keta: {
    id: 'oncorhynchus_keta',
    scientificName: 'Oncorhynchus keta',
    nameJa: 'サケ（シロザケ）',
    nameEn: 'Chum Salmon',
    optimalSstRange: [7.5, 13.5],
    optimalChlRange: [0.6, 2.5],
    forageNoteJa: '親潮系の冷水域と基礎生産が高い混合域に分布する傾向。高水温化による分布域の北上傾向の検証対象。',
    obisCountTsugaru: 196,
    obisCountSanriku: 112,
  },
  sardinops_melanostictus: {
    id: 'sardinops_melanostictus',
    scientificName: 'Sardinops melanostictus',
    nameJa: 'マイワシ',
    nameEn: 'Japanese Sardine',
    optimalSstRange: [12.0, 18.5],
    optimalChlRange: [0.8, 3.8],
    forageNoteJa: '植物プランクトン（Chl-a高濃度帯）を直接・間接的に利用する小型浮魚類。大型魚の餌密集ポイントの指標候補。',
    obisCountTsugaru: 235,
    obisCountSanriku: 318,
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

function deterministicHash(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function gaussianScore(val: number, min: number, max: number): number {
  const mid = (min + max) / 2;
  const halfWidth = Math.max(0.5, (max - min) / 2);
  const z = (val - mid) / halfWidth;
  return Math.exp(-0.5 * z * z);
}

/**
 * Generates an exploratory grid (20 rows x 26 cols) for a given region, year, month, and species.
 * Simulates realistic seasonal SST, Chl-a thermal fronts, ocean current fields, and satellite cloud gaps.
 */
export function buildOceanGrid(
  regionId: RegionId,
  year: number,
  month: number,
  speciesId: SpeciesId
): OceanGridCell[] {
  const region = REGIONS[regionId];
  const species = SPECIES_LIST[speciesId];
  const rows = 20;
  const cols = 26;
  const dLat = (region.bbox.north - region.bbox.south) / rows;
  const dLon = (region.bbox.east - region.bbox.west) / cols;

  // Seasonal cycle: peak SST in Aug/Sep (month 8.5), minimum in Feb/Mar (month 2.5)
  const seasonalSst = Math.sin(((month - 5.5) / 12) * Math.PI * 2);
  // Long-term warming trend: +0.045 degC/yr (Tsugaru) or +0.058 degC/yr (Sanriku)
  const yearOffset = year - 2016;
  const warmingDelta = regionId === 'tsugaru' ? yearOffset * 0.048 : yearOffset * 0.062;

  // Spring bloom (Apr-May) and autumn bloom (Oct) for Chl-a
  const springBloom = Math.exp(-0.5 * ((month - 4.6) / 1.3) ** 2);
  const autumnBloom = 0.65 * Math.exp(-0.5 * ((month - 10.2) / 1.2) ** 2);

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

      // Cloud / satellite missing pixel simulation (~5% missing in winter/monsoon)
      const missingNoise = deterministicHash(r * 131 + c * 37 + month * 17 + year * 7);
      const isCloudGap = missingNoise < (month <= 2 || month === 7 ? 0.065 : 0.025);

      let baseSst = 0;
      let chl = 0;
      let u = 0;
      let v = 0;

      if (regionId === 'tsugaru') {
        // Warm Tsugaru current flowing west->east through strait (lat ~41.4-41.7, lon 140.0-141.6)
        const straitCore = Math.exp(-0.5 * ((lat - 41.52) / 0.36) ** 2) * (lon < 142.2 ? 1 : 0.6);
        const latGrad = (42.5 - lat) * 1.45;
        const eddy = Math.sin(lat * 3.1 + lon * 2.4 + month * 0.4) * 0.7;
        baseSst = 13.8 + seasonalSst * 7.2 + warmingDelta + straitCore * 2.8 + latGrad * 0.65 + eddy;

        // Chl-a higher at cold/warm front (east of Shimokita & Esan) + coastal upwelling
        const frontZone = Math.exp(-0.5 * (((lat - 41.65) / 0.55) ** 2 + ((lon - 141.85) / 0.7) ** 2));
        const westFront = Math.exp(-0.5 * (((lat - 41.9) / 0.45) ** 2 + ((lon - 139.9) / 0.4) ** 2));
        chl =
          0.32 +
          (springBloom * 2.1 + autumnBloom * 1.2) * (0.5 + 0.9 * frontZone + 0.6 * westFront) +
          0.25 * deterministicHash(r * 19 + c * 41 + month);

        // Current: strong eastward jet in strait, curving south-east offshore
        u = 0.28 + 0.78 * straitCore;
        v = -0.15 * Math.max(0, lon - 141.3) + 0.12 * Math.sin(lon * 2.1 + month * 0.3);
      } else {
        // Sanriku: sharp thermal front between warm Kuroshio branch (south/east) and cold Oyashio (north/west)
        const frontLat = 39.0 + 0.35 * Math.sin((lon - 142.0) * 1.3 + month * 0.25);
        const frontTransition = 1 / (1 + Math.exp((lat - frontLat) * 2.8));
        const warmCoreEddy = Math.exp(-0.5 * (((lat - 39.4) / 0.4) ** 2 + ((lon - 143.6) / 0.6) ** 2));
        baseSst =
          12.2 +
          seasonalSst * 6.8 +
          warmingDelta +
          frontTransition * 5.4 +
          warmCoreEddy * 2.4 +
          0.5 * Math.cos(lon * 2.5 + lat * 2.2);

        const frontBand = Math.exp(-0.5 * ((lat - frontLat) / 0.38) ** 2);
        const coastal = Math.exp(-0.5 * ((lon - 142.1) / 0.45) ** 2);
        chl =
          0.28 +
          (springBloom * 2.6 + autumnBloom * 1.45) * (0.45 + 1.15 * frontBand + 0.7 * coastal) +
          0.2 * deterministicHash(r * 23 + c * 53 + month);

        u = 0.32 + 0.55 * frontBand * Math.cos(lat - 38.8);
        v = -0.28 * (1 - frontTransition) + 0.35 * frontTransition;
      }

      const currentSpeedMs = Math.min(1.45, Math.sqrt(u * u + v * v));
      const currentDirDeg = ((Math.atan2(u, v) * 180) / Math.PI + 360) % 360;

      // Wave height & wind speed higher offshore and in winter
      const offshoreDist = regionId === 'tsugaru' ? Math.max(0, lon - 141.0) * 0.4 : Math.max(0, lon - 142.0) * 0.35;
      const winterFactor = month <= 3 || month >= 11 ? 0.85 : 0.25;
      const waveHeightM = Number(
        (
          0.75 +
          winterFactor +
          offshoreDist * 0.65 +
          0.45 * Math.sin(lat * 2.2 - lon * 1.4 + month)
        ).toFixed(2)
      );
      const windSpeedMs = Number((5.2 + winterFactor * 4.2 + offshoreDist * 2.2 + (r % 3) * 0.4).toFixed(1));
      const windDirDeg = month >= 10 || month <= 3 ? 305 : 145; // NW winter monsoon / SE summer

      // Historical OBIS density proxy along thermal front & species preference
      const tempSuit = gaussianScore(baseSst, species.optimalSstRange[0], species.optimalSstRange[1]);
      const chlCtx = gaussianScore(chl, species.optimalChlRange[0], species.optimalChlRange[1]);
      const obisCtx = Math.min(1, 0.55 * tempSuit + 0.45 * chlCtx);

      // Exploratory Habitat Index (Design doc §7.2: 0.40 * T + 0.35 * C + 0.25 * H)
      const habitatScore = isCloudGap
        ? null
        : Math.round(100 * (0.4 * tempSuit + 0.35 * chlCtx + 0.25 * obisCtx));

      cells.push({
        row: r,
        col: c,
        lat: Number(lat.toFixed(3)),
        lon: Number(lon.toFixed(3)),
        isLand: false,
        sst: isCloudGap ? null : Number(baseSst.toFixed(2)),
        chlorA: isCloudGap ? null : Number(Math.max(0.08, chl).toFixed(2)),
        currentSpeedMs: Number(currentSpeedMs.toFixed(2)),
        currentDirDeg: Math.round(currentDirDeg),
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

  const labels = ['候補ポイント A（最有力潮目）', '候補ポイント B（プランクトン前線）', '候補ポイント C（沖合比較点）'];
  return picked.map((c, idx) => ({
    id: `hotspot-${idx + 1}`,
    labelJa: labels[idx] ?? `候補ポイント ${idx + 1}`,
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
    rationaleJa: `${species.nameJa}の参照適温帯（${species.optimalSstRange[0]}–${species.optimalSstRange[1]}°C）に対し実測モデル値 ${c.sst?.toFixed(1)}°C、Chl-a ${c.chlorA?.toFixed(2)} mg/m³ が重なる境界域。`,
  }));
}

export function buildObisOccurrences(
  regionId: RegionId,
  speciesId: SpeciesId,
  grid: OceanGridCell[]
): FishOccurrence[] {
  const seaCells = grid.filter((c) => !c.isLand && c.habitatScore !== null);
  const weighted = [...seaCells].sort((a, b) => (b.obisDensity ?? 0) - (a.obisDensity ?? 0));
  const pool = weighted.slice(0, Math.min(85, weighted.length));

  const occurrences: FishOccurrence[] = [];
  const basisOptions: FishOccurrence['basisOfRecord'][] = [
    'HumanObservation',
    'MachineObservation',
    'Occurrence',
  ];

  for (let i = 0; i < 42; i++) {
    const cell = pool[(i * 7) % pool.length];
    if (!cell) continue;
    const jitterLat = (deterministicHash(i * 31 + speciesId.length) - 0.5) * 0.11;
    const jitterLon = (deterministicHash(i * 47 + regionId.length) - 0.5) * 0.12;
    const pt = { lat: cell.lat + jitterLat, lon: cell.lon + jitterLon };
    if (isPointOnLand(regionId, pt)) continue;

    const year = 2015 + (i % 10);
    const month = String(1 + ((i * 3) % 12)).padStart(2, '0');
    const day = String(5 + ((i * 5) % 23)).padStart(2, '0');

    occurrences.push({
      id: `obis-${regionId}-${speciesId}-${i}`,
      speciesId,
      regionId,
      lat: Number(pt.lat.toFixed(3)),
      lon: Number(pt.lon.toFixed(3)),
      observedAt: `${year}-${month}-${day}`,
      basisOfRecord: basisOptions[i % basisOptions.length],
      datasetId: regionId === 'tsugaru' ? 'OBIS-JP-NORTH-2025' : 'OBIS-SANRIKU-MIX-2025',
    });
  }

  return occurrences;
}

/**
 * Generates 10-year monthly time series (2016-01 to 2025-12) for Trend Explorer.
 * Tsugaru SST shows statistically significant warming (+0.052 degC/yr, p < 0.05),
 * while Chl-a shows high interannual/seasonal variance (typically NOT SIGNIFICANT over 10y).
 */
export function buildMonthlyTimeSeries(regionId: RegionId): MonthlyObservation[] {
  const rows: MonthlyObservation[] = [];
  const baseSst = regionId === 'tsugaru' ? 13.4 : 15.8;
  const slopeSst = regionId === 'tsugaru' ? 0.054 : 0.068;
  const baseChl = regionId === 'tsugaru' ? 0.72 : 0.94;
  const slopeChl = regionId === 'tsugaru' ? -0.004 : -0.008;

  for (let year = 2016; year <= 2025; year++) {
    for (let month = 1; month <= 12; month++) {
      const t = year - 2016 + (month - 1) / 12;
      const seasonalSst = 6.9 * Math.sin(((month - 5.5) / 12) * Math.PI * 2);
      const noiseSst = (deterministicHash(year * 100 + month * 13 + regionId.length) - 0.5) * 0.75;

      const spring = 0.78 * Math.exp(-0.5 * ((month - 4.5) / 1.2) ** 2);
      const autumn = 0.42 * Math.exp(-0.5 * ((month - 10.2) / 1.1) ** 2);
      const noiseChl = (deterministicHash(year * 211 + month * 29 + regionId.length) - 0.5) * 0.28;

      // Simulate occasional winter cloud-cover missing month (e.g., Jan 2019 in Tsugaru)
      const isMissing = year === 2019 && month === 1 && regionId === 'tsugaru';
      const cov = isMissing ? 0.22 : 0.72 + deterministicHash(year * 17 + month) * 0.25;

      rows.push({
        year,
        month,
        label: `${year}-${String(month).padStart(2, '0')}`,
        sst: isMissing ? null : Number((baseSst + slopeSst * t + seasonalSst + noiseSst).toFixed(2)),
        chlorA: isMissing
          ? null
          : Number(Math.max(0.14, baseChl + slopeChl * t + spring + autumn + noiseChl).toFixed(3)),
        coverageRatio: Number(cov.toFixed(2)),
      });
    }
  }
  return rows;
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
