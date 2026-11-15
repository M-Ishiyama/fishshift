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
  buildOceanGrid,
  extractHotspots,
  filterObisOccurrences,
} from './data/oceanData';
import type {
  ConditionBasis,
  DepartureSlot,
  FuelType,
  Locale,
  MapLayer,
  ObisDatasetSnapshot,
  RealRegionDataset,
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

  const [regionDatasets, setRegionDatasets] = useState<Partial<Record<RegionId, RealRegionDataset>>>({});
  const [obisSnapshot, setObisSnapshot] = useState<ObisDatasetSnapshot | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/data/obis_occurrences.json')
      .then((res) => {
        if (!res.ok) throw new Error(`OBIS snapshot HTTP ${res.status}`);
        return res.json() as Promise<ObisDatasetSnapshot>;
      })
      .then((data) => {
        if (!cancelled) setObisSnapshot(data);
      })
      .catch((err) => {
        if (!cancelled) setDataError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (regionDatasets[regionId]) return;
    let cancelled = false;
    fetch(`/data/region_${regionId}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Region ${regionId} HTTP ${res.status}`);
        return res.json() as Promise<RealRegionDataset>;
      })
      .then((data) => {
        if (!cancelled) {
          setRegionDatasets((prev) => ({ ...prev, [regionId]: data }));
        }
      })
      .catch((err) => {
        if (!cancelled) setDataError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [regionId, regionDatasets]);

  const activeRegionData = regionDatasets[regionId] ?? null;

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

  const occurrences = useMemo(
    () =>
      obisSnapshot
        ? filterObisOccurrences(obisSnapshot.occurrences, regionId, speciesId)
        : [],
    [obisSnapshot, regionId, speciesId]
  );

  const obisSummary = obisSnapshot?.counts?.[regionId]?.[speciesId] ?? null;

  const grid = useMemo(
    () =>
      buildOceanGrid(
        regionId,
        year,
        month,
        speciesId,
        activeRegionData,
        occurrences
      ),
    [regionId, year, month, speciesId, activeRegionData, occurrences]
  );

  const hotspots = useMemo(() => extractHotspots(grid, speciesId), [grid, speciesId]);

  const activeHotspot = useMemo(
    () => hotspots.find((h) => h.id === selectedHotspotId) ?? hotspots[0],
    [hotspots, selectedHotspotId]
  );

  // Next-day (2026-11-15) route calculation is anchored to November seasonal conditions,
  // independent of which historical month the user is inspecting on the SST/Chl-a slider.
  const nextDayBaselineGrid = useMemo(
    () =>
      buildOceanGrid(
        regionId,
        2025,
        11,
        speciesId,
        activeRegionData,
        occurrences
      ),
    [regionId, speciesId, activeRegionData, occurrences]
  );

  const projectedGrid = useMemo(
    () => projectNextDayConditions(nextDayBaselineGrid, conditionBasis, departureSlot),
    [nextDayBaselineGrid, conditionBasis, departureSlot]
  );

  const { routeA, routeB } = useMemo(() => {
    if (!activeHotspot) return { routeA: [], routeB: [] };
    return buildCandidateRoutes(
      REGIONS[regionId].defaultPort,
      { lat: activeHotspot.lat, lon: activeHotspot.lon },
      regionId,
      projectedGrid,
      vessel
    );
  }, [regionId, activeHotspot, projectedGrid, vessel]);

  const estimateA = useMemo(
    () =>
      calculateRouteEstimate(
        'A',
        'Route A: 陸地回避・最短距離ライン',
        'Route A: Land-Avoiding Shortest Line',
        'Shortest land-avoiding geodesic route',
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
        'Route B: 風・波・海流配慮（燃費最適）',
        'Route B: Wind, Wave & Current Fuel-Optimal',
        'Fuel-optimal land-avoiding route accounting for wind, wave, and current',
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

      {dataError && (
        <div className="border-b border-rose-500/40 bg-rose-500/10 px-6 py-2 text-xs text-rose-200">
          {locale === 'ja' ? 'データ読込エラー: ' : 'Data load error: '}
          {dataError}
        </div>
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
            isLoadingData={!activeRegionData}
            hotspots={hotspots}
            selectedHotspotId={selectedHotspotId}
            onSelectHotspot={setSelectedHotspotId}
            occurrences={occurrences}
            obisSummary={obisSummary}
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
            regionData={activeRegionData}
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
              ? '観測データ: NASA JPL (SST) / NASA OB.DAAC (Chl-a) via NOAA CoastWatch ERDDAP · OBIS v3 | 海流・風・航路: 試算モデル（実航海判断には使用不可）'
              : 'Observations: NASA JPL (SST) / NASA OB.DAAC (Chl-a) via NOAA CoastWatch ERDDAP · OBIS v3 | Currents/Winds/Routes: Simulated (Not for navigation)'}
          </span>
        </div>
      </footer>
    </div>
  );
}
