export type TabId = 'map' | 'trends' | 'routes' | 'slides' | 'feasibility';

export type RegionId = 'tsugaru' | 'sanriku';

export type SpeciesId = 'thunnus_orientalis' | 'oncorhynchus_keta' | 'sardinops_melanostictus';

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
  bbox: BBox;
  defaultPort: {
    nameJa: string;
    lat: number;
    lon: number;
  };
  landPolygons: PointLatLon[][];
  descriptionJa: string;
}

export interface SpeciesInfo {
  id: SpeciesId;
  scientificName: string;
  nameJa: string;
  nameEn: string;
  optimalSstRange: [number, number]; // degC (exploratory reference)
  optimalChlRange: [number, number]; // mg/m3 (exploratory reference)
  forageNoteJa: string;
  obisCountTsugaru: number;
  obisCountSanriku: number;
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
  obisDensity: number; // 0..1 normalized historical density
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

export interface HotspotCandidate {
  id: string;
  labelJa: string;
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
}

export interface MonthlyObservation {
  year: number;
  month: number; // 1..12
  label: string; // YYYY-MM
  sst: number | null;
  chlorA: number | null;
  coverageRatio: number; // 0..1 valid pixels
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

export interface VesselParams {
  speedKnots: number;
  fuelLitersPerHour: number;
  fuelPriceYenPerLiter: number;
  waveDragFactor: number; // additional fuel/drag sensitivity per meter of wave height
}

export interface RouteWaypointMetric {
  lat: number;
  lon: number;
  segmentKm: number;
  currentAssistKnots: number;
  waveHeightM: number;
  windSpeedMs: number;
  effectiveSpeedKnots: number;
}

export interface RouteEstimate {
  routeId: 'A' | 'B';
  labelJa: string;
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
  cautionNoteJa: string;
}
