import { useMemo, useState } from 'react';
import { Compass, Layers, Navigation, ArrowRight } from 'lucide-react';
import { REGIONS, SPECIES_LIST } from '../data/oceanData';
import type {
  FishOccurrence,
  HotspotCandidate,
  MapLayer,
  OceanGridCell,
  PointLatLon,
  RegionId,
  SpeciesId,
} from '../types/ocean';

interface OceanMapViewProps {
  regionId: RegionId;
  onChangeRegion: (id: RegionId) => void;
  speciesId: SpeciesId;
  onChangeSpecies: (id: SpeciesId) => void;
  year: number;
  onChangeYear: (y: number) => void;
  month: number;
  onChangeMonth: (m: number) => void;
  layer: MapLayer;
  onChangeLayer: (l: MapLayer) => void;
  showObis: boolean;
  onToggleObis: () => void;
  showCurrents: boolean;
  onToggleCurrents: () => void;
  showRoutes: boolean;
  onToggleRoutes: () => void;
  grid: OceanGridCell[];
  hotspots: HotspotCandidate[];
  selectedHotspotId: string;
  onSelectHotspot: (id: string) => void;
  occurrences: FishOccurrence[];
  routeA: PointLatLon[];
  routeB: PointLatLon[];
  onGoToRouteLab: () => void;
}

const MONTH_NAMES = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

function sstToColor(sst: number | null): string {
  if (sst === null) return 'transparent';
  // Scale 4°C -> 24°C
  const t = Math.max(0, Math.min(1, (sst - 4) / 20));
  if (t < 0.35) {
    const k = t / 0.35;
    return `rgb(${Math.round(14 + k * 8)}, ${Math.round(45 + k * 85)}, ${Math.round(120 + k * 75)})`;
  }
  if (t < 0.65) {
    const k = (t - 0.35) / 0.3;
    return `rgb(${Math.round(22 + k * 145)}, ${Math.round(130 + k * 65)}, ${Math.round(195 - k * 95)})`;
  }
  const k = (t - 0.65) / 0.35;
  return `rgb(${Math.round(167 + k * 78)}, ${Math.round(195 - k * 105)}, ${Math.round(100 - k * 65)})`;
}

function chlToColor(chl: number | null): string {
  if (chl === null) return 'transparent';
  // Log-like visual scaling 0.1 -> 3.5 mg/m3
  const t = Math.max(0, Math.min(1, (Math.log10(Math.max(0.08, chl)) + 1.0) / 1.55));
  if (t < 0.5) {
    const k = t / 0.5;
    return `rgb(${Math.round(10 + k * 8)}, ${Math.round(35 + k * 95)}, ${Math.round(80 + k * 55)})`;
  }
  const k = (t - 0.5) / 0.5;
  return `rgb(${Math.round(18 + k * 95)}, ${Math.round(130 + k * 88)}, ${Math.round(135 - k * 50)})`;
}

function habitatToColor(score: number | null): string {
  if (score === null) return 'transparent';
  const t = Math.max(0, Math.min(1, score / 100));
  if (t < 0.5) {
    const k = t / 0.5;
    return `rgb(${Math.round(13 + k * 6)}, ${Math.round(25 + k * 75)}, ${Math.round(48 + k * 82)})`;
  }
  const k = (t - 0.5) / 0.5;
  return `rgb(${Math.round(19 + k * 35)}, ${Math.round(100 + k * 118)}, ${Math.round(130 + k * 95)})`;
}

