import { useEffect, useMemo, useState } from 'react';
import { DemoBanner, DEMO_STEPS } from './components/DemoBanner';
import { FeasibilityView } from './components/FeasibilityView';
import { OceanMapView } from './components/OceanMapView';
import { PresentationView } from './components/PresentationView';
import { RouteLabView } from './components/RouteLabView';
import { TopBar } from './components/TopBar';
import { TrendExplorerView } from './components/TrendExplorerView';
import {
  REGIONS,
  buildCandidateRoutes,
  buildObisOccurrences,
  buildOceanGrid,
  extractHotspots,
} from './data/oceanData';
import type {
  ConditionBasis,
  DepartureSlot,
  FuelType,
  Locale,
  MapLayer,
  RegionId,
  SpeciesId,
  TabId,
  VesselParams,
} from './types/ocean';
import { calculateRouteEstimate, projectNextDayConditions } from './utils/oceanMath';

function getInitialLocale(): Locale {
  if (typeof window !== 'undefined') {
    const param = new URLSearchParams(window.location.search).get('lang');
    if (param === 'en' || param === 'ja') return param;
    try {
      const saved = window.localStorage.getItem('fishshift_locale');
      if (saved === 'en' || saved === 'ja') return saved;
    } catch {
      // ignore storage errors
    }
  }
  return 'ja';
}

