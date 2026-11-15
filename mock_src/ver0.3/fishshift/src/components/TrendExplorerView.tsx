import { useMemo, useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { REGIONS, formatNasaSource } from '../data/oceanData';
import type { Locale, RealRegionDataset, RegionId } from '../types/ocean';
import { aggregateAnnualSeries, computeLinearTrend } from '../utils/oceanMath';

interface TrendExplorerViewProps {
  locale: Locale;
  regionId: RegionId;
  onChangeRegion: (id: RegionId) => void;
  regionData: RealRegionDataset | null;
}

export function TrendExplorerView({
  locale,
  regionId,
  onChangeRegion,
  regionData,
}: TrendExplorerViewProps) {
  const isJa = locale === 'ja';
  const [variable, setVariable] = useState<'sst' | 'chlor_a'>('sst');
  const [mode, setMode] = useState<'annual' | 'monthly'>('annual');
  const [startYear, setStartYear] = useState<number>(2016);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [showExplain, setShowExplain] = useState<boolean>(false);

  const region = REGIONS[regionId];

  const monthlyAll = useMemo(() => {
    const raw = regionData?.monthlySeries ?? [];
    return raw.map((m) => ({
      ...m,
      coverageRatio:
        variable === 'sst'
          ? (m.sstCoverage ?? m.coverageRatio)
          : (m.chlCoverage ?? m.coverageRatio),
    }));
  }, [regionData, variable]);

  const monthlyFiltered = useMemo(
    () => monthlyAll.filter((m) => m.year >= startYear),
    [monthlyAll, startYear]
  );

  const seriesPoints = useMemo(() => {
    if (mode === 'annual') {
      const annual = aggregateAnnualSeries(monthlyFiltered, variable, 9);
      return annual.map((a) => ({
        x: a.year,
        label: isJa ? `${a.year}年` : `${a.year}`,
        y: a.value,
        coverage: a.coverageRatio,
        validMonths: a.validMonths,
      }));
    }
    return monthlyFiltered.map((m) => ({
      x: m.year + (m.month - 0.5) / 12,
      label: m.label,
      y: variable === 'sst' ? m.sst : m.chlorA,
      coverage: m.coverageRatio,
      validMonths: 1,
    }));
  }, [monthlyFiltered, variable, mode, isJa]);

  const trend = useMemo(
    () =>
      computeLinearTrend(
        seriesPoints.map((p) => ({ x: p.x, y: p.y, coverage: p.coverage })),
        variable,
        regionId,
        mode === 'annual'
          ? isJa
            ? 'OLS 年次線形回帰 (有効月 ≥ 9/12)'
            : 'OLS Annual Linear Regression (valid months ≥ 9/12)'
          : isJa
            ? 'OLS 月次線形回帰（季節変動含む）'
            : 'OLS Monthly Linear Regression (incl. seasonality)'
      ),
    [seriesPoints, variable, regionId, mode, isJa]
  );

  // SVG Chart Geometry
  const width = 860;
  const height = 340;
  const pad = { top: 24, right: 28, bottom: 42, left: 60 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const validPoints = seriesPoints.filter((p) => p.y !== null) as {
    x: number;
    label: string;
    y: number;
    coverage: number;
    validMonths: number;
  }[];

  const xMin = seriesPoints.length > 0 ? seriesPoints[0].x : startYear;
  const xMax = seriesPoints.length > 1 ? seriesPoints[seriesPoints.length - 1].x : startYear + 1;

  const yValues = validPoints.map((p) => p.y);
  const rawMin = yValues.length > 0 ? Math.min(...yValues) : 0;
  const rawMax = yValues.length > 0 ? Math.max(...yValues) : 1;
  const yMargin = Math.max(0.15, (rawMax - rawMin) * 0.18);
  const yMin = rawMin - yMargin;
  const yMax = rawMax + yMargin;

  const toX = (x: number) =>
    pad.left + ((x - xMin) / Math.max(1e-6, xMax - xMin)) * plotW;
  const toY = (y: number) =>
    pad.top + plotH - ((y - yMin) / Math.max(1e-6, yMax - yMin)) * plotH;

  const linePath = useMemo(() => {
    let path = '';
    let open = false;
    for (const p of seriesPoints) {
      if (p.y === null) {
        open = false;
        continue;
      }
      const cx = toX(p.x).toFixed(1);
      const cy = toY(p.y).toFixed(1);
      path += open ? ` L${cx},${cy}` : ` M${cx},${cy}`;
      open = true;
    }
    return path;
  }, [seriesPoints, xMin, xMax, yMin, yMax]);

  // Trendline & 95% CI Ribbon around centroid (meanX, meanY)
  const trendRibbon = useMemo(() => {
    if (
      trend.slopePerYear === null ||
      trend.intercept === null ||
      trend.ci95Low === null ||
      trend.ci95High === null ||
      trend.meanValue === null ||
      validPoints.length < 3
    ) {
      return null;
    }
    const meanX = validPoints.reduce((s, p) => s + p.x, 0) / validPoints.length;
    const meanY = trend.meanValue;

    const yLowStart = meanY + trend.ci95Low * (xMin - meanX);
    const yHighStart = meanY + trend.ci95Low * (xMax - meanX);
    const yLowEnd = meanY + trend.ci95High * (xMin - meanX);
    const yHighEnd = meanY + trend.ci95High * (xMax - meanX);

    const upperStart = Math.max(yLowStart, yLowEnd);
    const lowerStart = Math.min(yLowStart, yLowEnd);
    const upperEnd = Math.max(yHighStart, yHighEnd);
    const lowerEnd = Math.min(yHighStart, yHighEnd);

    const polyPoints = [
      `${toX(xMin).toFixed(1)},${toY(upperStart).toFixed(1)}`,
      `${toX(xMax).toFixed(1)},${toY(upperEnd).toFixed(1)}`,
      `${toX(xMax).toFixed(1)},${toY(lowerEnd).toFixed(1)}`,
      `${toX(xMin).toFixed(1)},${toY(lowerStart).toFixed(1)}`,
    ].join(' ');

    const regStartY = trend.intercept + trend.slopePerYear * xMin;
    const regEndY = trend.intercept + trend.slopePerYear * xMax;

    return {
      polyPoints,
      x1: toX(xMin),
      y1: toY(regStartY),
      x2: toX(xMax),
      y2: toY(regEndY),
    };
  }, [trend, validPoints, xMin, xMax, yMin, yMax]);

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => yMin + (yMax - yMin) * t);
  const yearTicks = Array.from({ length: 2025 - startYear + 1 }, (_, i) => startYear + i);

  const statusColor =
    trend.status === 'SIGNIFICANT'
      ? 'text-emerald-400'
      : trend.status === 'NOT SIGNIFICANT'
        ? 'text-amber-400'
        : 'text-slate-400';

  const statusLabel =
    trend.status === 'SIGNIFICANT'
      ? isJa
        ? '統計的に有意な傾向 (p < 0.05)'
        : 'SIGNIFICANT Trend (p < 0.05)'
      : trend.status === 'NOT SIGNIFICANT'
        ? isJa
          ? '有意差なし (p ≥ 0.05)'
          : 'NOT SIGNIFICANT (p ≥ 0.05)'
        : isJa
          ? 'データ不足のため判定不能'
          : 'INSUFFICIENT DATA';

  const hoveredPoint = hoveredIdx !== null ? seriesPoints[hoveredIdx] : null;

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-5">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-slate-800/80 pb-3">
        <div>
          <h1 className="font-display text-xl font-semibold text-slate-50">
            {isJa ? '海洋トレンド統計解析 (Trend Explorer)' : 'Ocean Trend Statistical Explorer'}
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">
            <span>{formatNasaSource(variable, locale)}</span>
            <span className="mx-2 text-slate-600">·</span>
            <span>
              {isJa ? '海域' : 'Region'}: {isJa ? region.nameJa : region.nameEn}
            </span>
            <span className="mx-2 text-slate-600">·</span>
            <span>
              {isJa ? '手法' : 'Method'}: {trend.method}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowExplain((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-[#0D1524] px-3 py-1.5 text-xs text-slate-300 hover:border-slate-600 hover:text-slate-100 cursor-pointer"
        >
          <HelpCircle className="h-3.5 w-3.5 text-cyan-400" />
          <span>{isJa ? '統計的有意性とは？' : 'What is statistical significance?'}</span>
        </button>
      </div>

      {showExplain && (
        <div className="mb-5 rounded-lg border border-slate-700 bg-[#0D1524] p-4 text-xs leading-relaxed text-slate-300">
          <p className="font-semibold text-slate-100 mb-1">
            {isJa
              ? 'p値と95%信頼区間の読み方（科学的な注意点）'
              : 'Interpreting p-values & 95% Confidence Intervals (Scientific Caveats)'}
          </p>
          <p>
            {isJa
              ? 'p値 < 0.05（SIGNIFICANT）は「観測期間中に傾きがゼロであるという帰無仮説のもとでは起こりにくい変化が見られる」ことを示しますが、生態学的な重要性や将来の継続を直接保証するものではありません。また、月次データでは季節周期や時間的自己相関によりp値が小さく見えやすいため、本画面では年次平均（有効月 9か月以上）を標準の傾向検定として推奨しています。'
              : 'A p-value < 0.05 (SIGNIFICANT) indicates an observed slope unlikely under a zero-slope null hypothesis, but does not prove ecological magnitude or future persistence. Because monthly series exhibit strong seasonality and temporal autocorrelation that can deflate p-values, annual aggregation (≥ 9 valid months/year) is recommended as the primary trend test.'}
          </p>
        </div>
      )}

      {/* Control Bar */}
      <div className="mb-5 grid grid-cols-1 gap-4 rounded-lg border border-slate-800 bg-[#0D1524] p-4 md:grid-cols-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            {isJa ? '解析変数 (NASA観測)' : 'Analysis Variable (NASA)'}
          </label>
          <div className="grid grid-cols-2 gap-1 rounded bg-[#070B12] p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => setVariable('sst')}
              className={`rounded py-1.5 text-xs font-medium cursor-pointer transition-colors ${
                variable === 'sst'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              {isJa ? '海面水温 SST' : 'SST (°C)'}
            </button>
            <button
              type="button"
              onClick={() => setVariable('chlor_a')}
              className={`rounded py-1.5 text-xs font-medium cursor-pointer transition-colors ${
                variable === 'chlor_a'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              {isJa ? 'クロロフィルa' : 'Chlorophyll-a'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            {isJa ? '対象海域' : 'Target Region'}
          </label>
          <div className="grid grid-cols-3 gap-1 rounded bg-[#070B12] p-1 border border-slate-800">
            {(['tsugaru', 'sanriku', 'houston'] as RegionId[]).map((rid) => (
              <button
                key={rid}
                type="button"
                onClick={() => onChangeRegion(rid)}
                className={`rounded py-1.5 text-xs font-medium cursor-pointer transition-colors ${
                  regionId === rid
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                {isJa ? REGIONS[rid].shortNameJa : REGIONS[rid].shortNameEn}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            {isJa ? '時間集計' : 'Time Aggregation'}
          </label>
          <div className="grid grid-cols-2 gap-1 rounded bg-[#070B12] p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => setMode('annual')}
              className={`rounded py-1.5 text-xs font-medium cursor-pointer transition-colors ${
                mode === 'annual'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              {isJa ? '年平均 (推奨)' : 'Annual (Rec.)'}
            </button>
            <button
              type="button"
              onClick={() => setMode('monthly')}
              className={`rounded py-1.5 text-xs font-medium cursor-pointer transition-colors ${
                mode === 'monthly'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              {isJa ? '月次推移' : 'Monthly'}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="start-year-select" className="block text-xs font-medium text-slate-400 mb-1.5">
            {isJa ? '解析開始年 (〜2025年)' : 'Start Year (through 2025)'}
          </label>
          <select
            id="start-year-select"
            value={startYear}
            onChange={(e) => setStartYear(Number(e.target.value))}
            className="w-full rounded border border-slate-700 bg-[#070B12] px-3 py-1.5 font-mono text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
          >
            {[2016, 2017, 2018, 2019, 2020, 2021].map((y) => (
              <option key={y} value={y}>
                {isJa
                  ? `${y}年 – 2025年 (${2025 - y + 1}年間)`
                  : `${y} – 2025 (${2025 - y + 1} yrs)`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-800 bg-[#0D1524] p-4">
          <div className="text-xs text-slate-400">
            {isJa ? '年あたり線形傾き' : 'Linear Slope per Year'}
          </div>
          <div className="mt-1 flex items-baseline gap-1.5 font-mono text-2xl font-semibold text-slate-50 tabular-nums">
            <span>
              {trend.slopePerYear !== null
                ? `${trend.slopePerYear >= 0 ? '+' : ''}${trend.slopePerYear.toFixed(variable === 'sst' ? 3 : 4)}`
                : 'N/A'}
            </span>
            <span className="text-xs font-normal text-slate-400">
              {trend.unit}/{isJa ? '年' : 'yr'}
            </span>
          </div>
          <div className="mt-1 font-mono text-[11px] text-slate-500 tabular-nums">
            95% CI: [{trend.ci95Low !== null ? trend.ci95Low.toFixed(3) : '—'},{' '}
            {trend.ci95High !== null ? trend.ci95High.toFixed(3) : '—'}]
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-[#0D1524] p-4">
          <div className="text-xs text-slate-400">
            {isJa ? '統計的有意性 (p値)' : 'Statistical Significance (p-value)'}
          </div>
          <div className="mt-1 font-mono text-2xl font-semibold text-slate-50 tabular-nums">
            {trend.pValue !== null ? (trend.pValue < 0.001 ? '< 0.001' : trend.pValue.toFixed(4)) : 'N/A'}
          </div>
          <div className={`mt-1 text-[11px] font-medium ${statusColor}`}>{statusLabel}</div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-[#0D1524] p-4">
          <div className="text-xs text-slate-400">{isJa ? '期間平均値' : 'Period Mean'}</div>
          <div className="mt-1 flex items-baseline gap-1.5 font-mono text-2xl font-semibold text-slate-50 tabular-nums">
            <span>
              {trend.meanValue !== null
                ? trend.meanValue.toFixed(variable === 'sst' ? 2 : 3)
                : 'N/A'}
            </span>
            <span className="text-xs font-normal text-slate-400">{trend.unit}</span>
          </div>
          <div className="mt-1 font-mono text-[11px] text-slate-500 tabular-nums">
            {isJa ? '決定係数 R²' : 'R²'}: {trend.rSquared !== null ? trend.rSquared.toFixed(3) : '—'}
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-[#0D1524] p-4">
          <div className="text-xs text-slate-400">
            {isJa ? '有効観測数 / 衛星被覆率' : 'Valid Obs / Satellite Coverage'}
          </div>
          <div className="mt-1 font-mono text-2xl font-semibold text-slate-50 tabular-nums">
            n = {trend.n}
          </div>
          <div className="mt-1 font-mono text-[11px] text-slate-500 tabular-nums">
            {isJa ? '平均有効画素被覆率' : 'Mean pixel coverage'}: {(trend.meanCoverage * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Main Chart + Scientific Interpretation */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_340px]">
        <div className="rounded-lg border border-slate-800 bg-[#0D1524] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="font-semibold text-slate-200">
              {isJa ? region.nameJa : region.nameEn} —{' '}
              {variable === 'sst'
                ? isJa
                  ? '海面水温 (SST)'
                  : 'Sea Surface Temperature (SST)'
                : isJa
                  ? 'クロロフィルa濃度 (Chl-a)'
                  : 'Chlorophyll-a (Chl-a)'}{' '}
              {isJa ? '時系列' : 'Time Series'}
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-0.5 w-4 bg-cyan-400" />
                {isJa ? '集計系列' : 'Observed Series'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-0.5 w-4 border-t-2 border-dashed border-amber-400" />
                {isJa ? '線形トレンド' : 'Linear Trend'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-4 bg-amber-400/20 border border-amber-400/40" />
                {isJa ? '95%信頼帯' : '95% CI Band'}
              </span>
            </div>
          </div>

          <div className="relative">
            {!regionData && (
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-[#0D1524]/80 font-mono text-xs text-cyan-300">
                {isJa ? 'NASA 120ヶ月時系列データ読込中...' : 'Loading NASA 120-month series...'}
              </div>
            )}
            <svg viewBox={`0 0 ${width} ${height}`} className="block h-auto w-full select-none">
              {/* Y Grid & Labels */}
              {yTicks.map((val, i) => {
                const y = toY(val);
                return (
                  <g key={`ytick-${i}`}>
                    <line
                      x1={pad.left}
                      y1={y}
                      x2={width - pad.right}
                      y2={y}
                      stroke="#1E293B"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={pad.left - 8}
                      y={y + 4}
                      textAnchor="end"
                      fill="#94A3B8"
                      fontSize="11"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {val.toFixed(variable === 'sst' ? 1 : 2)}
                    </text>
                  </g>
                );
              })}

              {/* X Year Ticks */}
              {yearTicks.map((yr) => {
                const x = toX(yr);
                return (
                  <g key={`xtick-${yr}`}>
                    <line
                      x1={x}
                      y1={pad.top}
                      x2={x}
                      y2={pad.top + plotH}
                      stroke="#1E293B"
                      strokeOpacity={0.5}
                    />
                    <text
                      x={x}
                      y={height - 14}
                      textAnchor="middle"
                      fill="#94A3B8"
                      fontSize="11"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {yr}
                    </text>
                  </g>
                );
              })}

              {/* 95% CI Polygon */}
              {trendRibbon && (
                <polygon
                  points={trendRibbon.polyPoints}
                  fill="rgba(245, 158, 11, 0.14)"
                />
              )}

              {/* Regression Line */}
              {trendRibbon && (
                <line
                  x1={trendRibbon.x1}
                  y1={trendRibbon.y1}
                  x2={trendRibbon.x2}
                  y2={trendRibbon.y2}
                  stroke="#F59E0B"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                />
              )}

              {/* Data Polyline */}
              <path d={linePath} fill="none" stroke="#22D3EE" strokeWidth={2.2} />

              {/* Interactive Data Points */}
              {seriesPoints.map((p, idx) => {
                if (p.y === null) return null;
                const cx = toX(p.x);
                const cy = toY(p.y);
                const active = hoveredIdx === idx;
                return (
                  <g key={`pt-${p.label}`}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={mode === 'annual' ? (active ? 6 : 4) : active ? 4.5 : 2}
                      fill={active ? '#F8FAFC' : '#22D3EE'}
                      stroke="#070B12"
                      strokeWidth={1.5}
                    />
                    <circle
                      cx={cx}
                      cy={cy}
                      r={12}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredIdx(idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip */}
            {hoveredPoint && hoveredPoint.y !== null && (
              <div className="mt-2 flex items-center justify-between rounded border border-slate-700 bg-[#070B12] px-3 py-1.5 font-mono text-xs text-slate-200 tabular-nums">
                <span>
                  {isJa ? '時点' : 'Period'}: {hoveredPoint.label}
                </span>
                <span>
                  {variable === 'sst' ? 'SST' : 'Chl-a'}: {hoveredPoint.y.toFixed(variable === 'sst' ? 2 : 3)} {trend.unit}
                </span>
                <span>
                  {isJa ? '画素被覆率' : 'Coverage'}: {(hoveredPoint.coverage * 100).toFixed(0)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Interpretation & Caveats Panel */}
        <aside className="flex flex-col gap-4 rounded-lg border border-slate-800 bg-[#0D1524] p-4 text-xs leading-relaxed">
          <div>
            <h2 className="font-display text-sm font-semibold text-slate-100">
              {isJa ? '解析サマリーと解釈' : 'Analysis Summary & Interpretation'}
            </h2>
            <p className="mt-2 text-slate-300">
              {isJa ? (
                <>
                  {region.nameJa}における {startYear}–2025年の{variable === 'sst' ? '海面水温' : 'クロロフィルa濃度'}は、
                  {trend.slopePerYear !== null
                    ? `推定 ${trend.slopePerYear >= 0 ? '+' : ''}${trend.slopePerYear.toFixed(variable === 'sst' ? 3 : 4)} ${trend.unit}/年`
                    : '解析不能'}
                  の線形傾向を示しています（n = {trend.n}, p ={' '}
                  {trend.pValue !== null ? trend.pValue.toFixed(4) : 'N/A'}）。
                </>
              ) : (
                <>
                  Over {startYear}–2025 in {region.nameEn}, {variable === 'sst' ? 'SST' : 'Chlorophyll-a'} exhibits an estimated linear slope of{' '}
                  {trend.slopePerYear !== null
                    ? `${trend.slopePerYear >= 0 ? '+' : ''}${trend.slopePerYear.toFixed(variable === 'sst' ? 3 : 4)} ${trend.unit}/yr`
                    : 'N/A'}{' '}
                  (n = {trend.n}, p = {trend.pValue !== null ? trend.pValue.toFixed(4) : 'N/A'}).
                </>
              )}
            </p>
            <p className="mt-2 text-slate-400">
              {trend.status === 'SIGNIFICANT'
                ? isJa
                  ? 'p < 0.05 により、観測期間中の変化傾向は統計的に有意と判定されました。水温シフトに伴う回遊経路・餌生物分布の再配置を検証する動機となります。'
                  : 'With p < 0.05, the observed slope is statistically significant over the window, motivating further verification of species migration and prey redistribution.'
                : isJa
                  ? 'p ≥ 0.05 のため、統計的に有意な単調変化は確認されませんでした（ただし「変化が全くない」ことの証明ではありません）。'
                  : 'With p ≥ 0.05, no statistically significant monotonic trend is detected (note that non-significance does not prove absence of change).'}
            </p>
          </div>

          <div className="border-t border-slate-800 pt-3">
            <h3 className="font-semibold text-slate-200">
              {isJa ? '科学的限界・留意事項' : 'Scientific Limitations & Caveats'}
            </h3>
            <ul className="mt-2 space-y-1.5 text-slate-400 list-disc pl-4">
              {isJa ? (
                <>
                  <li>統計的有意性は、現場の漁獲量や生態学的変化の大きさと同義ではありません。</li>
                  <li>冬季・梅雨期の雲被覆（特に光学センサAqua MODISのChl-a）による欠損が年平均の偏りを生む可能性があります。</li>
                  <li>Chl-aは植物プランクトン指標（領域中央値）であり、魚類の餌となる動物プランクトンや小魚の直接計測ではありません。</li>
                </>
              ) : (
                <>
                  <li>Statistical significance does not equate to catch volume or ecological impact size.</li>
                  <li>Winter/monsoon cloud cover (especially on optical Aqua MODIS Chl-a) may introduce bias into annual means.</li>
                  <li>Chl-a (regional median) measures phytoplankton proxy, not direct zooplankton or forage-fish biomass.</li>
                </>
              )}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
