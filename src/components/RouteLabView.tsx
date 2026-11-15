import { useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { AlertTriangle, CalendarClock, Ship } from 'lucide-react';
import { REGIONS } from '../data/oceanData';
import type {
  ConditionBasis,
  DepartureSlot,
  FuelType,
  HotspotCandidate,
  Locale,
  OceanGridCell,
  PointLatLon,
  RegionId,
  RouteEstimate,
  VesselParams,
} from '../types/ocean';

interface RouteLabViewProps {
  locale: Locale;
  regionId: RegionId;
  projectedGrid: OceanGridCell[];
  hotspots: HotspotCandidate[];
  selectedHotspotId: string;
  onSelectHotspot: (id: string) => void;
  departureSlot: DepartureSlot;
  onChangeDepartureSlot: (slot: DepartureSlot) => void;
  conditionBasis: ConditionBasis;
  onChangeConditionBasis: (basis: ConditionBasis) => void;
  vessel: VesselParams;
  onChangeVessel: Dispatch<SetStateAction<VesselParams>>;
  onChangeFuelType: (fuelType: FuelType) => void;
  routeA: PointLatLon[];
  routeB: PointLatLon[];
  estimateA: RouteEstimate;
  estimateB: RouteEstimate;
}

export function RouteLabView({
  locale,
  regionId,
  projectedGrid,
  hotspots,
  selectedHotspotId,
  onSelectHotspot,
  departureSlot,
  onChangeDepartureSlot,
  conditionBasis,
  onChangeConditionBasis,
  vessel,
  onChangeVessel,
  onChangeFuelType,
  routeA,
  routeB,
  estimateA,
  estimateB,
}: RouteLabViewProps) {
  const isJa = locale === 'ja';
  const region = REGIONS[regionId];
  const target = useMemo(
    () => hotspots.find((h) => h.id === selectedHotspotId) ?? hotspots[0],
    [hotspots, selectedHotspotId]
  );

  const fuelDiffLiters = estimateB.estimatedFuelLiters - estimateA.estimatedFuelLiters;
  const fuelDiffPct =
    estimateA.estimatedFuelLiters > 0
      ? (fuelDiffLiters / estimateA.estimatedFuelLiters) * 100
      : 0;
  const costDiffYen = estimateB.estimatedFuelCostYen - estimateA.estimatedFuelCostYen;

  // Mini SVG Trajectory Map
  const svgW = 640;
  const svgH = 380;
  const project = (pt: { lat: number; lon: number }) => ({
    x: ((pt.lon - region.bbox.west) / (region.bbox.east - region.bbox.west)) * svgW,
    y: ((region.bbox.north - pt.lat) / (region.bbox.north - region.bbox.south)) * svgH,
  });

  const toPath = (pts: { lat: number; lon: number }[]) =>
    pts
      .map((p, i) => {
        const { x, y } = project(p);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-5">
      {/* Safety Banner (Mandatory per design spec §5.5) */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
          <span>
            <strong>Experimental estimation — not for navigation:</strong>{' '}
            {isJa
              ? '本画面は簡易海岸線ポリゴン上の陸地回避 A* 探索（Route A: 最短距離 / Route B: 最小燃料試算）による比較結果であり、水深・浅瀬・定置網・航路標識・海上交通安全法規を考慮した実航海ナビゲーションには使用できません。'
              : 'This view compares land-avoiding A* routes over simplified coastlines (Route A: shortest distance vs. Route B: minimum modeled fuel) and must not be used for real-world navigation, bathymetry/reef avoidance, or regulatory routing.'}
          </span>
        </div>
        <span className="font-mono text-[11px] text-amber-300/90 whitespace-nowrap">
          {isJa ? '1 knot = 1.852 km/h · 試算モデル' : '1 knot = 1.852 km/h · Est. Model'}
        </span>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[340px_1fr]">
        {/* Left Vessel & Scenario Controls */}
        <aside className="flex flex-col gap-4 rounded-lg border border-slate-800 bg-[#0D1524] p-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Ship className="h-4 w-4 text-cyan-400" />
            <h2 className="font-display text-sm font-semibold text-slate-100">
              {isJa ? '試算条件・船舶パラメータ' : 'Scenario & Vessel Parameters'}
            </h2>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              {isJa ? '仮想出港点' : 'Virtual Departure Point'}
            </label>
            <div className="rounded border border-slate-800 bg-[#070B12] px-3 py-2 text-xs text-slate-200">
              <div>{isJa ? region.defaultPort.nameJa : region.defaultPort.nameEn}</div>
              <div className="mt-0.5 font-mono text-[11px] text-slate-500 tabular-nums">
                {region.defaultPort.lat.toFixed(2)}°N, {Math.abs(region.defaultPort.lon).toFixed(2)}
                {region.defaultPort.lon >= 0 ? '°E' : '°W'}
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="hotspot-select" className="block text-xs font-medium text-slate-400 mb-1.5">
              {isJa ? '目標候補ポイント' : 'Target Hotspot Candidate'}
            </label>
            <select
              id="hotspot-select"
              value={target?.id ?? ''}
              onChange={(e) => onSelectHotspot(e.target.value)}
              className="w-full rounded border border-slate-700 bg-[#070B12] px-3 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
            >
              {hotspots.map((h) => (
                <option key={h.id} value={h.id}>
                  {isJa
                    ? `${h.labelJa} (指数 ${h.habitatScore})`
                    : `${h.labelEn} (Score ${h.habitatScore})`}
                </option>
              ))}
            </select>
          </div>

          {/* Next-Day Departure & Condition Basis */}
          <div className="space-y-3 rounded-md border border-slate-800 bg-[#070B12]/70 p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300">
              <CalendarClock className="h-3.5 w-3.5" />
              <span>
                {isJa ? '翌日出航予定 (2026-11-15)' : 'Next-Day Departure (2026-11-15)'}
              </span>
            </div>

            <div>
              <span className="block text-[11px] text-slate-400 mb-1">
                {isJa ? '出航時間帯' : 'Departure Window'}
              </span>
              <div className="grid grid-cols-3 gap-1 rounded bg-[#0D1524] p-1 border border-slate-800">
                {(['04:00', '09:00', '15:00'] as DepartureSlot[]).map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => onChangeDepartureSlot(slot)}
                    className={`rounded py-1 font-mono text-[11px] font-medium cursor-pointer transition-colors ${
                      departureSlot === slot
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-[11px] text-slate-400 mb-1">
                {isJa ? '海流・風向の算出根拠' : 'Current & Wind Basis'}
              </span>
              <div className="grid grid-cols-2 gap-1 rounded bg-[#0D1524] p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => onChangeConditionBasis('historical_climatology')}
                  className={`rounded py-1 px-1.5 text-[11px] font-medium cursor-pointer transition-colors ${
                    conditionBasis === 'historical_climatology'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  {isJa ? '過去統計ベース' : 'Historical Basis'}
                </button>
                <button
                  type="button"
                  onClick={() => onChangeConditionBasis('next_day_forecast')}
                  className={`rounded py-1 px-1.5 text-[11px] font-medium cursor-pointer transition-colors ${
                    conditionBasis === 'next_day_forecast'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  {isJa ? '翌日予報モデル' : 'Next-Day Forecast'}
                </button>
              </div>
              <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
                {conditionBasis === 'historical_climatology'
                  ? isJa
                    ? '過去同季のNASA CCMP風・海流気候値と時間帯変化に基づく推定値（突発的低気圧は非反映）。'
                    : 'Based on seasonal NASA CCMP wind/current climatology and diurnal shift (excludes sudden storms).'
                  : isJa
                    ? 'Open-Meteo Marine/Weather翌日予報を模した短時間変動シミュレーション値。'
                    : 'Simulated short-range shift modeled after Open-Meteo Marine/Weather next-day forecasts.'}
              </p>
            </div>
          </div>

          {/* Fuel Type Selector */}
          <div>
            <span className="block text-xs font-medium text-slate-400 mb-1.5">
              {isJa ? '使用燃料種別' : 'Vessel Fuel Type'}
            </span>
            <div className="grid grid-cols-2 gap-1 rounded bg-[#070B12] p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => onChangeFuelType('gasoline')}
                className={`rounded py-1.5 text-xs font-medium cursor-pointer transition-colors ${
                  vessel.fuelType === 'gasoline'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                {isJa ? 'ガソリン (小型船)' : 'Gasoline (Small Boat)'}
              </button>
              <button
                type="button"
                onClick={() => onChangeFuelType('diesel')}
                className={`rounded py-1.5 text-xs font-medium cursor-pointer transition-colors ${
                  vessel.fuelType === 'diesel'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                {isJa ? '軽油・A重油' : 'Marine Diesel'}
              </button>
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-3 pt-1">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">{isJa ? '基準船速' : 'Base Vessel Speed'}</span>
                <span className="font-mono text-cyan-300 tabular-nums">{vessel.speedKnots.toFixed(1)} kt</span>
              </div>
              <input
                type="range"
                min={8}
                max={22}
                step={0.5}
                value={vessel.speedKnots}
                onChange={(e) =>
                  onChangeVessel((v) => ({ ...v, speedKnots: Number(e.target.value) }))
                }
                className="w-full cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">{isJa ? '基本燃料消費率' : 'Base Fuel Burn Rate'}</span>
                <span className="font-mono text-cyan-300 tabular-nums">{vessel.fuelLitersPerHour} L/h</span>
              </div>
              <input
                type="range"
                min={20}
                max={200}
                step={5}
                value={vessel.fuelLitersPerHour}
                onChange={(e) =>
                  onChangeVessel((v) => ({ ...v, fuelLitersPerHour: Number(e.target.value) }))
                }
                className="w-full cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">
                  {isJa
                    ? `燃料単価 (${vessel.fuelType === 'gasoline' ? 'ガソリン' : '軽油/A重油'})`
                    : `Fuel Price (${vessel.fuelType === 'gasoline' ? 'Gasoline' : 'Diesel'})`}
                </span>
                <span className="font-mono text-cyan-300 tabular-nums">
                  {isJa ? `${vessel.fuelPriceYenPerLiter} 円/L` : `¥${vessel.fuelPriceYenPerLiter}/L`}
                </span>
              </div>
              <input
                type="range"
                min={100}
                max={230}
                step={5}
                value={vessel.fuelPriceYenPerLiter}
                onChange={(e) =>
                  onChangeVessel((v) => ({ ...v, fuelPriceYenPerLiter: Number(e.target.value) }))
                }
                className="w-full cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">{isJa ? '波浪抵抗感度 (α)' : 'Wave Drag Factor (α)'}</span>
                <span className="font-mono text-cyan-300 tabular-nums">×{vessel.waveDragFactor.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={2}
                step={0.2}
                value={vessel.waveDragFactor}
                onChange={(e) =>
                  onChangeVessel((v) => ({ ...v, waveDragFactor: Number(e.target.value) }))
                }
                className="w-full cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">
                  {isJa ? '風圧抵抗感度 (向かい風)' : 'Wind Drag Sensitivity'}
                </span>
                <span className="font-mono text-cyan-300 tabular-nums">×{vessel.windDragFactor.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={2}
                step={0.2}
                value={vessel.windDragFactor}
                onChange={(e) =>
                  onChangeVessel((v) => ({ ...v, windDragFactor: Number(e.target.value) }))
                }
                className="w-full cursor-pointer"
              />
            </div>
          </div>

          <div className="mt-auto border-t border-slate-800 pt-3 text-[11px] leading-relaxed text-slate-500">
            {isJa
              ? '40×52海域メッシュ上の陸地回避 A* 探索＋見通し線スムージングにより、Route A（最短距離）と Route B（最小推定燃料）を動的算出しています（水深・浅瀬は非考慮）。'
              : 'Dynamically computes Route A (shortest distance) and Route B (minimum modeled fuel) using 40×52 land-avoiding A* search with line-of-sight smoothing (excludes bathymetry).'}
          </div>
        </aside>

        {/* Right Comparison Viewport + Table */}
        <div className="flex flex-col gap-5">
          {/* Top Delta Summary */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-slate-800 bg-[#0D1524] p-4">
              <div className="text-xs text-slate-400">
                {isJa
                  ? `翌日推定燃料差 (${vessel.fuelType === 'gasoline' ? 'ガソリン' : '軽油/A重油'} · B − A)`
                  : `Next-Day Est. Fuel Delta (${vessel.fuelType === 'gasoline' ? 'Gasoline' : 'Diesel'} · B − A)`}
              </div>
              <div
                className={`mt-1 font-mono text-2xl font-semibold tabular-nums ${
                  fuelDiffLiters < 0 ? 'text-emerald-400' : 'text-amber-300'
                }`}
              >
                {fuelDiffLiters >= 0 ? '+' : ''}
                {fuelDiffLiters.toFixed(1)} L ({fuelDiffPct >= 0 ? '+' : ''}
                {fuelDiffPct.toFixed(1)}%)
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                {fuelDiffLiters <= -0.05
                  ? isJa
                    ? '風・波浪・逆流を避けた迂回によりRoute Bが低燃費'
                    : 'Route B saves fuel by avoiding headwinds, waves, or adverse current'
                  : Math.abs(fuelDiffLiters) < 0.05
                    ? isJa
                      ? '最短航路がすでに穏やかな沿岸・順流に沿うため両案が一致'
                      : 'Shortest land-avoiding path already aligns with calmest conditions'
                    : isJa
                      ? '迂回効果が得られずRoute Aと同等'
                      : 'No lower-fuel detour available under modeled conditions'}
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-[#0D1524] p-4">
              <div className="text-xs text-slate-400">
                {isJa ? '翌日推定燃料費差額 (片道)' : 'Next-Day Fuel Cost Delta (1-way)'}
              </div>
              <div className="mt-1 font-mono text-2xl font-semibold text-slate-100 tabular-nums">
                {costDiffYen >= 0 ? '+' : ''}
                {isJa ? `${costDiffYen.toLocaleString()} 円` : `¥${costDiffYen.toLocaleString()}`}
              </div>
              <div className="mt-1 font-mono text-[11px] text-slate-500 tabular-nums">
                {isJa
                  ? `2026-11-15 ${departureSlot}発 · 単価 ${vessel.fuelPriceYenPerLiter} 円/L (往復参考 ×2: ${costDiffYen * 2 >= 0 ? '+' : ''}${(costDiffYen * 2).toLocaleString()} 円)`
                  : `2026-11-15 ${departureSlot} · ¥${vessel.fuelPriceYenPerLiter}/L (Round-trip ×2: ${costDiffYen * 2 >= 0 ? '+' : ''}¥${(costDiffYen * 2).toLocaleString()})`}
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-[#0D1524] p-4">
              <div className="text-xs text-slate-400">
                {isJa ? '所要時間差' : 'Transit Time Delta'}
              </div>
              <div className="mt-1 font-mono text-2xl font-semibold text-slate-100 tabular-nums">
                {estimateB.durationHours - estimateA.durationHours >= 0 ? '+' : ''}
                {(estimateB.durationHours - estimateA.durationHours).toFixed(2)} h
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                {isJa
                  ? '海流・風向（追い風/向かい風）・波浪を反映'
                  : 'Accounts for current, head/tailwind, and wave drag'}
              </div>
            </div>
          </div>

          {/* Trajectory Preview + Comparison Table */}
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_1fr]">
            <div className="overflow-hidden rounded-lg border border-slate-800 bg-[#070B12]">
              <div className="flex items-center justify-between border-b border-slate-800 bg-[#0D1524] px-4 py-2.5 text-xs">
                <span className="font-semibold text-slate-200">
                  {isJa
                    ? `翌日出航プレビュー (${departureSlot}発)`
                    : `Next-Day Departure Preview (${departureSlot})`}
                </span>
                <span className="font-mono text-[11px] text-slate-400">
                  {conditionBasis === 'historical_climatology'
                    ? isJa
                      ? '根拠: 過去データ統計ベース'
                      : 'Basis: Historical Climatology'
                    : isJa
                      ? '根拠: 翌日予報モデル'
                      : 'Basis: Next-Day Forecast'}
                </span>
              </div>
              <svg viewBox={`0 0 ${svgW} ${svgH}`} className="block h-auto w-full bg-[#060A11]">
                {/* Wave Height Shading Grid */}
                {projectedGrid.map((c) => {
                  if (c.isLand) return null;
                  const cellW = svgW / 26;
                  const cellH = svgH / 20;
                  const intensity = Math.min(1, Math.max(0, (c.waveHeightM - 0.7) / 2.2));
                  return (
                    <rect
                      key={`w-${c.row}-${c.col}`}
                      x={c.col * cellW}
                      y={c.row * cellH}
                      width={cellW + 0.5}
                      height={cellH + 0.5}
                      fill={`rgba(245, 158, 11, ${(intensity * 0.25).toFixed(3)})`}
                    />
                  );
                })}

                {/* Land */}
                {region.landPolygons.map((poly, idx) => (
                  <polygon
                    key={`rl-${idx}`}
                    points={poly
                      .map((p) => {
                        const { x, y } = project(p);
                        return `${x.toFixed(1)},${y.toFixed(1)}`;
                      })
                      .join(' ')}
                    fill="#141C2B"
                    stroke="#475569"
                    strokeWidth={1.2}
                  />
                ))}

                {/* Routes */}
                <path d={toPath(routeB)} fill="none" stroke="#22D3EE" strokeWidth={3.4} strokeOpacity={0.92} />
                <path
                  d={toPath(routeA)}
                  fill="none"
                  stroke="#F8FAFC"
                  strokeWidth={2.0}
                  strokeDasharray="6 5"
                  strokeOpacity={0.94}
                />

                {/* Port & Target Markers */}
                {(() => {
                  const p0 = project(region.defaultPort);
                  const p1 = target ? project(target) : p0;
                  return (
                    <>
                      <circle cx={p0.x} cy={p0.y} r={5} fill="#F8FAFC" stroke="#070B12" strokeWidth={1.5} />
                      <text x={p0.x + 8} y={p0.y + 4} fill="#F8FAFC" fontSize="11" fontWeight="600">
                        {isJa ? '出港点' : 'Origin'}
                      </text>
                      <circle cx={p1.x} cy={p1.y} r={7} fill="#22D3EE" fillOpacity={0.3} stroke="#22D3EE" strokeWidth={2} />
                      <text x={p1.x + 10} y={p1.y + 4} fill="#67E8F9" fontSize="11" fontWeight="600">
                        {isJa ? '目標海域' : 'Target'}
                      </text>
                    </>
                  );
                })()}
              </svg>
            </div>

            {/* Side-by-side Numeric Table */}
            <div className="rounded-lg border border-slate-800 bg-[#0D1524] p-4">
              <h3 className="font-display text-sm font-semibold text-slate-100 mb-3">
                {isJa ? '航路別シミュレーション比較表' : 'Route Simulation Comparison'}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2 font-medium">{isJa ? '比較項目' : 'Metric'}</th>
                      <th className="py-2 text-right font-medium">
                        {isJa ? 'Route A (陸地回避・最短)' : 'Route A (Shortest)'}
                      </th>
                      <th className="py-2 text-right font-medium text-cyan-300">
                        {isJa ? 'Route B (風波・燃費最適)' : 'Route B (Fuel-Optimal)'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 font-mono tabular-nums">
                    <tr>
                      <td className="py-2.5 font-sans text-slate-300">
                        {isJa ? '航行距離' : 'Distance'}
                      </td>
                      <td className="py-2.5 text-right">{estimateA.distanceKm.toFixed(1)} km</td>
                      <td className="py-2.5 text-right text-cyan-200">{estimateB.distanceKm.toFixed(1)} km</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-sans text-slate-300">
                        {isJa ? '推定所要時間' : 'Est. Transit Time'}
                      </td>
                      <td className="py-2.5 text-right">{estimateA.durationHours.toFixed(2)} h</td>
                      <td className="py-2.5 text-right text-cyan-200">{estimateB.durationHours.toFixed(2)} h</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-sans text-slate-300">
                        {isJa
                          ? `推定${vessel.fuelType === 'gasoline' ? 'ガソリン' : '燃料'}消費 (片道)`
                          : `Est. ${vessel.fuelType === 'gasoline' ? 'Gasoline' : 'Fuel'} Burn (1-way)`}
                      </td>
                      <td className="py-2.5 text-right">{estimateA.estimatedFuelLiters.toFixed(1)} L</td>
                      <td className="py-2.5 text-right text-cyan-200">{estimateB.estimatedFuelLiters.toFixed(1)} L</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-sans text-slate-300">
                        {isJa ? '推定燃料費 (片道)' : 'Est. Fuel Cost (1-way)'}
                      </td>
                      <td className="py-2.5 text-right">¥{estimateA.estimatedFuelCostYen.toLocaleString()}</td>
                      <td className="py-2.5 text-right text-cyan-200">¥{estimateB.estimatedFuelCostYen.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-sans text-slate-300">
                        {isJa ? '平均 / 最大波高' : 'Mean / Max Wave'}
                      </td>
                      <td className="py-2.5 text-right">
                        {estimateA.avgWaveHeightM.toFixed(2)} / {estimateA.maxWaveHeightM.toFixed(2)} m
                      </td>
                      <td className="py-2.5 text-right text-cyan-200">
                        {estimateB.avgWaveHeightM.toFixed(2)} / {estimateB.maxWaveHeightM.toFixed(2)} m
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-sans text-slate-300">
                        {isJa ? '平均海流アシスト' : 'Mean Current Assist'}
                      </td>
                      <td className="py-2.5 text-right">
                        {estimateA.avgCurrentAssistKnots >= 0 ? '+' : ''}
                        {estimateA.avgCurrentAssistKnots.toFixed(2)} kt
                      </td>
                      <td className="py-2.5 text-right text-cyan-200">
                        {estimateB.avgCurrentAssistKnots >= 0 ? '+' : ''}
                        {estimateB.avgCurrentAssistKnots.toFixed(2)} kt
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-sans text-slate-300">
                        {isJa ? '平均風向アシスト' : 'Mean Wind Assist'}
                      </td>
                      <td className="py-2.5 text-right">
                        {estimateA.avgWindAssistKnots >= 0 ? '+' : ''}
                        {estimateA.avgWindAssistKnots.toFixed(2)} kt
                      </td>
                      <td className="py-2.5 text-right text-cyan-200">
                        {estimateB.avgWindAssistKnots >= 0 ? '+' : ''}
                        {estimateB.avgWindAssistKnots.toFixed(2)} kt
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-4 space-y-2 border-t border-slate-800 pt-3 text-[11px] text-slate-400">
                <div>
                  <span className="font-semibold text-slate-200">
                    {isJa ? 'Route A 所見:' : 'Route A Note:'}
                  </span>{' '}
                  {isJa ? estimateA.cautionNoteJa : estimateA.cautionNoteEn}
                </div>
                <div>
                  <span className="font-semibold text-cyan-300">
                    {isJa ? 'Route B 所見:' : 'Route B Note:'}
                  </span>{' '}
                  {isJa ? estimateB.cautionNoteJa : estimateB.cautionNoteEn}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
