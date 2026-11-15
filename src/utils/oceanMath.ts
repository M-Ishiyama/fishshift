import type {
  CautionKind,
  MonthlyObservation,
  OceanGridCell,
  PointLatLon,
  RouteEstimate,
  RouteLabelKey,
  RouteWaypointMetric,
  TrendResult,
  VesselParams,
} from '../types/ocean';

const KNOT_TO_KMH = 1.852;
const MS_TO_KNOTS = 1.94384;

export function haversineKm(a: PointLatLon, b: PointLatLon): number {
  const R = 6371.0;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function bearingDeg(a: PointLatLon, b: PointLatLon): number {
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/**
 * Pure TypeScript Student-t two-tailed p-value approximation via numerical Simpson integration
 * of the t-distribution PDF for exact alignment with SciPy linregress behavior on small/medium N.
 */
function gammaLn(z: number): number {
  const cof = [
    76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5,
  ];
  let x = z;
  let y = z;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) {
    y += 1;
    ser += cof[j] / y;
  }
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

function tPdf(t: number, df: number): number {
  const c = Math.exp(gammaLn((df + 1) / 2) - gammaLn(df / 2)) / Math.sqrt(df * Math.PI);
  return c * Math.pow(1 + (t * t) / df, -(df + 1) / 2);
}

function twoTailedPValueFromT(tAbs: number, df: number): number {
  if (df <= 0 || !Number.isFinite(tAbs)) return 1;
  if (tAbs === 0) return 1;
  // Integrate PDF from 0 to tAbs with Simpson's rule (200 steps), then 1 - 2 * integral
  const upper = Math.min(tAbs, 30);
  const steps = 200;
  const h = upper / steps;
  let sum = tPdf(0, df) + tPdf(upper, df);
  for (let i = 1; i < steps; i++) {
    const x = i * h;
    sum += (i % 2 === 0 ? 2 : 4) * tPdf(x, df);
  }
  const cdfHalf = (h / 3) * sum;
  const p = Math.max(0, Math.min(1, 1 - 2 * cdfHalf));
  return p;
}

function tCritical95(df: number): number {
  const table: Record<number, number> = {
    1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571,
    6: 2.447, 7: 2.365, 8: 2.306, 9: 2.262, 10: 2.228,
    11: 2.201, 12: 2.179, 15: 2.131, 20: 2.086, 30: 2.042,
  };
  if (table[df]) return table[df];
  if (df > 30) return 1.96 + 2.4 / df;
  return 2.228;
}

export interface AnnualPoint {
  year: number;
  value: number | null;
  validMonths: number;
  coverageRatio: number;
}

export function aggregateAnnualSeries(
  monthly: MonthlyObservation[],
  variable: 'sst' | 'chlor_a',
  minMonthsPerYear = 9
): AnnualPoint[] {
  const byYear = new Map<number, MonthlyObservation[]>();
  for (const row of monthly) {
    const arr = byYear.get(row.year) ?? [];
    arr.push(row);
    byYear.set(row.year, arr);
  }

  const years = Array.from(byYear.keys()).sort((a, b) => a - b);
  return years.map((year) => {
    const rows = byYear.get(year) ?? [];
    const valid = rows
      .map((r) => ({
        val: variable === 'sst' ? r.sst : r.chlorA,
        cov: r.coverageRatio,
      }))
      .filter((x): x is { val: number; cov: number } => x.val !== null && Number.isFinite(x.val));

    if (valid.length < minMonthsPerYear) {
      return {
        year,
        value: null,
        validMonths: valid.length,
        coverageRatio: rows.length > 0 ? rows.reduce((s, r) => s + r.coverageRatio, 0) / rows.length : 0,
      };
    }

    const avg = valid.reduce((s, x) => s + x.val, 0) / valid.length;
    const cov = valid.reduce((s, x) => s + x.cov, 0) / valid.length;
    return {
      year,
      value: Number(avg.toFixed(4)),
      validMonths: valid.length,
      coverageRatio: cov,
    };
  });
}

export function computeLinearTrend(
  points: { x: number; y: number | null; coverage: number }[],
  variable: 'sst' | 'chlor_a',
  regionId: 'tsugaru' | 'sanriku',
  method: string
): TrendResult {
  const unit = variable === 'sst' ? '°C' : 'mg/m³';
  const valid = points.filter((p): p is { x: number; y: number; coverage: number } => p.y !== null && Number.isFinite(p.y));
  const n = valid.length;
  const meanCoverage =
    valid.length > 0 ? valid.reduce((s, p) => s + p.coverage, 0) / valid.length : 0;

  if (n < 3) {
    return {
      variable,
      regionId,
      n,
      slopePerYear: null,
      intercept: null,
      rSquared: null,
      pValue: null,
      ci95Low: null,
      ci95High: null,
      meanValue: n > 0 ? valid.reduce((s, p) => s + p.y, 0) / n : null,
      meanCoverage,
      status: 'INSUFFICIENT DATA',
      unit,
      method,
    };
  }

  const meanX = valid.reduce((s, p) => s + p.x, 0) / n;
  const meanY = valid.reduce((s, p) => s + p.y, 0) / n;

  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  for (const p of valid) {
    const dx = p.x - meanX;
    const dy = p.y - meanY;
    sxx += dx * dx;
    syy += dy * dy;
    sxy += dx * dy;
  }

  if (sxx === 0 || syy === 0) {
    return {
      variable,
      regionId,
      n,
      slopePerYear: 0,
      intercept: meanY,
      rSquared: 0,
      pValue: null,
      ci95Low: null,
      ci95High: null,
      meanValue: meanY,
      meanCoverage,
      status: 'INSUFFICIENT DATA',
      unit,
      method,
    };
  }

  const slope = sxy / sxx;
  const intercept = meanY - slope * meanX;
  const rSquared = (sxy * sxy) / (sxx * syy);

  let sse = 0;
  for (const p of valid) {
    const resid = p.y - (intercept + slope * p.x);
    sse += resid * resid;
  }

  const df = n - 2;
  const mse = sse / df;
  const stdErrSlope = Math.sqrt(mse / sxx);
  const tStat = stdErrSlope > 0 ? Math.abs(slope / stdErrSlope) : 0;
  const pValue = twoTailedPValueFromT(tStat, df);
  const tCrit = tCritical95(df);

  return {
    variable,
    regionId,
    n,
    slopePerYear: slope,
    intercept,
    rSquared,
    pValue,
    ci95Low: slope - tCrit * stdErrSlope,
    ci95High: slope + tCrit * stdErrSlope,
    meanValue: meanY,
    meanCoverage,
    status: pValue < 0.05 ? 'SIGNIFICANT' : 'NOT SIGNIFICANT',
    unit,
    method,
  };
}

function sampleGridCondition(grid: OceanGridCell[], pt: PointLatLon): OceanGridCell {
  let best = grid[0];
  let bestDist = Infinity;
  for (const cell of grid) {
    if (cell.isLand) continue;
    const d = (cell.lat - pt.lat) ** 2 + (cell.lon - pt.lon) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = cell;
    }
  }
  return best;
}

export function calculateRouteEstimate(
  routeId: 'A' | 'B',
  labelKey: RouteLabelKey,
  strategyEn: string,
  points: PointLatLon[],
  grid: OceanGridCell[],
  vessel: VesselParams
): RouteEstimate {
  let totalKm = 0;
  let totalHours = 0;
  let totalFuel = 0;
  let waveSum = 0;
  let maxWave = 0;
  let windSum = 0;
  let assistSum = 0;
  const waypoints: RouteWaypointMetric[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const segKm = haversineKm(p1, p2);
    const mid: PointLatLon = { lat: (p1.lat + p2.lat) / 2, lon: (p1.lon + p2.lon) / 2 };
    const cond = sampleGridCondition(grid, mid);

    const vesselHeading = bearingDeg(p1, p2);
    const angleDiffRad = ((cond.currentDirDeg - vesselHeading) * Math.PI) / 180;
    const currentAssistKnots = cond.currentSpeedMs * MS_TO_KNOTS * Math.cos(angleDiffRad);

    // Assumed wave-drag speed penalty & fuel sensitivity (explicitly modeled as estimation)
    const wavePenaltyKnots = Math.max(0, (cond.waveHeightM - 0.6) * 0.65 * vessel.waveDragFactor);
    const effectiveSpeedKnots = Math.max(4.5, vessel.speedKnots + currentAssistKnots - wavePenaltyKnots);
    const effectiveSpeedKmh = effectiveSpeedKnots * KNOT_TO_KMH;

    const segHours = segKm / effectiveSpeedKmh;
    const waveFuelMultiplier = 1 + Math.max(0, cond.waveHeightM - 0.5) * 0.08 * vessel.waveDragFactor;
    const segFuel = segHours * vessel.fuelLitersPerHour * waveFuelMultiplier;

    totalKm += segKm;
    totalHours += segHours;
    totalFuel += segFuel;
    waveSum += cond.waveHeightM;
    maxWave = Math.max(maxWave, cond.waveHeightM);
    windSum += cond.windSpeedMs;
    assistSum += currentAssistKnots;

    waypoints.push({
      lat: mid.lat,
      lon: mid.lon,
      segmentKm: segKm,
      currentAssistKnots,
      waveHeightM: cond.waveHeightM,
      windSpeedMs: cond.windSpeedMs,
      effectiveSpeedKnots,
    });
  }

  const segCount = Math.max(1, waypoints.length);
  const avgWave = waveSum / segCount;
  const avgWind = windSum / segCount;
  const avgAssist = assistSum / segCount;

  // Which caution to show, not its wording: the sentence is a dictionary entry.
  const cautionKind: CautionKind =
    maxWave >= 2.1 || avgWind >= 11.0
      ? 'roughSeas'
      : avgAssist > 0.4
        ? 'favorableCurrent'
        : avgAssist < -0.4
          ? 'adverseCurrent'
          : 'calm';

  return {
    routeId,
    labelKey,
    strategyEn,
    points,
    waypoints,
    distanceKm: totalKm,
    durationHours: totalHours,
    estimatedFuelLiters: totalFuel,
    estimatedFuelCostYen: Math.round(totalFuel * vessel.fuelPriceYenPerLiter),
    avgWaveHeightM: avgWave,
    maxWaveHeightM: maxWave,
    avgWindSpeedMs: avgWind,
    avgCurrentAssistKnots: avgAssist,
    caution: {
      kind: cautionKind,
      maxWaveM: maxWave,
      avgWindMs: avgWind,
      avgAssistKnots: avgAssist,
    },
  };
}
