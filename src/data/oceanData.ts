import type {
  FishOccurrence,
  HotspotCandidate,
  OceanGridCell,
  PointLatLon,
  RealRegionDataset,
  Region,
  RegionId,
  SpeciesId,
  SpeciesInfo,
  VesselParams,
} from '../types/ocean';
import { planLandAvoidingRoutes } from '../utils/routePlanner';

export const REGIONS: Record<RegionId, Region> = {
  tsugaru: {
    id: 'tsugaru',
    nameJa: '北海道南部・津軽海峡',
    nameEn: 'Hokkaido South / Tsugaru Strait',
    shortNameJa: '北海道南部',
    shortNameEn: 'Tsugaru',
    bbox: { west: 139.5, south: 40.5, east: 143.0, north: 43.0 },
    defaultPort: {
      nameJa: '函館沖 仮想出港点',
      nameEn: 'Offshore Hakodate (Virtual Port)',
      lat: 41.68,
      lon: 140.66,
    },
    descriptionJa:
      '対馬暖流系の津軽暖流と親潮系冷水が交差する実験対象海域（設計書サンプルBBox: 40.5–43.0°N, 139.5–143.0°E）。',
    descriptionEn:
      'Experimental study zone where the warm Tsugaru Current meets cold Oyashio waters (Design spec sample BBox: 40.5–43.0°N, 139.5–143.0°E).',
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
    shortNameJa: '三陸沖',
    shortNameEn: 'Sanriku',
    bbox: { west: 141.5, south: 37.5, east: 145.5, north: 40.5 },
    defaultPort: {
      nameJa: '気仙沼沖 仮想出港点',
      nameEn: 'Offshore Kesennuma (Virtual Port)',
      lat: 38.85,
      lon: 141.72,
    },
    descriptionJa:
      '暖水塊（黒潮続流）と寒流（親潮）が衝突し、明瞭な潮目と植物プランクトン増殖帯が形成される比較海域。',
    descriptionEn:
      'Comparison region where warm Kuroshio Extension eddies collide with the cold Oyashio current, forming sharp thermal fronts and bloom zones.',
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
  houston: {
    id: 'houston',
    nameJa: '米国メキシコ湾岸・ヒューストン沖',
    nameEn: 'US Gulf Coast / Houston–Galveston Offshore',
    shortNameJa: 'ヒューストン沖',
    shortNameEn: 'Houston',
    bbox: { west: -96.2, south: 27.0, east: -92.8, north: 30.0 },
    defaultPort: {
      nameJa: 'ガルベストン沖 仮想出港点',
      nameEn: 'Offshore Galveston (Virtual Port)',
      lat: 29.24,
      lon: -94.68,
    },
    descriptionJa:
      'テキサス州ヒューストン／ガルベストン湾沖のメキシコ湾北西部（27.0–30.0°N, 96.2–92.8°W）。沿岸栄養塩プルームと沖合暖水渦、CYGNSS強風帯域を含む比較海域。',
    descriptionEn:
      'NW Gulf of Mexico off Houston / Galveston Bay, TX (27.0–30.0°N, 96.2–92.8°W), featuring coastal nutrient plumes, Loop Current eddies, and CYGNSS wind coverage.',
    landPolygons: [
      // Texas & Louisiana Gulf Coastline (Galveston Bay indented)
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

export interface NasaSourceMeta {
  datasetId: string;
  productJa: string;
  productEn: string;
  producer: string;
  variable: string;
  unit: string;
  mirror: string;
}

export const NASA_SOURCES: Record<'sst' | 'chlor_a', NasaSourceMeta> = {
  sst: {
    datasetId: 'jplMURSST41mday',
    productJa: 'GHRSST Level 4 MUR Global Foundation SST Analysis v4.1（月次）',
    productEn: 'GHRSST Level 4 MUR Global Foundation SST Analysis v4.1 (Monthly)',
    producer: 'NASA JPL',
    variable: 'analysed_sst',
    unit: '°C',
    mirror: 'NOAA CoastWatch ERDDAP',
  },
  chlor_a: {
    datasetId: 'erdMH1chlamday_R2022SQ',
    productJa: 'Chlorophyll-a, Aqua MODIS, NPP, L3SMI, Global 4km, R2022 Science Quality（月次）',
    productEn: 'Chlorophyll-a, Aqua MODIS, NPP, L3SMI, Global 4km, R2022 Science Quality (Monthly)',
    producer: 'NASA OB.DAAC',
    variable: 'chlor_a',
    unit: 'mg m⁻³',
    mirror: 'NOAA CoastWatch ERDDAP',
  },
};

export function formatNasaSource(variable: 'sst' | 'chlor_a', locale: 'ja' | 'en'): string {
  const meta = NASA_SOURCES[variable];
  if (locale === 'ja') {
    return `${meta.producer}: ${meta.productJa} [${meta.datasetId}]（配信: ${meta.mirror}）`;
  }
  return `${meta.producer}: ${meta.productEn} [${meta.datasetId}] (Mirror: ${meta.mirror})`;
}

export const SPECIES_LIST: Record<SpeciesId, SpeciesInfo> = {
  thunnus_orientalis: {
    id: 'thunnus_orientalis',
    scientificName: 'Thunnus orientalis',
    nameJa: 'クロマグロ',
    nameEn: 'Pacific Bluefin Tuna',
    optimalSstRange: [15.0, 21.5],
    optimalChlRange: [0.35, 1.4],
    forageNoteJa: '潮目周辺のイワシ・スルメイカ等の餌生物（高次捕食対象）が集まりやすい水温前線域に過去の回遊記録が集中。',
    forageNoteEn: 'Historical migration records concentrate along thermal fronts where prey such as sardines and squid aggregate.',
    obisCountTsugaru: 2,
    obisCountSanriku: 9,
    obisCountHouston: 0,
  },
  oncorhynchus_keta: {
    id: 'oncorhynchus_keta',
    scientificName: 'Oncorhynchus keta',
    nameJa: 'サケ（シロザケ）',
    nameEn: 'Chum Salmon',
    optimalSstRange: [7.5, 13.5],
    optimalChlRange: [0.6, 2.5],
    forageNoteJa: '親潮系の冷水域と基礎生産が高い混合域に分布する傾向。高水温化による分布域の北上傾向の検証対象。',
    forageNoteEn: 'Tends to distribute in cold Oyashio waters and productive mixing zones; key target for tracking poleward shifts under ocean warming.',
    obisCountTsugaru: 8,
    obisCountSanriku: 1,
    obisCountHouston: 0,
  },
  sardinops_melanostictus: {
    id: 'sardinops_melanostictus',
    scientificName: 'Sardinops melanostictus',
    nameJa: 'マイワシ',
    nameEn: 'Japanese Sardine',
    optimalSstRange: [12.0, 18.5],
    optimalChlRange: [0.8, 3.8],
    forageNoteJa: '植物プランクトン（Chl-a高濃度帯）を直接・間接的に利用する小型浮魚類。大型魚の餌密集ポイントの指標候補。',
    forageNoteEn: 'Small pelagic species utilizing high Chl-a phytoplankton zones; acts as a forage-aggregation proxy for larger predators.',
    obisCountTsugaru: 7,
    obisCountSanriku: 0,
    obisCountHouston: 0,
  },
  thunnus_albacares: {
    id: 'thunnus_albacares',
    scientificName: 'Thunnus albacares',
    nameJa: 'キハダマグロ',
    nameEn: 'Yellowfin Tuna',
    optimalSstRange: [21.5, 28.5],
    optimalChlRange: [0.2, 1.2],
    forageNoteJa: 'メキシコ湾などの暖水域でループ海流境界や沿岸プルーム外縁の餌場（トビウオ・小型マグロ類）に集積する回遊性魚種。',
    forageNoteEn: 'Migratory predator in warm Gulf waters aggregating along Loop Current eddies and outer coastal nutrient plumes.',
    obisCountTsugaru: 0,
    obisCountSanriku: 0,
    obisCountHouston: 4011,
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
 * Builds the 20 rows x 26 cols ocean grid for a given region, year, month, and species.
 * - SST & Chl-a: uses REAL NASA JPL (jplMURSST41mday) & NASA OB.DAAC (erdMH1chlamday_R2022SQ)
 *   observations fetched via NOAA CoastWatch ERDDAP. Missing/cloud pixels remain null (never 0-filled).
 * - OBIS Density: uses exact cell hits of REAL OBIS v3 records (never padded or interpolated).
 * - Currents, Surface Winds & Waves: seasonal physical field model for route estimation comparison.
 */
export function buildOceanGrid(
  regionId: RegionId,
  year: number,
  month: number,
  speciesId: SpeciesId,
  realRegionData?: RealRegionDataset | null,
  realOccurrences: FishOccurrence[] = []
): OceanGridCell[] {
  const region = REGIONS[regionId];
  const species = SPECIES_LIST[speciesId];
  const rows = 20;
  const cols = 26;
  const dLat = (region.bbox.north - region.bbox.south) / rows;
  const dLon = (region.bbox.east - region.bbox.west) / cols;

  const ymKey = `${year}-${String(month).padStart(2, '0')}`;
  const realSlice = realRegionData?.grids?.[ymKey];

  // Pre-count exact real OBIS points per grid cell (no padding, no spatial interpolation)
  const obisCellCounts = new Array<number>(rows * cols).fill(0);
  for (const occ of realOccurrences) {
    if (occ.regionId !== regionId || occ.speciesId !== speciesId) continue;
    let r = Math.floor((region.bbox.north - occ.lat) / dLat);
    let c = Math.floor((occ.lon - region.bbox.west) / dLon);
    if (r === rows) r = rows - 1;
    if (c === cols) c = cols - 1;
    if (r >= 0 && r < rows && c >= 0 && c < cols) {
      obisCellCounts[r * cols + c] += 1;
    }
  }

  // Seasonal cycle only used for modeled physical overlays (currents/winds/waves)
  const seasonalSst = Math.sin(((month - 5.5) / 12) * Math.PI * 2);

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

      // Real NASA satellite values (null when cloud-obscured or not yet loaded)
      const cellIdx = r * cols + c;
      const realSst = realSlice ? realSlice.sst[cellIdx] ?? null : null;
      const realChl = realSlice ? realSlice.chlorA[cellIdx] ?? null : null;

      let u = 0;
      let v = 0;

      if (regionId === 'tsugaru') {
        const straitCore = Math.exp(-0.5 * ((lat - 41.52) / 0.36) ** 2) * (lon < 142.2 ? 1 : 0.6);
        u = 0.28 + 0.78 * straitCore;
        v = -0.15 * Math.max(0, lon - 141.3) + 0.12 * Math.sin(lon * 2.1 + month * 0.3);
      } else if (regionId === 'sanriku') {
        const frontLat = 39.0 + 0.35 * Math.sin((lon - 142.0) * 1.3 + month * 0.25);
        const frontTransition = 1 / (1 + Math.exp((lat - frontLat) * 2.8));
        const frontBand = Math.exp(-0.5 * ((lat - frontLat) / 0.38) ** 2);
        u = 0.32 + 0.55 * frontBand * Math.cos(lat - 38.8);
        v = -0.28 * (1 - frontTransition) + 0.35 * frontTransition;
      } else {
        const shelfDist = Math.max(0, 29.4 - lat);
        const loopEddy = Math.exp(-0.5 * (((lat - 27.6) / 0.65) ** 2 + ((lon + 93.7) / 0.85) ** 2));
        const eddyDx = lon + 93.7;
        const eddyDy = lat - 27.6;
        u = -0.34 * Math.exp(-shelfDist * 0.9) + 0.55 * loopEddy * eddyDy;
        v = -0.08 * Math.exp(-shelfDist * 0.9) - 0.55 * loopEddy * eddyDx;
      }

      const currentSpeedMs = Math.min(1.45, Math.sqrt(u * u + v * v));
      const currentDirDeg = ((Math.atan2(u, v) * 180) / Math.PI + 360) % 360;

      // Modeled wave height & wind speed (higher offshore and in winter, with realistic coastal lee shelter & swell corridors)
      const winterFactor = month <= 3 || month >= 11 ? 0.85 : 0.25;
      let swellCore = 0;
      let leeShelter = 0;
      let offshoreDist = 0;

      if (regionId === 'tsugaru') {
        offshoreDist = Math.max(0, lon - 140.9) * 0.48;
        // Pacific swell entering Tsugaru / Hidaka approach & offshore cape zone
        swellCore =
          0.95 *
          Math.exp(-0.5 * (((lat - 41.92) / 0.38) ** 2 + ((lon - 141.68) / 0.42) ** 2));
        // Inner Uchiura Bay & leeward Oshima shelf sheltered from Pacific swell & NW monsoon
        leeShelter =
          0.65 *
          Math.exp(-0.5 * (((lat - 42.22) / 0.38) ** 2 + ((lon - 140.92) / 0.36) ** 2));
      } else if (regionId === 'sanriku') {
        offshoreDist = Math.max(0, lon - 141.65) * 0.45;
        // Confluence frontal rough-sea zone offshore of Miyako/Kamaishi
        swellCore =
          1.05 *
          Math.exp(-0.5 * (((lat - 39.45) / 0.55) ** 2 + ((lon - 142.45) / 0.65) ** 2));
        leeShelter =
          0.55 *
          Math.exp(-0.5 * (((lat - 39.3) / 0.7) ** 2 + ((lon - 141.92) / 0.22) ** 2));
      } else {
        offshoreDist = Math.max(0, 29.35 - lat) * 0.5;
        // Mid-shelf wind-sea buildup south of Galveston
        swellCore =
          0.95 *
          Math.exp(-0.5 * (((lat - 28.45) / 0.42) ** 2 + ((lon + 94.85) / 0.75) ** 2));
        leeShelter =
          0.5 *
          Math.exp(-0.5 * (((lat - 28.85) / 0.35) ** 2 + ((lon + 95.35) / 0.45) ** 2));
      }

      const waveHeightM = Number(
        Math.max(
          0.45,
          0.65 +
            winterFactor * 0.75 +
            offshoreDist * 0.68 +
            swellCore -
            leeShelter +
            0.28 * Math.sin(lat * 2.2 - lon * 1.4 + month + seasonalSst * 0.1)
        ).toFixed(2)
      );
      const baseWindDir =
        regionId === 'houston'
          ? month >= 11 || month <= 2
            ? 35
            : 142
          : month >= 10 || month <= 3
            ? 305
            : month >= 6 && month <= 8
              ? 148
              : 245;
      const windSpatialTurn =
        regionId === 'tsugaru'
          ? 14 * Math.sin((lon - 140.5) * 1.6) - 8 * (lat - 41.5)
          : regionId === 'sanriku'
            ? 12 * Math.cos((lat - 39.0) * 1.4) + 6 * (lon - 143.0)
            : 10 * Math.sin((lon + 94.5) * 1.3) + 6 * (lat - 28.5);
      const windDirDeg = Math.round(((baseWindDir + windSpatialTurn) % 360 + 360) % 360);
      const straitFunnel =
        regionId === 'tsugaru' ? 1.8 * Math.exp(-0.5 * ((lat - 41.55) / 0.35) ** 2) : 0;
      const windSpeedMs = Number(
        Math.max(
          2.5,
          4.5 +
            winterFactor * 4.0 +
            offshoreDist * 2.2 +
            swellCore * 3.1 -
            leeShelter * 2.4 +
            straitFunnel +
            0.8 * Math.sin(lat * 1.8 + lon * 1.3 + month * 0.7)
        ).toFixed(1)
      );

      const tempSuit =
        realSst !== null
          ? gaussianScore(realSst, species.optimalSstRange[0], species.optimalSstRange[1])
          : 0;
      const chlCtx =
        realChl !== null
          ? gaussianScore(realChl, species.optimalChlRange[0], species.optimalChlRange[1])
          : 0;
      // Strict non-interpolated OBIS context: only exact cell matches contribute (0 if no record)
      const cellObisHits = obisCellCounts[cellIdx];
      const obisCtx = cellObisHits > 0 ? Math.min(1, cellObisHits * 0.5) : 0;

      // Exploratory Habitat Index (Design doc §7.2: 0.40 * T + 0.35 * C + 0.25 * H)
      const habitatScore =
        realSst !== null && realChl !== null
          ? Math.round(100 * (0.4 * tempSuit + 0.35 * chlCtx + 0.25 * obisCtx))
          : null;

      cells.push({
        row: r,
        col: c,
        lat: Number(lat.toFixed(3)),
        lon: Number(lon.toFixed(3)),
        isLand: false,
        sst: realSst,
        chlorA: realChl,
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
  const complete = grid
    .filter((c) => !c.isLand && c.habitatScore !== null && c.sst !== null && c.chlorA !== null)
    .sort((a, b) => (b.habitatScore ?? 0) - (a.habitatScore ?? 0));

  // If severe cloud cover obscures Chl-a across nearly all cells, supplement with SST-valid cells
  const sstOnly = grid
    .filter((c) => !c.isLand && c.sst !== null && c.habitatScore === null)
    .sort((a, b) => b.tempSuitability - a.tempSuitability);

  const candidates = complete.length >= 3 ? complete : [...complete, ...sstOnly];

  const picked: OceanGridCell[] = [];
  for (const cell of candidates) {
    const farEnough = picked.every(
      (p) => Math.hypot(p.lat - cell.lat, p.lon - cell.lon) > 0.72
    );
    if (farEnough) picked.push(cell);
    if (picked.length >= 3) break;
  }

  // Fallback if real grid is still loading
  if (picked.length === 0) {
    const seaFallback = grid.filter((c) => !c.isLand);
    if (seaFallback.length > 0) {
      picked.push(seaFallback[Math.floor(seaFallback.length / 2)]);
    }
  }

  const labelsJa = ['候補ポイント A（最有力潮目）', '候補ポイント B（プランクトン前線）', '候補ポイント C（沖合比較点）'];
  const labelsEn = ['Candidate A (Primary Thermal Front)', 'Candidate B (Plankton Front)', 'Candidate C (Offshore Reference)'];
  const shortJa = ['最有力潮目', 'プランクトン前線', '沖合比較点'];
  const shortEn = ['Primary Front', 'Plankton Front', 'Offshore Ref.'];
  return picked.map((c, idx) => {
    const effectiveScore =
      c.habitatScore !== null ? c.habitatScore : Math.round(100 * (0.4 * c.tempSuitability));
    return {
      id: `hotspot-${idx + 1}`,
      labelJa: labelsJa[idx] ?? `候補ポイント ${idx + 1}`,
      labelEn: labelsEn[idx] ?? `Candidate ${idx + 1}`,
      shortTitleJa: shortJa[idx] ?? `候補 ${idx + 1}`,
      shortTitleEn: shortEn[idx] ?? `Point ${idx + 1}`,
      lat: c.lat,
      lon: c.lon,
      sst: c.sst ?? 0,
      chlorA: c.chlorA ?? 0,
      habitatScore: effectiveScore,
      tempSuitability: c.tempSuitability,
      chlContext: c.chlContext,
      obisContext: c.obisContext,
      currentSpeedMs: c.currentSpeedMs,
      waveHeightM: c.waveHeightM,
      rationaleJa:
        c.sst !== null && c.chlorA !== null
          ? `${species.nameJa}の参照適温帯（${species.optimalSstRange[0]}–${species.optimalSstRange[1]}°C）に対しNASA実測SST ${c.sst.toFixed(1)}°C、Chl-a ${c.chlorA.toFixed(2)} mg/m³ が観測された境界域。`
          : c.sst !== null
            ? `${species.nameJa}の参照適温帯（${species.optimalSstRange[0]}–${species.optimalSstRange[1]}°C）に対しNASA実測SST ${c.sst.toFixed(1)}°C を観測（Chl-aは雲欠損）。`
            : `${species.nameJa}の参照海域データ読み込み待機中。`,
      rationaleEn:
        c.sst !== null && c.chlorA !== null
          ? `Observed NASA SST ${c.sst.toFixed(1)}°C and Chl-a ${c.chlorA.toFixed(2)} mg/m³ overlapping ${species.nameEn} reference range (${species.optimalSstRange[0]}–${species.optimalSstRange[1]}°C).`
          : c.sst !== null
            ? `Observed NASA SST ${c.sst.toFixed(1)}°C relative to ${species.nameEn} reference range (${species.optimalSstRange[0]}–${species.optimalSstRange[1]}°C); Chl-a cloud-masked.`
            : `Awaiting NASA observation snapshot for ${species.nameEn}.`,
    };
  });
}

export function filterObisOccurrences(
  allOccurrences: FishOccurrence[],
  regionId: RegionId,
  speciesId: SpeciesId
): FishOccurrence[] {
  return allOccurrences.filter(
    (occ) => occ.regionId === regionId && occ.speciesId === speciesId
  );
}

export function buildCandidateRoutes(
  origin: PointLatLon,
  dest: PointLatLon,
  regionId: RegionId,
  projectedGrid?: OceanGridCell[],
  vessel?: VesselParams
): { routeA: PointLatLon[]; routeB: PointLatLon[] } {
  return planLandAvoidingRoutes(REGIONS[regionId], origin, dest, projectedGrid, vessel);
}