export default function App() {
  const [locale, setLocale] = useState<Locale>(getInitialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      window.localStorage.setItem('fishshift_locale', locale);
    } catch {
      // ignore storage errors
    }
  }, [locale]);

  const [activeTab, setActiveTab] = useState<TabId>('map');
  const [regionId, setRegionId] = useState<RegionId>('tsugaru');
  const [speciesId, setSpeciesId] = useState<SpeciesId>('thunnus_orientalis');
  const [year, setYear] = useState<number>(2025);
  const [month, setMonth] = useState<number>(9);
  const [layer, setLayer] = useState<MapLayer>('sst');
  const [showObis, setShowObis] = useState<boolean>(true);
  const [showCurrents, setShowCurrents] = useState<boolean>(true);
  const [showWinds, setShowWinds] = useState<boolean>(true);
  const [showRoutes, setShowRoutes] = useState<boolean>(true);
  const [selectedHotspotId, setSelectedHotspotId] = useState<string>('hotspot-1');

  const [departureSlot, setDepartureSlot] = useState<DepartureSlot>('04:00');
  const [conditionBasis, setConditionBasis] = useState<ConditionBasis>('historical_climatology');
  const [vessel, setVessel] = useState<VesselParams>({
    fuelType: 'gasoline',
    speedKnots: 12.0,
    fuelLitersPerHour: 65,
    fuelPriceYenPerLiter: 175,
    waveDragFactor: 1.0,
    windDragFactor: 1.0,
  });

  const handleFuelTypeChange = (fuelType: FuelType) => {
    setVessel((v) => ({
      ...v,
      fuelType,
      fuelPriceYenPerLiter: fuelType === 'gasoline' ? 175 : 145,
      fuelLitersPerHour: fuelType === 'gasoline' ? 65 : 95,
    }));
  };

  const [demoActive, setDemoActive] = useState<boolean>(false);
  const [demoStepIndex, setDemoStepIndex] = useState<number>(0);

  const grid = useMemo(
    () => buildOceanGrid(regionId, year, month, speciesId),
    [regionId, year, month, speciesId]
  );

  const hotspots = useMemo(() => extractHotspots(grid, speciesId), [grid, speciesId]);

  const occurrences = useMemo(
    () => buildObisOccurrences(regionId, speciesId, grid),
    [regionId, speciesId, grid]
  );

  const activeHotspot = useMemo(
    () => hotspots.find((h) => h.id === selectedHotspotId) ?? hotspots[0],
    [hotspots, selectedHotspotId]
  );

  const { routeA, routeB } = useMemo(() => {
    if (!activeHotspot) return { routeA: [], routeB: [] };
    return buildCandidateRoutes(
      REGIONS[regionId].defaultPort,
      { lat: activeHotspot.lat, lon: activeHotspot.lon },
      regionId
    );
  }, [regionId, activeHotspot]);

  // Next-day (2026-11-15) route calculation is anchored to November seasonal conditions,
  // independent of which historical month the user is inspecting on the SST/Chl-a slider.
  const nextDayBaselineGrid = useMemo(
    () => buildOceanGrid(regionId, 2025, 11, speciesId),
    [regionId, speciesId]
  );

  const projectedGrid = useMemo(
    () => projectNextDayConditions(nextDayBaselineGrid, conditionBasis, departureSlot),
    [nextDayBaselineGrid, conditionBasis, departureSlot]
  );

  const estimateA = useMemo(
    () =>
      calculateRouteEstimate(
        'A',
        'Route A: 最短距離優先ライン',
        'Route A: Distance-Priority Line',
        'Distance-priority direct sample',
        routeA,
        projectedGrid,
        vessel
      ),
    [routeA, projectedGrid, vessel]
  );

  const estimateB = useMemo(
    () =>
      calculateRouteEstimate(
        'B',
        'Route B: 海流・波浪配慮ライン',
        'Route B: Current & Sea-State Aware',
        'Current & sea-state aware sample',
        routeB,
        projectedGrid,
        vessel
      ),
    [routeB, projectedGrid, vessel]
  );

  const applyDemoStep = (stepIdx: number) => {
    setDemoStepIndex(stepIdx);
    if (stepIdx === 0) {
      setRegionId('tsugaru');
      setSpeciesId('thunnus_orientalis');
      setYear(2025);
      setMonth(9);
      setLayer('sst');
      setShowObis(false);
      setShowCurrents(true);
      setShowWinds(true);
      setShowRoutes(false);
      setActiveTab('map');
    } else if (stepIdx === 1) {
      setRegionId('tsugaru');
      setYear(2025);
      setMonth(5);
      setLayer('chlor_a');
      setShowObis(false);
      setShowCurrents(true);
      setShowWinds(true);
      setShowRoutes(false);
      setActiveTab('map');
    } else if (stepIdx === 2) {
      setRegionId('tsugaru');
      setSpeciesId('thunnus_orientalis');
      setYear(2025);
      setMonth(9);
      setLayer('habitat');
      setShowObis(true);
      setShowCurrents(true);
      setShowWinds(true);
      setShowRoutes(true);
      setSelectedHotspotId('hotspot-1');
      setActiveTab('map');
    } else if (stepIdx === 3) {
      setRegionId('tsugaru');
      setActiveTab('trends');
    } else if (stepIdx === 4) {
      setRegionId('tsugaru');
      setSelectedHotspotId('hotspot-1');
      setActiveTab('routes');
    }
  };

  const handleToggleDemo = () => {
    if (demoActive) {
      setDemoActive(false);
    } else {
      setDemoActive(true);
      applyDemoStep(0);
    }
  };

  const handleRegionChange = (id: RegionId) => {
    setRegionId(id);
    setSelectedHotspotId('hotspot-1');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070B12] text-slate-100">
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        demoActive={demoActive}
        onToggleDemo={handleToggleDemo}
        locale={locale}
        onChangeLocale={setLocale}
      />

      {demoActive && (
        <DemoBanner
          locale={locale}
          currentStepIndex={demoStepIndex}
          onPrev={() => applyDemoStep(Math.max(0, demoStepIndex - 1))}
          onNext={() => applyDemoStep(Math.min(DEMO_STEPS.length - 1, demoStepIndex + 1))}
          onClose={() => setDemoActive(false)}
        />
      )}

      <main className="flex-1">
        {activeTab === 'map' && (
          <OceanMapView
            locale={locale}
            regionId={regionId}
            onChangeRegion={handleRegionChange}
            speciesId={speciesId}
            onChangeSpecies={setSpeciesId}
            year={year}
            onChangeYear={setYear}
            month={month}
            onChangeMonth={setMonth}
            layer={layer}
            onChangeLayer={setLayer}
            showObis={showObis}
            onToggleObis={() => setShowObis((v) => !v)}
            showCurrents={showCurrents}
            onToggleCurrents={() => setShowCurrents((v) => !v)}
            showWinds={showWinds}
            onToggleWinds={() => setShowWinds((v) => !v)}
            showRoutes={showRoutes}
            onToggleRoutes={() => setShowRoutes((v) => !v)}
            grid={grid}
            hotspots={hotspots}
            selectedHotspotId={selectedHotspotId}
            onSelectHotspot={setSelectedHotspotId}
            occurrences={occurrences}
            routeA={routeA}
            routeB={routeB}
            departureSlot={departureSlot}
            onChangeDepartureSlot={setDepartureSlot}
            conditionBasis={conditionBasis}
            onChangeConditionBasis={setConditionBasis}
            vessel={vessel}
            onChangeFuelType={handleFuelTypeChange}
            estimateA={estimateA}
            estimateB={estimateB}
            onGoToRouteLab={() => setActiveTab('routes')}
          />
        )}

        {activeTab === 'trends' && (
          <TrendExplorerView
            locale={locale}
            regionId={regionId}
            onChangeRegion={handleRegionChange}
          />
        )}

        {activeTab === 'routes' && (
          <RouteLabView
            locale={locale}
            regionId={regionId}
            projectedGrid={projectedGrid}
            hotspots={hotspots}
            selectedHotspotId={selectedHotspotId}
            onSelectHotspot={setSelectedHotspotId}
            departureSlot={departureSlot}
            onChangeDepartureSlot={setDepartureSlot}
            conditionBasis={conditionBasis}
            onChangeConditionBasis={setConditionBasis}
            vessel={vessel}
            onChangeVessel={setVessel}
            onChangeFuelType={handleFuelTypeChange}
            routeA={routeA}
            routeB={routeB}
            estimateA={estimateA}
            estimateB={estimateB}
          />
        )}

        {activeTab === 'slides' && <PresentationView locale={locale} />}

        {activeTab === 'feasibility' && <FeasibilityView locale={locale} />}
      </main>

      <footer className="border-t border-slate-800/80 bg-[#070B12] py-4 px-6">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <span>FishShift — Ocean Trend &amp; Fuel-Aware Fishing Intelligence Prototype</span>
          <span>
            {locale === 'ja'
              ? '表示データ: 事前キャッシュ・シミュレーション（実航海判断には使用不可）'
              : 'Displayed data: Pre-cached simulation (Not for operational navigation)'}
          </span>
        </div>
      </footer>
    </div>
  );
}
