import { useMemo, useState } from 'react';
import { DemoBanner, DEMO_STEPS } from './components/DemoBanner';
import { OceanMapView } from './components/OceanMapView';
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
import { useT } from './i18n/I18nProvider';
import type { MapLayer, RegionId, SpeciesId, TabId } from './types/ocean';

export default function App() {
  const t = useT();
  const [activeTab, setActiveTab] = useState<TabId>('map');
  const [regionId, setRegionId] = useState<RegionId>('tsugaru');
  const [speciesId, setSpeciesId] = useState<SpeciesId>('thunnus_orientalis');
  const [year, setYear] = useState<number>(2025);
  const [month, setMonth] = useState<number>(9);
  const [layer, setLayer] = useState<MapLayer>('sst');
  const [showObis, setShowObis] = useState<boolean>(true);
  const [showCurrents, setShowCurrents] = useState<boolean>(true);
  const [showRoutes, setShowRoutes] = useState<boolean>(true);
  const [selectedHotspotId, setSelectedHotspotId] = useState<string>('hotspot-1');

  const [demoActive, setDemoActive] = useState<boolean>(false);
  const [demoStepIndex, setDemoStepIndex] = useState<number>(0);

  const grid = useMemo(
    () => buildOceanGrid(regionId, year, month, speciesId),
    [regionId, year, month, speciesId]
  );

  const hotspots = useMemo(() => extractHotspots(grid, speciesId), [grid, speciesId]);

  const occurrences = useMemo(
    () => buildObisOccurrences(regionId, speciesId),
    [regionId, speciesId]
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
      setShowRoutes(false);
      setActiveTab('map');
    } else if (stepIdx === 1) {
      setRegionId('tsugaru');
      setYear(2025);
      setMonth(5);
      setLayer('chlor_a');
      setShowObis(false);
      setShowCurrents(true);
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
      />

      {demoActive && (
        <DemoBanner
          currentStepIndex={demoStepIndex}
          onPrev={() => applyDemoStep(Math.max(0, demoStepIndex - 1))}
          onNext={() => applyDemoStep(Math.min(DEMO_STEPS.length - 1, demoStepIndex + 1))}
          onClose={() => setDemoActive(false)}
        />
      )}

      <main className="flex-1">
        {activeTab === 'map' && (
          <OceanMapView
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
            showRoutes={showRoutes}
            onToggleRoutes={() => setShowRoutes((v) => !v)}
            grid={grid}
            hotspots={hotspots}
            selectedHotspotId={selectedHotspotId}
            onSelectHotspot={setSelectedHotspotId}
            occurrences={occurrences}
            routeA={routeA}
            routeB={routeB}
            onGoToRouteLab={() => setActiveTab('routes')}
          />
        )}

        {activeTab === 'trends' && (
          <TrendExplorerView regionId={regionId} onChangeRegion={handleRegionChange} />
        )}

        {activeTab === 'routes' && (
          <RouteLabView
            regionId={regionId}
            grid={grid}
            hotspots={hotspots}
            selectedHotspotId={selectedHotspotId}
            onSelectHotspot={setSelectedHotspotId}
          />
        )}

      </main>

      <footer className="border-t border-slate-800/80 bg-[#070B12] py-4 px-6">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <span>FishShift — Ocean Trend &amp; Fuel-Aware Fishing Intelligence Prototype</span>
          <span>{t('app.footer.attribution')}</span>
        </div>
      </footer>
    </div>
  );
}