export function OceanMapView({
  regionId,
  onChangeRegion,
  speciesId,
  onChangeSpecies,
  year,
  onChangeYear,
  month,
  onChangeMonth,
  layer,
  onChangeLayer,
  showObis,
  onToggleObis,
  showCurrents,
  onToggleCurrents,
  showRoutes,
  onToggleRoutes,
  grid,
  hotspots,
  selectedHotspotId,
  onSelectHotspot,
  occurrences,
  routeA,
  routeB,
  onGoToRouteLab,
}: OceanMapViewProps) {
  const region = REGIONS[regionId];
  const species = SPECIES_LIST[speciesId];
  const [hoveredCell, setHoveredCell] = useState<OceanGridCell | null>(null);

  const svgWidth = 780;
  const svgHeight = 520;
  const rows = 20;
  const cols = 26;
  const cellW = svgWidth / cols;
  const cellH = svgHeight / rows;

  const project = (pt: PointLatLon) => {
    const x = ((pt.lon - region.bbox.west) / (region.bbox.east - region.bbox.west)) * svgWidth;
    const y = ((region.bbox.north - pt.lat) / (region.bbox.north - region.bbox.south)) * svgHeight;
    return { x, y };
  };

  const selectedHotspot = useMemo(
    () => hotspots.find((h) => h.id === selectedHotspotId) ?? hotspots[0],
    [hotspots, selectedHotspotId]
  );

  const routeAPath = useMemo(
    () =>
      routeA
        .map((p, i) => {
          const { x, y } = project(p);
          return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' '),
    [routeA, region]
  );

  const routeBPath = useMemo(
    () =>
      routeB
        .map((p, i) => {
          const { x, y } = project(p);
          return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' '),
    [routeB, region]
  );

  const legendMeta = useMemo(() => {
    if (layer === 'sst') {
      return {
        title: '海面水温 SST (°C)',
        min: '4.0°C',
        mid: '14.0°C',
        max: '24.0°C',
        gradient: 'linear-gradient(90deg, rgb(14,45,120), rgb(22,130,195), rgb(167,195,100), rgb(245,90,35))',
        source: 'NASA Earthdata SST プロダクト参照モデル',
      };
    }
    if (layer === 'chlor_a') {
      return {
        title: 'クロロフィルa濃度 (mg/m³)',
        min: '0.1',
        mid: '0.8',
        max: '3.5+',
        gradient: 'linear-gradient(90deg, rgb(10,35,80), rgb(18,130,135), rgb(113,218,85))',
        source: 'NASA OB.DAAC / Ocean Color 基礎生産プロキシ',
      };
    }
    return {
      title: '探索用環境適合指数 (0–100)',
      min: '0',
      mid: '50',
      max: '100',
      gradient: 'linear-gradient(90deg, rgb(13,25,48), rgb(19,100,130), rgb(54,218,225))',
      source: '探索用合成指数 (0.40×水温 + 0.35×Chl-a + 0.25×OBIS)',
    };
  }, [layer]);

  const latTicks = useMemo(() => {
    const step = (region.bbox.north - region.bbox.south) / 4;
    return [1, 2, 3].map((i) => Number((region.bbox.south + step * i).toFixed(1)));
  }, [region]);

  const lonTicks = useMemo(() => {
    const step = (region.bbox.east - region.bbox.west) / 4;
    return [1, 2, 3].map((i) => Number((region.bbox.west + step * i).toFixed(1)));
  }, [region]);

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-5">
      {/* Metadata context bar (no pill boxes) */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-3">
        <div>
          <h1 className="font-display text-xl font-semibold text-slate-50">
            海洋環境・餌場予測探索マップ
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">
            <span>表示モード: 事前キャッシュ・シミュレーション</span>
            <span className="mx-2 text-slate-600">·</span>
            <span>対象海域: {region.nameJa}</span>
            <span className="mx-2 text-slate-600">·</span>
            <span>OBIS出現点は過去の報告記録であり現在の魚群位置ではありません</span>
          </p>
        </div>

        <button
          type="button"
          onClick={onGoToRouteLab}
          className="inline-flex items-center gap-2 rounded-md border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-xs font-medium text-cyan-300 hover:bg-cyan-500/20 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Navigation className="h-3.5 w-3.5" />
          <span>選択ポイントへ省燃料ルート試算</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Main Split Console: Left Controls (320px) + Map Canvas (flex-1) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
        {/* Left Control Column */}
        <aside className="flex flex-col gap-5 rounded-lg border border-slate-800 bg-[#0D1524] p-4">
          {/* Region Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">
              対象海域（プリセット）
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              {(Object.keys(REGIONS) as RegionId[]).map((id) => {
                const r = REGIONS[id];
                const active = regionId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onChangeRegion(id)}
                    className={`rounded-md border px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                      active
                        ? 'border-cyan-500/70 bg-cyan-500/10 text-slate-100'
                        : 'border-slate-800 bg-[#070B12]/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-semibold">{r.nameJa}</div>
                    <div className="mt-0.5 font-mono text-[11px] text-slate-500 tabular-nums">
                      {r.bbox.south}–{r.bbox.north}°N · {r.bbox.west}–{r.bbox.east}°E
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Species Selector */}
          <div>
            <label htmlFor="species-select" className="block text-xs font-medium text-slate-400 mb-2">
              対象魚種（OBIS学名基準）
            </label>
            <select
              id="species-select"
              value={speciesId}
              onChange={(e) => onChangeSpecies(e.target.value as SpeciesId)}
              className="w-full rounded-md border border-slate-700 bg-[#070B12] px-3 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
            >
              {(Object.keys(SPECIES_LIST) as SpeciesId[]).map((id) => {
                const sp = SPECIES_LIST[id];
                return (
                  <option key={id} value={id}>
                    {sp.nameJa} ({sp.scientificName})
                  </option>
                );
              })}
            </select>
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
              {species.forageNoteJa}
            </p>
          </div>

          {/* Primary Layer */}
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <Layers className="h-3.5 w-3.5" />
              <span>衛星・解析ベースレイヤー</span>
            </div>
            <div className="grid grid-cols-3 gap-1 rounded-md bg-[#070B12] p-1 border border-slate-800">
              {(
                [
                  { id: 'sst', label: '海面水温' },
                  { id: 'chlor_a', label: 'Chl-a' },
                  { id: 'habitat', label: '適合指数' },
                ] as { id: MapLayer; label: string }[]
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onChangeLayer(item.id)}
                  className={`rounded px-2 py-1.5 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    layer === item.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time Scrubber */}
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-400">観測年月スライダー</span>
              <span className="font-mono font-semibold text-cyan-300 tabular-nums">
                {year}年 {MONTH_NAMES[month - 1]}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="w-8 font-mono text-[11px] text-slate-500">年</span>
                <input
                  type="range"
                  min={2016}
                  max={2025}
                  value={year}
                  onChange={(e) => onChangeYear(Number(e.target.value))}
                  className="w-full cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="w-8 font-mono text-[11px] text-slate-500">月</span>
                <input
                  type="range"
                  min={1}
                  max={12}
                  value={month}
                  onChange={(e) => onChangeMonth(Number(e.target.value))}
                  className="w-full cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Overlays */}
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <Compass className="h-3.5 w-3.5" />
              <span>重ね合わせレイヤー</span>
            </div>
            <div className="space-y-2 text-xs">
              <label className="flex items-center justify-between rounded-md border border-slate-800/80 bg-[#070B12]/50 px-3 py-2 cursor-pointer hover:border-slate-700">
                <span className="text-slate-300">OBIS 過去出現記録 ({occurrences.length}点)</span>
                <input
                  type="checkbox"
                  checked={showObis}
                  onChange={onToggleObis}
                  className="h-4 w-4 accent-amber-400"
                />
              </label>
              <label className="flex items-center justify-between rounded-md border border-slate-800/80 bg-[#070B12]/50 px-3 py-2 cursor-pointer hover:border-slate-700">
                <span className="text-slate-300">海流ベクトル (流速・流向)</span>
                <input
                  type="checkbox"
                  checked={showCurrents}
                  onChange={onToggleCurrents}
                  className="h-4 w-4 accent-cyan-400"
                />
              </label>
              <label className="flex items-center justify-between rounded-md border border-slate-800/80 bg-[#070B12]/50 px-3 py-2 cursor-pointer hover:border-slate-700">
                <span className="text-slate-300">比較航路サンプル線 (A/B)</span>
                <input
                  type="checkbox"
                  checked={showRoutes}
                  onChange={onToggleRoutes}
                  className="h-4 w-4 accent-teal-400"
                />
              </label>
            </div>
          </div>

          {/* Disclaimer */}
          <p className="mt-auto border-t border-slate-800 pt-3 text-[11px] leading-relaxed text-slate-500">
            欠損（雲域等）は透明ハッチで区別表示し、0として補間していません。適合指数は未検証の探索用モデル値です。
          </p>
        </aside>

        {/* Center Map Stage */}
        <div className="flex flex-col gap-4">
          <div className="relative overflow-hidden rounded-lg border border-slate-800 bg-[#070B12]">
            {/* Legend Strip */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 bg-[#0D1524]/80 px-4 py-2.5 text-xs">
              <div>
                <span className="font-semibold text-slate-200">{legendMeta.title}</span>
                <span className="ml-2 text-slate-500">· {legendMeta.source}</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400 tabular-nums">
                <span>{legendMeta.min}</span>
                <div
                  className="h-2.5 w-28 rounded-sm border border-slate-700"
                  style={{ background: legendMeta.gradient }}
                />
                <span>{legendMeta.mid}</span>
                <span>→</span>
                <span>{legendMeta.max}</span>
                <span className="ml-2 text-slate-500">□ 欠損(雲)</span>
              </div>
            </div>

            {/* Interactive SVG Ocean Grid */}
            <div className="relative">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="block h-auto w-full cursor-crosshair select-none bg-[#060A11]"
                onMouseLeave={() => setHoveredCell(null)}
              >
                <defs>
                  <pattern
                    id="cloud-hatch"
                    width="8"
                    height="8"
                    patternTransform="rotate(45 0 0)"
                    patternUnits="userSpaceOnUse"
                  >
                    <line x1="0" y1="0" x2="0" y2="8" stroke="#334155" strokeWidth="1.5" />
                  </pattern>
                  <marker
                    id="current-arrow"
                    markerWidth="5"
                    markerHeight="5"
                    refX="4"
                    refY="2.5"
                    orient="auto"
                  >
                    <path d="M0,0.5 L4.5,2.5 L0,4.5 Z" fill="rgba(226, 232, 240, 0.72)" />
                  </marker>
                </defs>

                {/* Grid Cells */}
                {grid.map((cell) => {
                  if (cell.isLand) return null;
                  const x = cell.col * cellW;
                  const y = cell.row * cellH;
                  const valMissing =
                    (layer === 'sst' && cell.sst === null) ||
                    (layer === 'chlor_a' && cell.chlorA === null) ||
                    (layer === 'habitat' && cell.habitatScore === null);

                  const fill = valMissing
                    ? 'url(#cloud-hatch)'
                    : layer === 'sst'
                      ? sstToColor(cell.sst)
                      : layer === 'chlor_a'
                        ? chlToColor(cell.chlorA)
                        : habitatToColor(cell.habitatScore);

                  const isHovered =
                    hoveredCell?.row === cell.row && hoveredCell?.col === cell.col;

                  return (
                    <rect
                      key={`${cell.row}-${cell.col}`}
                      x={x}
                      y={y}
                      width={cellW + 0.5}
                      height={cellH + 0.5}
                      fill={fill}
                      fillOpacity={valMissing ? 0.45 : 0.88}
                      stroke={isHovered ? '#F8FAFC' : 'rgba(15, 23, 42, 0.25)'}
                      strokeWidth={isHovered ? 1.5 : 0.5}
                      onMouseEnter={() => setHoveredCell(cell)}
                    />
                  );
                })}

                {/* Lat/Lon Graticules */}
                {latTicks.map((lat) => {
                  const { y } = project({ lat, lon: region.bbox.west });
                  return (
                    <g key={`lat-${lat}`} className="pointer-events-none">
                      <line
                        x1={0}
                        y1={y}
                        x2={svgWidth}
                        y2={y}
                        stroke="rgba(148, 163, 184, 0.16)"
                        strokeDasharray="3 4"
                      />
                      <text
                        x={8}
                        y={y - 4}
                        fill="rgba(203, 213, 225, 0.75)"
                        fontSize="10"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {lat.toFixed(1)}°N
                      </text>
                    </g>
                  );
                })}
                {lonTicks.map((lon) => {
                  const { x } = project({ lat: region.bbox.south, lon });
                  return (
                    <g key={`lon-${lon}`} className="pointer-events-none">
                      <line
                        x1={x}
                        y1={0}
                        x2={x}
                        y2={svgHeight}
                        stroke="rgba(148, 163, 184, 0.16)"
                        strokeDasharray="3 4"
                      />
                      <text
                        x={x + 4}
                        y={svgHeight - 8}
                        fill="rgba(203, 213, 225, 0.75)"
                        fontSize="10"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {lon.toFixed(1)}°E
                      </text>
                    </g>
                  );
                })}

                {/* Land Polygons */}
                {region.landPolygons.map((poly, idx) => {
                  const pts = poly
                    .map((p) => {
                      const { x, y } = project(p);
                      return `${x.toFixed(1)},${y.toFixed(1)}`;
                    })
                    .join(' ');
                  return (
                    <polygon
                      key={`land-${idx}`}
                      points={pts}
                      fill="#141C2B"
                      stroke="#475569"
                      strokeWidth="1.4"
                    />
                  );
                })}

                {/* Ocean Current Vector Field */}
                {showCurrents &&
                  grid
                    .filter((c) => !c.isLand && c.row % 2 === 1 && c.col % 2 === 1)
                    .map((cell) => {
                      const { x, y } = project({ lat: cell.lat, lon: cell.lon });
                      const rad = ((cell.currentDirDeg - 90) * Math.PI) / 180;
                      const len = Math.min(20, 7 + cell.currentSpeedMs * 11);
                      const dx = Math.cos(rad) * len;
                      const dy = Math.sin(rad) * len;
                      return (
                        <line
                          key={`vec-${cell.row}-${cell.col}`}
                          x1={x - dx * 0.4}
                          y1={y - dy * 0.4}
                          x2={x + dx * 0.6}
                          y2={y + dy * 0.6}
                          stroke="rgba(226, 232, 240, 0.65)"
                          strokeWidth="1.2"
                          markerEnd="url(#current-arrow)"
                          className="pointer-events-none"
                        />
                      );
                    })}

                {/* OBIS Historical Occurrences */}
                {showObis &&
                  occurrences.map((occ) => {
                    const { x, y } = project({ lat: occ.lat, lon: occ.lon });
                    return (
                      <circle
                        key={occ.id}
                        cx={x}
                        cy={y}
                        r={3.3}
                        fill="#F59E0B"
                        fillOpacity={0.82}
                        stroke="#070B12"
                        strokeWidth={1}
                        className="pointer-events-none"
                      />
                    );
                  })}

                {/* Candidate Routes Overlay */}
                {showRoutes && (
                  <g className="pointer-events-none">
                    <path
                      d={routeAPath}
                      fill="none"
                      stroke="#E2E8F0"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      strokeOpacity={0.8}
                    />
                    <path
                      d={routeBPath}
                      fill="none"
                      stroke="#22D3EE"
                      strokeWidth={2.5}
                      strokeOpacity={0.95}
                    />
                    {/* Departure Port Marker */}
                    {(() => {
                      const port = project(region.defaultPort);
                      return (
                        <g>
                          <rect
                            x={port.x - 5}
                            y={port.y - 5}
                            width={10}
                            height={10}
                            fill="#F8FAFC"
                            stroke="#070B12"
                            strokeWidth={1.5}
                          />
                          <text
                            x={port.x + 9}
                            y={port.y + 4}
                            fill="#F8FAFC"
                            fontSize="11"
                            fontWeight="600"
                          >
                            {region.defaultPort.nameJa}
                          </text>
                        </g>
                      );
                    })()}
                  </g>
                )}

                {/* Candidate Fishing / Forage Hotspots */}
                {hotspots.map((spot, idx) => {
                  const { x, y } = project({ lat: spot.lat, lon: spot.lon });
                  const isSelected = spot.id === selectedHotspot?.id;
                  const labelChar = ['A', 'B', 'C'][idx] ?? String(idx + 1);
                  return (
                    <g
                      key={spot.id}
                      onClick={() => onSelectHotspot(spot.id)}
                      className="cursor-pointer"
                    >
                      <circle
                        cx={x}
                        cy={y}
                        r={isSelected ? 15 : 11}
                        fill={isSelected ? 'rgba(6, 182, 212, 0.24)' : 'rgba(15, 23, 42, 0.6)'}
                        stroke={isSelected ? '#22D3EE' : '#94A3B8'}
                        strokeWidth={isSelected ? 2 : 1.2}
                      />
                      <text
                        x={x}
                        y={y + 4}
                        textAnchor="middle"
                        fill={isSelected ? '#ECFEFF' : '#E2E8F0'}
                        fontSize="11"
                        fontWeight="700"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {labelChar}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Corner Crosshair Probe HUD */}
              <div className="pointer-events-none absolute top-3 right-3 rounded border border-slate-700/80 bg-[#070B12]/90 px-3 py-2 font-mono text-[11px] text-slate-200 tabular-nums backdrop-blur-sm">
                {hoveredCell ? (
                  <div className="space-y-0.5">
                    <div className="text-slate-400">
                      {hoveredCell.lat.toFixed(2)}°N, {hoveredCell.lon.toFixed(2)}°E
                    </div>
                    <div>
                      SST: {hoveredCell.sst !== null ? `${hoveredCell.sst.toFixed(1)} °C` : '欠損(雲)'}
                      <span className="mx-1.5 text-slate-600">|</span>
                      Chl: {hoveredCell.chlorA !== null ? `${hoveredCell.chlorA.toFixed(2)} mg/m³` : '欠損'}
                    </div>
                    <div>
                      海流: {hoveredCell.currentSpeedMs.toFixed(2)} m/s ({hoveredCell.currentDirDeg}°)
                      <span className="mx-1.5 text-slate-600">|</span>
                      波高: {hoveredCell.waveHeightM.toFixed(1)} m
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-400">マップ上でカーソル移動すると詳細値を計測</div>
                )}
              </div>

              {/* Bottom-left Map Key */}
              <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap items-center gap-4 rounded border border-slate-800 bg-[#070B12]/85 px-3 py-1.5 text-[11px] text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
                  OBIS過去記録
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block h-0.5 w-4 border-t-2 border-dashed border-slate-200" />
                  Route A (最短)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block h-0.5 w-4 bg-cyan-400" />
                  Route B (海況配慮)
                </span>
              </div>
            </div>
          </div>

          {/* Candidate Hotspot Breakdown Cards (Single elevation, clean grid) */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {hotspots.map((spot, idx) => {
              const isSelected = spot.id === selectedHotspot?.id;
              const char = ['A', 'B', 'C'][idx] ?? String(idx + 1);
              return (
                <button
                  key={spot.id}
                  type="button"
                  onClick={() => onSelectHotspot(spot.id)}
                  className={`rounded-lg border p-3.5 text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-cyan-500/70 bg-[#101B2E]'
                      : 'border-slate-800 bg-[#0D1524] hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-100">
                      {char}. {spot.labelJa.replace(/候補ポイント [A-C]（|）/g, '')}
                    </span>
                    <span className="font-mono text-sm font-semibold text-cyan-300 tabular-nums">
                      指数 {spot.habitatScore}
                    </span>
                  </div>
                  <div className="mt-1 font-mono text-[11px] text-slate-400 tabular-nums">
                    {spot.lat.toFixed(2)}°N, {spot.lon.toFixed(2)}°E · {spot.sst.toFixed(1)}°C · {spot.chlorA.toFixed(2)} mg/m³
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-400 line-clamp-2">
                    {spot.rationaleJa}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
