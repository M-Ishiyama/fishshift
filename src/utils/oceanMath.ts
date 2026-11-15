import type {
  ConditionBasis,
  DepartureSlot,
  MonthlyObservation,
  OceanGridCell,
  PointLatLon,
  RegionId,
  RouteEstimate,
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
  regionId: RegionId,
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
  if (grid.length === 0) {
    throw new Error('Cannot sample empty ocean grid');
  }
  const rows = 20;
  const cols = 26;
  const first = grid[0];
  const last = grid[grid.length - 1];
  const dLat = rows > 1 ? Math.abs(first.lat - last.lat) / (rows - 1) : 0.1;
  const dLon = cols > 1 ? Math.abs(last.lon - first.lon) / (cols - 1) : 0.1;

  // Fractional grid index in 20x26 grid
  const fr = Math.max(0, Math.min(rows - 1, (first.lat - pt.lat) / (dLat || 1e-6)));
  const fc = Math.max(0, Math.min(cols - 1, (pt.lon - first.lon) / (dLon || 1e-6)));
  const r0 = Math.floor(fr);
  const c0 = Math.floor(fc);
  const r1 = Math.min(rows - 1, r0 + 1);
  const c1 = Math.min(cols - 1, c0 + 1);
  const ty = fr - r0;
  const tx = fc - c0;

  const corners: { cell: OceanGridCell | undefined; w: number }[] = [
    { cell: grid[r0 * cols + c0], w: (1 - ty) * (1 - tx) },
    { cell: grid[r0 * cols + c1], w: (1 - ty) * tx },
    { cell: grid[r1 * cols + c0], w: ty * (1 - tx) },
    { cell: grid[r1 * cols + c1], w: ty * tx },
  ];

  let wSum = 0;
  let wave = 0;
  let windSpd = 0;
  let windU = 0;
  let windV = 0;
  let currU = 0;
  let currV = 0;
  let fallbackCell: OceanGridCell | null = null;

  for (const { cell, w } of corners) {
    if (!cell || cell.isLand || w <= 0) continue;
    if (!fallbackCell) fallbackCell = cell;
    wSum += w;
    wave += cell.waveHeightM * w;
    windSpd += cell.windSpeedMs * w;

    const wRad = (cell.windDirDeg * Math.PI) / 180;
    windU += Math.sin(wRad) * w;
    windV += Math.cos(wRad) * w;

    const cRad = (cell.currentDirDeg * Math.PI) / 180;
    currU += cell.currentSpeedMs * Math.sin(cRad) * w;
    currV += cell.currentSpeedMs * Math.cos(cRad) * w;
  }

  if (wSum > 1e-6 && fallbackCell) {
    const cu = currU / wSum;
    const cv = currV / wSum;
    const wu = windU / wSum;
    const wv = windV / wSum;
    return {
      ...fallbackCell,
      waveHeightM: wave / wSum,
      windSpeedMs: windSpd / wSum,
      windDirDeg: ((Math.atan2(wu, wv) * 180) / Math.PI + 360) % 360,
      currentSpeedMs: Math.hypot(cu, cv),
      currentDirDeg: ((Math.atan2(cu, cv) * 180) / Math.PI + 360) % 360,
    };
  }

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

/**
 * Projects a baseline ocean grid into a next-day departure window condition grid.
 * - historical_climatology: Uses multi-year historical current/wind baseline for the season + subtle diurnal sea-breeze shift.
 * - next_day_forecast: Simulates short-range forecast shift (e.g., passing trough / afternoon wind & wave buildup).
 */
export function projectNextDayConditions(
  baseGrid: OceanGridCell[],
  basis: ConditionBasis,
  slot: DepartureSlot
): OceanGridCell[] {
  const slotWindMult = slot === '04:00' ? 0.88 : slot === '09:00' ? 1.0 : 1.18;
  const slotWaveAdd = slot === '04:00' ? -0.15 : slot === '09:00' ? 0.0 : 0.25;
  const forecastWindMult = basis === 'next_day_forecast' ? 1.12 : 1.0;
  const forecastDirShift = basis === 'next_day_forecast' ? (slot === '15:00' ? 18 : 8) : 0;

  return baseGrid.map((cell) => {
    if (cell.isLand) return cell;
    const windSpeedMs = Number(
      Math.max(1.5, cell.windSpeedMs * slotWindMult * forecastWindMult).toFixed(1)
    );
    const windDirDeg = Math.round(((cell.windDirDeg + forecastDirShift) % 360 + 360) % 360);
    const waveHeightM = Number(
      Math.max(
        0.3,
        cell.waveHeightM + slotWaveAdd + (basis === 'next_day_forecast' ? 0.22 : 0)
      ).toFixed(2)
    );
    const currentSpeedMs = Number(
      (cell.currentSpeedMs * (basis === 'next_day_forecast' ? 1.06 : 1.0)).toFixed(2)
    );

    return {
      ...cell,
      windSpeedMs,
      windDirDeg,
      waveHeightM,
      currentSpeedMs,
    };
  });
}

export interface SegmentKinematics {
  segKm: number;
  segHours: number;
  segFuel: number;
  currentAssistKnots: number;
  windAssistKnots: number;
  waveHeightM: number;
  windSpeedMs: number;
  effectiveSpeedKnots: number;
}

export function estimateSegmentKinematics(
  p1: PointLatLon,
  p2: PointLatLon,
  grid: OceanGridCell[],
  vessel: VesselParams
): SegmentKinematics {
  const segKm = haversineKm(p1, p2);
  if (segKm <= 1e-6) {
    return {
      segKm: 0,
      segHours: 0,
      segFuel: 0,
      currentAssistKnots: 0,
      windAssistKnots: 0,
      waveHeightM: 0,
      windSpeedMs: 0,
      effectiveSpeedKnots: vessel.speedKnots,
    };
  }

  const subSteps = Math.max(1, Math.ceil(segKm / 8));
  const vesselHeading = bearingDeg(p1, p2);

  let totalHours = 0;
  let totalFuel = 0;
  let waveWeighted = 0;
  let windWeighted = 0;
  let assistWeighted = 0;
  let windAssistWeighted = 0;
  let effSpeedWeighted = 0;
  let maxWave = 0;

  for (let s = 0; s < subSteps; s++) {
    const t = (s + 0.5) / subSteps;
    const mid: PointLatLon = {
      lat: p1.lat + (p2.lat - p1.lat) * t,
      lon: p1.lon + (p2.lon - p1.lon) * t,
    };
    const subKm = segKm / subSteps;
    const cond = sampleGridCondition(grid, mid);

    const currentAngleRad = ((cond.currentDirDeg - vesselHeading) * Math.PI) / 180;
    const currentAssistKnots = cond.currentSpeedMs * MS_TO_KNOTS * Math.cos(currentAngleRad);

    // Meteorological windDirDeg is blowing FROM; blowingTO = (windDirDeg + 180) % 360
    const windBlowingToDeg = (cond.windDirDeg + 180) % 360;
    const windAngleRad = ((windBlowingToDeg - vesselHeading) * Math.PI) / 180;
    const cosWind = Math.cos(windAngleRad);
    const windAssistKnots =
      cond.windSpeedMs * MS_TO_KNOTS * 0.055 * cosWind * vessel.windDragFactor;

    // Directional wave encounter factor: head seas (cosWind < 0) incur higher pitching/slamming drag than following seas
    const headSeaFactor = 1.0 - 0.35 * cosWind; // 0.65 (following) to 1.35 (head seas)
    const waveExcess = Math.max(0, cond.waveHeightM - 0.55);
    const wavePenaltyKnots =
      waveExcess * (0.55 + 0.42 * waveExcess) * headSeaFactor * vessel.waveDragFactor;
    const effectiveSpeedKnots = Math.max(
      4.0,
      vessel.speedKnots + currentAssistKnots + windAssistKnots - wavePenaltyKnots
    );
    const effectiveSpeedKmh = effectiveSpeedKnots * KNOT_TO_KMH;

    const subHours = subKm / effectiveSpeedKmh;
    const waveFuelMultiplier =
      1 + (0.08 * waveExcess + 0.085 * waveExcess * waveExcess) * headSeaFactor * vessel.waveDragFactor;
    const headwindFuelPenalty =
      cosWind < 0
        ? 1 +
          Math.min(
            0.42,
            (Math.abs(windAssistKnots) * 0.08 +
              ((cond.windSpeedMs / 14) ** 2) * 0.11 * (-cosWind)) *
              vessel.windDragFactor
          )
        : Math.max(0.92, 1 - windAssistKnots * 0.025);
    const subFuel = subHours * vessel.fuelLitersPerHour * waveFuelMultiplier * headwindFuelPenalty;

    totalHours += subHours;
    totalFuel += subFuel;
    waveWeighted += cond.waveHeightM * subKm;
    windWeighted += cond.windSpeedMs * subKm;
    assistWeighted += currentAssistKnots * subKm;
    windAssistWeighted += windAssistKnots * subKm;
    effSpeedWeighted += effectiveSpeedKnots * subKm;
    maxWave = Math.max(maxWave, cond.waveHeightM);
  }

  return {
    segKm,
    segHours: totalHours,
    segFuel: totalFuel,
    currentAssistKnots: assistWeighted / segKm,
    windAssistKnots: windAssistWeighted / segKm,
    waveHeightM: maxWave,
    windSpeedMs: windWeighted / segKm,
    effectiveSpeedKnots: effSpeedWeighted / segKm,
  };
}

export function calculateRouteEstimate(
  routeId: 'A' | 'B',
  labelJa: string,
  labelEn: string,
  strategyEn: string,
  points: PointLatLon[],
  grid: OceanGridCell[],
  vessel: VesselParams
): RouteEstimate {
  let totalKm = 0;
  let totalHours = 0;
  let totalFuel = 0;
  let waveWeightedSum = 0;
  let maxWave = 0;
  let windWeightedSum = 0;
  let assistWeightedSum = 0;
  let windAssistWeightedSum = 0;
  const waypoints: RouteWaypointMetric[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const kin = estimateSegmentKinematics(p1, p2, grid, vessel);
    if (kin.segKm <= 1e-6) continue;

    // Sample sub-segment avg wave properly across leg
    const subSteps = Math.max(1, Math.ceil(kin.segKm / 8));
    let legWaveSum = 0;
    for (let s = 0; s < subSteps; s++) {
      const t = (s + 0.5) / subSteps;
      const cond = sampleGridCondition(grid, {
        lat: p1.lat + (p2.lat - p1.lat) * t,
        lon: p1.lon + (p2.lon - p1.lon) * t,
      });
      legWaveSum += cond.waveHeightM;
    }
    const legAvgWave = legWaveSum / subSteps;

    totalKm += kin.segKm;
    totalHours += kin.segHours;
    totalFuel += kin.segFuel;
    waveWeightedSum += legAvgWave * kin.segKm;
    maxWave = Math.max(maxWave, kin.waveHeightM);
    windWeightedSum += kin.windSpeedMs * kin.segKm;
    assistWeightedSum += kin.currentAssistKnots * kin.segKm;
    windAssistWeightedSum += kin.windAssistKnots * kin.segKm;

    waypoints.push({
      lat: (p1.lat + p2.lat) / 2,
      lon: (p1.lon + p2.lon) / 2,
      segmentKm: kin.segKm,
      currentAssistKnots: kin.currentAssistKnots,
      windAssistKnots: kin.windAssistKnots,
      waveHeightM: legAvgWave,
      windSpeedMs: kin.windSpeedMs,
      effectiveSpeedKnots: kin.effectiveSpeedKnots,
    });
  }

  const denomKm = Math.max(1e-6, totalKm);
  const avgWave = waveWeightedSum / denomKm;
  const avgWind = windWeightedSum / denomKm;
  const avgAssist = assistWeightedSum / denomKm;
  const avgWindAssist = windAssistWeightedSum / denomKm;

  let cautionNoteJa = '海況・風向ともに比較的穏やかな試算条件です。';
  let cautionNoteEn = 'Sea state and wind conditions are relatively calm under this modeled scenario.';
  if (maxWave >= 2.1 || avgWind >= 11.0) {
    cautionNoteJa = `最大波高 ${maxWave.toFixed(1)} m / 平均風速 ${avgWind.toFixed(1)} m/s の区間あり。波浪・風圧抵抗と安全余力に注意。`;
    cautionNoteEn = `Segments reach ${maxWave.toFixed(1)} m max wave / ${avgWind.toFixed(1)} m/s mean wind. Watch wave/wind drag and safety margins.`;
  } else if (avgAssist > 0.35 && avgWindAssist >= -0.2) {
    cautionNoteJa = `順流成分（平均 +${avgAssist.toFixed(2)} kt）を活用し燃料効率に有利な軌道。`;
    cautionNoteEn = `Favorable following current (mean +${avgAssist.toFixed(2)} kt) improves modeled fuel efficiency.`;
  } else if (avgWindAssist < -0.4) {
    cautionNoteJa = `向かい風成分（平均 ${avgWindAssist.toFixed(2)} kt）による風圧抵抗増の区間あり。`;
    cautionNoteEn = `Headwind component (mean ${avgWindAssist.toFixed(2)} kt) increases aerodynamic drag along segments.`;
  } else if (avgAssist < -0.35) {
    cautionNoteJa = `逆流区間（平均 ${avgAssist.toFixed(2)} kt）により対地速度低下。`;
    cautionNoteEn = `Adverse current segments (mean ${avgAssist.toFixed(2)} kt) reduce speed over ground.`;
  }

  return {
    routeId,
    labelJa,
    labelEn,
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
    avgWindAssistKnots: avgWindAssist,
    cautionNoteJa,
    cautionNoteEn,
  };
}
