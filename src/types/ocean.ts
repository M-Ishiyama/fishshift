export type TabId = 'map' | 'trends' | 'routes';

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

/**
 * Dictionary keys for text that has no English twin in the data itself.
 * Declared as template-literal types so this module stays independent of i18n.
 */
export type RegionDescriptionKey = `region.${RegionId}.description`;
export type RegionShortNameKey = `region.${RegionId}.shortName`;
export type PortNameKey = `region.${RegionId}.port`;
export type ForageNoteKey = `species.${SpeciesId}.forageNote`;

export interface Region {
  id: RegionId;
  nameJa: string;
  nameEn: string;
  /** Abbreviated form for narrow toggle buttons. */
  shortNameKey: RegionShortNameKey;
  bbox: BBox;
  defaultPort: {
    nameKey: PortNameKey;
    lat: number;
    lon: number;
  };
  landPolygons: PointLatLon[][];
  descriptionKey: RegionDescriptionKey;
}

export interface SpeciesInfo {
  id: SpeciesId;
  scientificName: string;
  nameJa: string;
  nameEn: string;
  optimalSstRange: [number, number]; // degC (exploratory reference)
  optimalChlRange: [number, number]; // mg/m3 (exploratory reference)
  forageNoteKey: ForageNoteKey;
  // Measured OBIS record counts (all-time, per region). Real coverage is sparse.
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

export type HotspotDescriptorKey =
  | 'hotspot.descriptor.primaryFront'
  | 'hotspot.descriptor.planktonFront'
  | 'hotspot.descriptor.offshoreReference'
  | 'hotspot.descriptor.generic';

/**
 * Inputs for the "why this point" sentence, kept as numbers so the wording and
 * the number formatting are both decided by the active locale at render time.
 */
export interface HotspotRationale {
  speciesId: SpeciesId;
  optimalSstLow: number;
  optimalSstHigh: number;
  sst: number;
  chlorA: number;
}

export interface HotspotCandidate {
  id: string;
  /** Display letter (A/B/C), kept separate from its descriptor so neither has to be parsed back out. */
  letter: string;
  descriptorKey: HotspotDescriptorKey;
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
  rationale: HotspotRationale;
}

export interface MonthlyObservation {
  year: number;
  month: number; // 1..12
  label: string; // YYYY-MM
  sst: number | null;
  chlorA: number | null;
  coverageRatio: number; // 0..1 valid pixels
}

/** Whether a displayed value is a real observation or a parametric estimate. */
export type DataKind = 'observed' | 'estimated';

/** Acquisition trail for a prefetched product (design doc 6.3). */
export interface Provenance {
  dataset_id: string;
  provider: string;
  product_name: string;
  /** NASA product name, shown first so the producer is unambiguous. */
  nasa_short_name?: string;
  /** NASA platform/sensor behind the product. */
  nasa_platform?: string;
  /** Redistribution path (a mirror; not the data's producer). */
  distribution?: string;
  variable: string;
  unit: string;
  source_url: string;
  observation_start: string;
  observation_end: string;
  retrieved_at_utc: string;
  processing: string;
  license_note: string;
  data_kind: DataKind;
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

export type RouteLabelKey = 'route.a.label' | 'route.b.label';

export type CautionKind = 'calm' | 'roughSeas' | 'favorableCurrent' | 'adverseCurrent';

/**
 * Which caution applies, plus the numbers it cites. The sentence itself lives in
 * the dictionaries, so the math layer never builds display text.
 */
export interface CautionNote {
  kind: CautionKind;
  maxWaveM: number;
  avgWindMs: number;
  avgAssistKnots: number;
}

export interface RouteEstimate {
  routeId: 'A' | 'B';
  labelKey: RouteLabelKey;
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
  caution: CautionNote;
}
