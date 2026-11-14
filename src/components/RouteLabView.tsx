import { useMemo, useState } from 'react';
import { AlertTriangle, Ship } from 'lucide-react';
import { REGIONS, buildCandidateRoutes } from '../data/oceanData';
import type { HotspotCandidate, OceanGridCell, RegionId, VesselParams } from '../types/ocean';
import { calculateRouteEstimate } from '../utils/oceanMath';

interface RouteLabViewProps {
  regionId: RegionId;
  grid: OceanGridCell[];
  hotspots: HotspotCandidate[];
  selectedHotspotId: string;
  onSelectHotspot: (id: string) => void;
}

export function RouteLabView({
  regionId,
  grid,
  hotspots,
  selectedHotspotId,
  onSelectHotspot,
}: RouteLabViewProps) {
  const region = REGIONS[regionId];
  const target = useMemo(
    () => hotspots.find((h) => h.id === selectedHotspotId) ?? hotspots[0],
    [hotspots, selectedHotspotId]
  );

  const [vessel, setVessel] = useState<VesselParams>({
    speedKnots: 12.0,
    fuelLitersPerHour: 95,
    fuelPriceYenPerLiter: 145,
    waveDragFactor: 1.0,
  });

  const { routeA, routeB } = useMemo(() => {
    if (!target) {
      return { routeA: [], routeB: [] };
    }
    return buildCandidateRoutes(region.defaultPort, { lat: target.lat, lon: target.lon }, regionId);
  }, [region, target, regionId]);

  const estimateA = useMemo(
    () =>
      calculateRouteEstimate(
        'A',
        'Route A: 最短距離優先ライン',
        'Distance-priority direct sample',
        routeA,
        grid,
        vessel
      ),
    [routeA, grid, vessel]
  );

  const estimateB = useMemo(
    () =>
      calculateRouteEstimate(
        'B',
        'Route B: 海流・波浪配慮ライン',
        'Current & sea-state aware sample',
        routeB,
        grid,
        vessel
      ),
    [routeB, grid, vessel]
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
            <strong>Experimental estimation — not for navigation:</strong> 本画面は2本の定義済み洋上サンプル線に対するモデル試算比較であり、陸地・浅瀬・航路標識・法規を考慮した実航海ナビゲーションには使用できません。
          </span>
        </div>
        <span className="font-mono text-[11px] text-amber-300/90 whitespace-nowrap">
          1 knot = 1.852 km/h · 試算モデル
        </span>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[340px_1fr]">
        {/* Left Vessel & Scenario Controls */}
        <aside className="flex flex-col gap-4 rounded-lg border border-slate-800 bg-[#0D1524] p-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Ship className="h-4 w-4 text-cyan-400" />
            <h2 className="font-display text-sm font-semibold text-slate-100">
              試算条件・船舶パラメータ
            </h2>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              仮想出港点
            </label>
            <div className="rounded border border-slate-800 bg-[#070B12] px-3 py-2 text-xs text-slate-200">
              <div>{region.defaultPort.nameJa}</div>
              <div className="mt-0.5 font-mono text-[11px] text-slate-500 tabular-nums">
                {region.defaultPort.lat.toFixed(2)}°N, {region.defaultPort.lon.toFixed(2)}°E
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="hotspot-select" className="block text-xs font-medium text-slate-400 mb-1.5">
              目標候補ポイント
            </label>
            <select
              id="hotspot-select"
              value={target?.id ?? ''}
              onChange={(e) => onSelectHotspot(e.target.value)}
              className="w-full rounded border border-slate-700 bg-[#070B12] px-3 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
            >
              {hotspots.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.labelJa} (指数 {h.habitatScore})
                </option>
              ))}
            </select>
          </div>

          {/* Sliders */}
          <div className="space-y-3 pt-1">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">基準船速</span>
                <span className="font-mono text-cyan-300 tabular-nums">{vessel.speedKnots.toFixed(1)} kt</span>
              </div>
              <input
                type="range"
                min={8}
                max={18}
                step={0.5}
                value={vessel.speedKnots}
                onChange={(e) =>
                  setVessel((v) => ({ ...v, speedKnots: Number(e.target.value) }))
                }
                className="w-full cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">基本燃料消費率</span>
                <span className="font-mono text-cyan-300 tabular-nums">{vessel.fuelLitersPerHour} L/h</span>
              </div>
              <input
                type="range"
                min={40}
                max={200}
                step={5}
                value={vessel.fuelLitersPerHour}
                onChange={(e) =>
                  setVessel((v) => ({ ...v, fuelLitersPerHour: Number(e.target.value) }))
                }
                className="w-full cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">燃料単価 (A重油/軽油想定)</span>
                <span className="font-mono text-cyan-300 tabular-nums">{vessel.fuelPriceYenPerLiter} 円/L</span>
              </div>
              <input
                type="range"
                min={100}
                max={220}
                step={5}
                value={vessel.fuelPriceYenPerLiter}
                onChange={(e) =>
                  setVessel((v) => ({ ...v, fuelPriceYenPerLiter: Number(e.target.value) }))
                }
                className="w-full cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">仮定波浪抵抗感度 (α)</span>
                <span className="font-mono text-cyan-300 tabular-nums">×{vessel.waveDragFactor.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={2}
                step={0.2}
                value={vessel.waveDragFactor}
                onChange={(e) =>
                  setVessel((v) => ({ ...v, waveDragFactor: Number(e.target.value) }))
                }
                className="w-full cursor-pointer"
              />
            </div>
          </div>

          <div className="mt-auto border-t border-slate-800 pt-3 text-[11px] leading-relaxed text-slate-500">
            MVP仕様として、グローバルA*最適化ではなく2本の定義済みサンプル航路を同一海況・仮定係数のもとで比較します。
          </div>
        </aside>

        {/* Right Comparison Viewport + Table */}
        <div className="flex flex-col gap-5">
          {/* Top Delta Summary */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-slate-800 bg-[#0D1524] p-4">
              <div className="text-xs text-slate-400">推定燃料差 (Route B − Route A)</div>
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
                {fuelDiffLiters < 0
                  ? '試算条件下ではRoute Bが低燃費'
                  : '迂回距離によりRoute Bが同等または増加'}
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-[#0D1524] p-4">
              <div className="text-xs text-slate-400">推定燃料費差額</div>
              <div className="mt-1 font-mono text-2xl font-semibold text-slate-100 tabular-nums">
                {costDiffYen >= 0 ? '+' : ''}
                {costDiffYen.toLocaleString()} 円
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                単価 {vessel.fuelPriceYenPerLiter} 円/L 基準（片道試算）
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-[#0D1524] p-4">
              <div className="text-xs text-slate-400">所要時間差</div>
              <div className="mt-1 font-mono text-2xl font-semibold text-slate-100 tabular-nums">
                {estimateB.durationHours - estimateA.durationHours >= 0 ? '+' : ''}
                {(estimateB.durationHours - estimateA.durationHours).toFixed(2)} h
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                順流成分と波浪減速の両方を反映
              </div>
            </div>
          </div>

          {/* Trajectory Preview + Comparison Table */}
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_1fr]">
            <div className="overflow-hidden rounded-lg border border-slate-800 bg-[#070B12]">
              <div className="flex items-center justify-between border-b border-slate-800 bg-[#0D1524] px-4 py-2.5 text-xs">
                <span className="font-semibold text-slate-200">航路サンプル比較プレビュー</span>
                <span className="font-mono text-[11px] text-slate-400">波高背景 + 海流ベクトル</span>
              </div>
              <svg viewBox={`0 0 ${svgW} ${svgH}`} className="block h-auto w-full bg-[#060A11]">
                {/* Wave Height Shading Grid */}
                {grid.map((c) => {
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
                <path
                  d={toPath(routeA)}
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth={2.2}
                  strokeDasharray="6 5"
                />
                <path d={toPath(routeB)} fill="none" stroke="#22D3EE" strokeWidth={2.8} />

                {/* Port & Target Markers */}
                {(() => {
                  const p0 = project(region.defaultPort);
                  const p1 = target ? project(target) : p0;
                  return (
                    <>
                      <circle cx={p0.x} cy={p0.y} r={5} fill="#F8FAFC" stroke="#070B12" strokeWidth={1.5} />
                      <text x={p0.x + 8} y={p0.y + 4} fill="#F8FAFC" fontSize="11" fontWeight="600">
                        出港点
                      </text>
                      <circle cx={p1.x} cy={p1.y} r={7} fill="#22D3EE" fillOpacity={0.3} stroke="#22D3EE" strokeWidth={2} />
                      <text x={p1.x + 10} y={p1.y + 4} fill="#67E8F9" fontSize="11" fontWeight="600">
                        目標海域
                      </text>
                    </>
                  );
                })()}
              </svg>
            </div>

            {/* Side-by-side Numeric Table */}
            <div className="rounded-lg border border-slate-800 bg-[#0D1524] p-4">
              <h3 className="font-display text-sm font-semibold text-slate-100 mb-3">
                航路別シミュレーション比較表
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2 font-medium">比較項目</th>
                      <th className="py-2 text-right font-medium">Route A (最短)</th>
                      <th className="py-2 text-right font-medium text-cyan-300">Route B (配慮)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 font-mono tabular-nums">
                    <tr>
                      <td className="py-2.5 font-sans text-slate-300">航行距離</td>
                      <td className="py-2.5 text-right">{estimateA.distanceKm.toFixed(1)} km</td>
                      <td className="py-2.5 text-right text-cyan-200">{estimateB.distanceKm.toFixed(1)} km</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-sans text-slate-300">推定所要時間</td>
                      <td className="py-2.5 text-right">{estimateA.durationHours.toFixed(2)} h</td>
                      <td className="py-2.5 text-right text-cyan-200">{estimateB.durationHours.toFixed(2)} h</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-sans text-slate-300">推定燃料消費</td>
                      <td className="py-2.5 text-right">{estimateA.estimatedFuelLiters.toFixed(1)} L</td>
                      <td className="py-2.5 text-right text-cyan-200">{estimateB.estimatedFuelLiters.toFixed(1)} L</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-sans text-slate-300">推定燃料費</td>
                      <td className="py-2.5 text-right">¥{estimateA.estimatedFuelCostYen.toLocaleString()}</td>
                      <td className="py-2.5 text-right text-cyan-200">¥{estimateB.estimatedFuelCostYen.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-sans text-slate-300">平均 / 最大波高</td>
                      <td className="py-2.5 text-right">
                        {estimateA.avgWaveHeightM.toFixed(2)} / {estimateA.maxWaveHeightM.toFixed(2)} m
                      </td>
                      <td className="py-2.5 text-right text-cyan-200">
                        {estimateB.avgWaveHeightM.toFixed(2)} / {estimateB.maxWaveHeightM.toFixed(2)} m
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-sans text-slate-300">平均海流アシスト</td>
                      <td className="py-2.5 text-right">
                        {estimateA.avgCurrentAssistKnots >= 0 ? '+' : ''}
                        {estimateA.avgCurrentAssistKnots.toFixed(2)} kt
                      </td>
                      <td className="py-2.5 text-right text-cyan-200">
                        {estimateB.avgCurrentAssistKnots >= 0 ? '+' : ''}
                        {estimateB.avgCurrentAssistKnots.toFixed(2)} kt
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-4 space-y-2 border-t border-slate-800 pt-3 text-[11px] text-slate-400">
                <div>
                  <span className="font-semibold text-slate-200">Route A 所見:</span> {estimateA.cautionNoteJa}
                </div>
                <div>
                  <span className="font-semibold text-cyan-300">Route B 所見:</span> {estimateB.cautionNoteJa}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
