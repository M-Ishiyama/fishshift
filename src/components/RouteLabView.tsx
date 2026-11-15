import { useMemo, useState } from 'react';
import { AlertTriangle, Ship } from 'lucide-react';
import { GRID_COLS, GRID_ROWS, PROVENANCE, REGIONS, buildCandidateRoutes } from '../data/oceanData';
import { useT } from '../i18n/I18nProvider';
import { useFormat } from '../i18n/format';
import { useCautionText, useHotspotText, useRegionText } from '../i18n/render';
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
  const t = useT();
  const fmt = useFormat();
  const regionText = useRegionText();
  const hotspotText = useHotspotText();
  const cautionText = useCautionText();
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
        'route.a.label',
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
        'route.b.label',
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
            <strong>{t('route.safety.label')}</strong> {t('route.safety.body')}
          </span>
        </div>
        <span className="font-mono text-[11px] text-amber-300/90 whitespace-nowrap">
          {t('route.modelNote')}
        </span>
      </div>

      {/* Provenance of the inputs behind every number on this screen. The fuel and
          cost figures are the most concrete values in the app, so the non-NASA
          origin of their drivers has to be stated here, not only in Feasibility. */}
      <div className="mb-5 rounded-lg border border-slate-800 bg-[#0D1524] px-4 py-3 text-[11px] leading-relaxed text-slate-400">
        <span className="font-semibold text-slate-200">{t('route.provenance.label')}</span>{' '}
        {t('route.provenance.lead')}
        <span className="font-mono text-amber-300/90">{PROVENANCE.estimated_fields.fields.join(' / ')}</span>
        {t('route.provenance.mid')}
        <span className="text-amber-300/90">{t('route.provenance.emphasis')}</span>
        {t('route.provenance.tail')}{' '}
        <span className="text-slate-200">{t('route.provenance.relative')}</span>
        {t('route.provenance.close')}
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[340px_1fr]">
        {/* Left Vessel & Scenario Controls */}
        <aside className="flex flex-col gap-4 rounded-lg border border-slate-800 bg-[#0D1524] p-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Ship className="h-4 w-4 text-cyan-400" />
            <h2 className="font-display text-sm font-semibold text-slate-100">
              {t('route.panel.conditions')}
            </h2>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              {t('route.panel.port')}
            </label>
            <div className="rounded border border-slate-800 bg-[#070B12] px-3 py-2 text-xs text-slate-200">
              <div>{regionText.portName(region)}</div>
              <div className="mt-0.5 font-mono text-[11px] text-slate-500 tabular-nums">
                {region.defaultPort.lat.toFixed(2)}°N, {region.defaultPort.lon.toFixed(2)}°E
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="hotspot-select" className="block text-xs font-medium text-slate-400 mb-1.5">
              {t('route.panel.target')}
            </label>
            <select
              id="hotspot-select"
              value={target?.id ?? ''}
              onChange={(e) => onSelectHotspot(e.target.value)}
              className="w-full rounded border border-slate-700 bg-[#070B12] px-3 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
            >
              {hotspots.map((h) => (
                <option key={h.id} value={h.id}>
                  {hotspotText.fullLabel(h)} ({t('hotspot.indexShort')} {h.habitatScore})
                </option>
              ))}
            </select>
          </div>

          {/* Sliders */}
          <div className="space-y-3 pt-1">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">{t('route.vessel.speed')}</span>
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
                <span className="text-slate-400">{t('route.vessel.fuelRate')}</span>
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
                <span className="text-slate-400">{t('route.vessel.fuelPrice')}</span>
                <span className="font-mono text-cyan-300 tabular-nums">{vessel.fuelPriceYenPerLiter} {t('unit.jpyPerLiter')}</span>
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
                <span className="text-slate-400">{t('route.vessel.waveDrag')}</span>
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
            {t('route.mvpNote')}
          </div>
        </aside>

        {/* Right Comparison Viewport + Table */}
        <div className="flex flex-col gap-5">
          {/* Top Delta Summary */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-slate-800 bg-[#0D1524] p-4">
              <div className="text-xs text-slate-400">{t('route.delta.fuel')}</div>
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
                  ? t('route.delta.fuelBetter')
                  : t('route.delta.fuelWorse')}
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-[#0D1524] p-4">
              <div className="text-xs text-slate-400">{t('route.delta.cost')}</div>
              <div className="mt-1 font-mono text-2xl font-semibold text-slate-100 tabular-nums">
                {costDiffYen >= 0 ? '+' : ''}
                {fmt.jpy(costDiffYen)} {t('unit.jpy')}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                {t('route.delta.costBasis', { price: String(vessel.fuelPriceYenPerLiter) })}
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-[#0D1524] p-4">
              <div className="text-xs text-slate-400">{t('route.delta.time')}</div>
              <div className="mt-1 font-mono text-2xl font-semibold text-slate-100 tabular-nums">
                {estimateB.durationHours - estimateA.durationHours >= 0 ? '+' : ''}
                {(estimateB.durationHours - estimateA.durationHours).toFixed(2)} h
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                {t('route.delta.timeNote')}
              </div>
            </div>
          </div>

          {/* Trajectory Preview + Comparison Table */}
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_1fr]">
            <div className="overflow-hidden rounded-lg border border-slate-800 bg-[#070B12]">
              <div className="flex items-center justify-between border-b border-slate-800 bg-[#0D1524] px-4 py-2.5 text-xs">
                <span className="font-semibold text-slate-200">{t('route.preview.title')}</span>
                <span className="font-mono text-[11px] text-slate-400">{t('route.preview.legend')}</span>
              </div>
              <svg viewBox={`0 0 ${svgW} ${svgH}`} className="block h-auto w-full bg-[#060A11]">
                {/* Wave Height Shading Grid */}
                {grid.map((c) => {
                  if (c.isLand) return null;
                  const cellW = svgW / GRID_COLS;
                  const cellH = svgH / GRID_ROWS;
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
                        {t('route.preview.port')}
                      </text>
                      <circle cx={p1.x} cy={p1.y} r={7} fill="#22D3EE" fillOpacity={0.3} stroke="#22D3EE" strokeWidth={2} />
                      <text x={p1.x + 10} y={p1.y + 4} fill="#67E8F9" fontSize="11" fontWeight="600">
                        {t('route.preview.target')}
                      </text>
                    </>
                  );
                })()}
              </svg>
            </div>

            {/* Side-by-side Numeric Table */}
            <div className="rounded-lg border border-slate-800 bg-[#0D1524] p-4">
              <h3 className="font-display text-sm font-semibold text-slate-100 mb-3">
                {t('route.table.title')}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2 font-medium">{t('route.table.metric')}</th>
                      <th className="py-2 text-right font-medium">{t('route.table.routeA')}</th>
                      <th className="py-2 text-right font-medium text-cyan-300">{t('route.table.routeB')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 font-mono tabular-nums">
                    <tr>
                      <td className="py-2.5 font-sans text-slate-300">{t('route.table.distance')}</td>
                      <td className="py-2.5 text-right">{estimateA.distanceKm.toFixed(1)} km</td>
                      <td className="py-2.5 text-right text-cyan-200">{estimateB.distanceKm.toFixed(1)} km</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-sans text-slate-300">{t('route.table.duration')}</td>
                      <td className="py-2.5 text-right">{estimateA.durationHours.toFixed(2)} h</td>
                      <td className="py-2.5 text-right text-cyan-200">{estimateB.durationHours.toFixed(2)} h</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-sans text-slate-300">{t('route.table.fuel')}</td>
                      <td className="py-2.5 text-right">{estimateA.estimatedFuelLiters.toFixed(1)} L</td>
                      <td className="py-2.5 text-right text-cyan-200">{estimateB.estimatedFuelLiters.toFixed(1)} L</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-sans text-slate-300">{t('route.table.cost')}</td>
                      <td className="py-2.5 text-right">{t('unit.jpyPrefixed', { amount: fmt.jpy(estimateA.estimatedFuelCostYen) })}</td>
                      <td className="py-2.5 text-right text-cyan-200">{t('unit.jpyPrefixed', { amount: fmt.jpy(estimateB.estimatedFuelCostYen) })}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-sans text-slate-300">{t('route.table.wave')}</td>
                      <td className="py-2.5 text-right">
                        {estimateA.avgWaveHeightM.toFixed(2)} / {estimateA.maxWaveHeightM.toFixed(2)} m
                      </td>
                      <td className="py-2.5 text-right text-cyan-200">
                        {estimateB.avgWaveHeightM.toFixed(2)} / {estimateB.maxWaveHeightM.toFixed(2)} m
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-sans text-slate-300">{t('route.table.assist')}</td>
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
                  <span className="font-semibold text-slate-200">{t('route.finding.a')}</span> {cautionText(estimateA.caution)}
                </div>
                <div>
                  <span className="font-semibold text-cyan-300">{t('route.finding.b')}</span> {cautionText(estimateB.caution)}
                </div>
                <div className="pt-1 text-slate-500">
                  {t('route.footnote')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
