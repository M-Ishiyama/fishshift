export type Locale = 'ja' | 'en';

export type TabId = 'map' | 'trends' | 'routes' | 'slides' | 'feasibility';

export type RegionId = 'tsugaru' | 'sanriku' | 'houston';

export type SpeciesId =
  | 'thunnus_orientalis'
  | 'oncorhynchus_keta'
  | 'sardinops_melanostictus'
  | 'thunnus_albacares';

export type MapLayer = 'sst' | 'chlor_a' | 'habitat';

export interface BBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface PointLatLon {
  lat: number;
  lon: number;
}

export interface Region {
  id: RegionId;
  nameJa: string;
  nameEn: string;
  shortNameJa: string;
  shortNameEn: string;
  bbox: BBox;
  defaultPort: {
    nameJa: string;
    nameEn: string;
    lat: number;
    lon: number;
  };
  landPolygons: PointLatLon[][];
  descriptionJa: string;
  descriptionEn: string;
}

export interface SpeciesInfo {
  id: SpeciesId;
  scientificName: string;
  nameJa: string;
  nameEn: string;
  optimalSstRange: [number, number]; // degC (exploratory reference)
  optimalChlRange: [number, number]; // mg/m3 (exploratory reference)
  forageNoteJa: string;
  forageNoteEn: string;
  obisCountTsugaru: number;
  obisCountSanriku: number;
  obisCountHouston: number;
}

export interface OceanGridCell {
  row: number;
  col: number;
  lat: number;
  lon: number;
  isLand: boolean;
  sst: number | null; // degC
  chlorA: number | null; // mg/m3
  currentSpeedMs: number; // m/s
  currentDirDeg: number; // direction flowing TO (deg clockwise from N)
  waveHeightM: number; // meters
  windSpeedMs: number; // m/s
  windDirDeg: number;
  obisDensity: number; // 0..1 historical point density (exact cell match, never interpolated)
  habitatScore: number | null; // 0..100 exploratory index
  tempSuitability: number; // 0..1
  chlContext: number; // 0..1
  obisContext: number; // 0..1
}

export interface FishOccurrence {
  id: string;
  speciesId: SpeciesId;
  regionId: RegionId;
  lat: number;
  lon: number;
  observedAt: string;
  basisOfRecord: 'HumanObservation' | 'MachineObservation' | 'Occurrence';
  datasetId: string;
}

export interface ObisCountSummary {
  totalCount: number;
  returnedCount: number;
  datasetCount: number;
}

export interface ObisDatasetSnapshot {
  source: string;
  endpoint: string;
  fetchedAt: string;
  counts: Record<RegionId, Record<SpeciesId, ObisCountSummary>>;
  datasets: Record<string, { id: string; name: string }>;
  occurrences: FishOccurrence[];
}

export interface RealRegionGridSlice {
  sst: (number | null)[];
  chlorA: (number | null)[];
}

export interface RealRegionDataset {
  regionId: RegionId;
  rows: number;
  cols: number;
  seaCellCount: number;
  fetchedAt: string;
  monthlySeries: MonthlyObservation[];
  grids: Record<string, RealRegionGridSlice>;
}

export interface HotspotCandidate {
  id: string;
  labelJa: string;
  labelEn: string;
  shortTitleJa: string;
  shortTitleEn: string;
  lat: number;
  lon: number;
  sst: number;
  chlorA: number;
  habitatScore: number;
  tempSuitability: number;
  chlContext: number;
  obisContext: number;
  currentSpeedMs: number;
  waveHeightM: number;
  rationaleJa: string;
  rationaleEn: string;
}

export interface MonthlyObservation {
  year: number;
  month: number; // 1..12
  label: string; // YYYY-MM
  sst: number | null;
  chlorA: number | null;
  coverageRatio: number; // 0..1 valid pixels
  sstCoverage?: number;
  chlCoverage?: number;
}

export type TrendStatus = 'SIGNIFICANT' | 'NOT SIGNIFICANT' | 'INSUFFICIENT DATA';

export interface TrendResult {
  variable: 'sst' | 'chlor_a';
  regionId: RegionId;
  n: number;
  slopePerYear: number | null;
  intercept: number | null;
  rSquared: number | null;
  pValue: number | null;
  ci95Low: number | null;
  ci95High: number | null;
  meanValue: number | null;
  meanCoverage: number;
  status: TrendStatus;
  unit: string;
  method: string;
}

export type ConditionBasis = 'historical_climatology' | 'next_day_forecast';

export type DepartureSlot = '04:00' | '09:00' | '15:00';

export type FuelType = 'gasoline' | 'diesel';

export interface VesselParams {
  fuelType: FuelType;
  speedKnots: number;
  fuelLitersPerHour: number;
  fuelPriceYenPerLiter: number;
  waveDragFactor: number; // additional fuel/drag sensitivity per meter of wave height
  windDragFactor: number; // aerodynamic hull drag sensitivity to headwind/tailwind
}

export interface RouteWaypointMetric {
  lat: number;
  lon: number;
  segmentKm: number;
  currentAssistKnots: number;
  windAssistKnots: number;
  waveHeightM: number;
  windSpeedMs: number;
  effectiveSpeedKnots: number;
}

export interface RouteEstimate {
  routeId: 'A' | 'B';
  labelJa: string;
  labelEn: string;
  strategyEn: string;
  points: PointLatLon[];
  waypoints: RouteWaypointMetric[];
  distanceKm: number;
  durationHours: number;
  estimatedFuelLiters: number;
  estimatedFuelCostYen: number;
  avgWaveHeightM: number;
  maxWaveHeightM: number;
  avgWindSpeedMs: number;
  avgCurrentAssistKnots: number;
  avgWindAssistKnots: number;
  cautionNoteJa: string;
  cautionNoteEn: string;
}

