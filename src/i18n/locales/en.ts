import type { Dict } from '../dictionary';

/**
 * English dictionary.
 *
 * Declared with a type annotation rather than `satisfies` so that missing and
 * extra keys are both compile errors, and so interpolation params are
 * contextually typed from `ja` instead of being restated here.
 */
export const en: Dict = {
  'app.documentTitle': 'FishShift — Ocean Trend & Fuel-Aware Fishing Intelligence',
  'app.metaDescription':
    'A marine decision-support prototype combining satellite ocean observations (SST / Chl-a), OBIS occurrence records and sea-state forecasts to visualise long-term ocean trends and fuel-aware route comparisons.',
  'app.footer.attribution':
    'SST & Chl-a: NASA Earth observations (JPL MUR L4 / OB.DAAC MODIS-Aqua) · Fish occurrences: OBIS measured records / Currents, waves, wind: estimated values (not for real navigation decisions)',

  'format.year': (p) => p.year,
  'format.yearMonth': (p) => `${p.month} ${p.year}`,
  'format.yearRange': (p) => `${p.from} – ${p.to} (${p.span} yrs)`,

  'region.tsugaru.shortName': 'S. Hokkaido',
  'region.tsugaru.port': 'Hakodate offshore (virtual port)',
  'region.tsugaru.description':
    'Study area where the Tsugaru Warm Current, derived from the Tsushima Current, meets cold Oyashio water (design-document sample BBox: 40.5–43.0°N, 139.5–143.0°E).',
  'region.sanriku.shortName': 'Off Sanriku',
  'region.sanriku.port': 'Kesennuma offshore (virtual port)',
  'region.sanriku.description':
    'Comparison area where a warm-core eddy of the Kuroshio Extension collides with the cold Oyashio, forming a sharp front and a belt of phytoplankton growth.',

  'species.thunnus_orientalis.forageNote':
    'Past migration records cluster along thermal fronts, where forage such as sardine and Japanese flying squid concentrates.',
  'species.oncorhynchus_keta.forageNote':
    'Tends to occur in cold Oyashio water and in mixed water with high primary production. A test case for a northward range shift under warming.',
  'species.sardinops_melanostictus.forageNote':
    'A small pelagic fish that uses phytoplankton (high Chl-a zones) directly and indirectly. A candidate indicator of where forage concentrates for larger fish.',

  'hotspot.descriptor.primaryFront': 'Strongest front',
  'hotspot.descriptor.planktonFront': 'Plankton front',
  'hotspot.descriptor.offshoreReference': 'Offshore reference',
  'hotspot.descriptor.generic': 'Additional candidate',
  'hotspot.fullLabel': (p) => `Candidate ${p.letter} (${p.descriptor})`,
  'hotspot.rationale': (p) =>
    `Boundary zone where the observed ${p.sst} °C and Chl-a of ${p.chl} mg/m³ overlap the ${p.lo}–${p.hi} °C reference range for ${p.species}.`,
  'hotspot.indexShort': 'Index',

  'route.a.label': 'Route A: shortest-distance line',
  'route.b.label': 'Route B: current- and wave-aware line',
  'route.caution.calm': 'Modelled under relatively calm sea-state conditions.',
  'route.caution.roughSeas': (p) =>
    `Includes segments at up to ${p.maxWave} m wave height and ${p.avgWind} m/s mean wind. Watch wave drag and safety margin.`,
  'route.caution.favorableCurrent': (p) =>
    `Track that exploits a following current (mean ${p.assist} kt).`,
  'route.caution.adverseCurrent': (p) =>
    `Adverse-current segments (mean ${p.assist} kt) reduce speed over ground.`,

  'source.withDistribution': (p) => `${p.lead} (distributed via ${p.distribution})`,

  'map.heading': 'Ocean Conditions & Forage Hotspot Explorer',
  'map.subtitle.data':
    'SST & Chl-a: NASA Earth observations (satellite measurements, prefetched) / Currents, waves, wind: estimated',
  'map.subtitle.region': (p) => `Area: ${p.region}`,
  'map.subtitle.obisCaveat':
    'OBIS points are historical occurrence reports, not present-day fish locations',
  'map.cta.routeLab': 'Estimate fuel-aware route to selection',
  'map.control.region': 'Target area (preset)',
  'map.control.species': 'Target species (OBIS scientific name)',
  'map.control.baseLayer': 'Satellite / analysis base layer',
  'map.control.overlays': 'Overlays',
  'map.control.timeSlider': 'Observation month',
  'map.slider.year': 'Year',
  'map.slider.month': 'Month',
  'map.layer.sst': 'SST',
  'map.layer.habitat': 'Habitat',
  'map.overlay.obis': (p) => `OBIS occurrence records (${p.count})`,
  'map.overlay.obisEmpty':
    'No OBIS records exist for this area and species. Nothing is interpolated to add points.',
  'map.overlay.currents': 'Current vectors (speed / direction)',
  'map.overlay.routes': 'Candidate route lines (A/B)',
  'map.disclaimer':
    'Gaps (cloud and similar) are drawn as transparent hatching, never interpolated to zero. The habitat index is an unvalidated exploratory model value.',
  'map.legend.sst.title': 'Sea surface temperature, SST (°C)',
  'map.legend.chlorA.title': 'Chlorophyll-a concentration (mg/m³)',
  'map.legend.habitat.title': 'Exploratory habitat index (0–100)',
  'map.legend.observed': (p) => `Observed: ${p.source}`,
  'map.legend.habitatSource':
    'Exploratory composite index (0.40×temp + 0.35×Chl-a + 0.25×habitat fit) — derived from observed SST/Chl-a',
  'map.legend.missing': '□ Gap (cloud)',
  'map.probe.missingCloud': 'gap (cloud)',
  'map.probe.missing': 'gap',
  'map.probe.current': 'Current',
  'map.probe.wave': 'Wave height',
  'map.probe.hint': 'Move the cursor over the map to read values',
  'map.key.obis': 'OBIS records',
  'map.key.routeA': 'Route A (shortest)',
  'map.key.routeB': 'Route B (sea-state aware)',

  'route.safety.label': 'Experimental estimation — not for navigation:',
  'route.safety.body':
    'This screen compares model estimates for two predefined offshore sample lines. It cannot be used for real navigation, which must account for land, shoals, navigation marks and regulations.',
  'route.modelNote': '1 knot = 1.852 km/h · estimation model',
  'route.provenance.label': 'Inputs on this screen:',
  'route.provenance.lead': 'Currents, wave height and wind (',
  'route.provenance.emphasis': 'parametric estimates, not NASA-derived',
  'route.provenance.mid': ') are ',
  'route.provenance.tail':
    '. They are computed from offshore distance and season, standing in for an equivalent monthly NASA product that does not exist at this resolution. Duration, fuel use and fuel cost all depend on those estimates, so read them',
  'route.provenance.relative': 'as a relative comparison between the two routes, never as absolute values',
  'route.provenance.close':
    '. The target coordinates themselves come from candidate points extracted from observed NASA SST/Chl-a.',
  'route.panel.conditions': 'Assumptions & vessel parameters',
  'route.panel.port': 'Virtual departure point',
  'route.panel.target': 'Target candidate point',
  'route.vessel.speed': 'Reference speed',
  'route.vessel.fuelRate': 'Base fuel consumption rate',
  'route.vessel.fuelPrice': 'Fuel price (assumes marine diesel)',
  'route.vessel.waveDrag': 'Assumed wave-drag sensitivity (α)',
  'route.mvpNote':
    'As an MVP, this compares two predefined sample routes under identical sea state and assumed coefficients, rather than running a global A* optimisation.',
  'route.delta.fuel': 'Estimated fuel difference (Route B − Route A)',
  'route.delta.fuelBetter': 'Under these assumptions Route B burns less',
  'route.delta.fuelWorse': 'The detour makes Route B equal or worse',
  'route.delta.cost': 'Estimated fuel cost difference',
  'route.delta.costBasis': (p) => `At ${p.price} JPY/L (one-way estimate)`,
  'route.delta.time': 'Duration difference',
  'route.delta.timeNote': 'Reflects both following current and wave slowdown',
  'route.preview.title': 'Route sample comparison preview',
  'route.preview.legend': 'Wave-height background + current vectors',
  'route.preview.port': 'Departure',
  'route.preview.target': 'Target area',
  'route.table.title': 'Per-route simulation comparison',
  'route.table.metric': 'Metric',
  'route.table.routeA': 'Route A (shortest)',
  'route.table.routeB': 'Route B (aware)',
  'route.table.distance': 'Distance',
  'route.table.duration': 'Estimated duration',
  'route.table.fuel': 'Estimated fuel use',
  'route.table.cost': 'Estimated fuel cost',
  'route.table.wave': 'Mean / max wave height',
  'route.table.assist': 'Mean current assist',
  'route.finding.a': 'Route A finding:',
  'route.finding.b': 'Route B finding:',
  'route.footnote':
    'Note: wave height and current assist above, and the duration, fuel and cost that depend on them, are estimates (not NASA-derived).',
  'unit.jpy': 'JPY',
  'unit.jpyPerLiter': 'JPY/L',
  'unit.jpyPrefixed': (p) => `JPY ${p.amount}`,

  'trend.heading': 'Ocean Trend Statistics (Trend Explorer)',
  'trend.subtitle.challenge': 'Challenge: NASA Earth System Trend Detective',
  'trend.subtitle.region': (p) => `Area: ${p.region}`,
  'trend.subtitle.method': (p) => `Method: ${p.method}`,
  'trend.subtitle.source': (p) => `Source: ${p.source}`,
  'trend.method.annual': 'OLS annual linear regression (valid months ≥ 9/12)',
  'trend.method.monthly': 'OLS monthly linear regression (includes seasonality)',
  'trend.explain.toggle': 'What is statistical significance?',
  'trend.explain.title': 'How to read the p-value and 95% confidence interval',
  'trend.explain.body':
    'A p-value < 0.05 (SIGNIFICANT) means the observed change would be unlikely if the true slope over this period were zero. It does not by itself establish ecological importance, nor that the trend will continue. Monthly data also tends to produce small p-values because of the seasonal cycle and temporal autocorrelation, so this screen recommends the annual mean (at least 9 valid months) as the standard trend test.',
  'trend.control.variable': 'Variable (NASA observations)',
  'trend.control.region': 'Target area',
  'trend.control.aggregation': 'Time aggregation',
  'trend.control.startYear': 'Start year (through 2025)',
  'trend.variable.sst': 'SST',
  'trend.variable.chlorA': 'Chlorophyll-a',
  'trend.mode.annual': 'Annual mean (recommended)',
  'trend.mode.monthly': 'Monthly series',
  'trend.kpi.slope': 'Linear slope per year',
  'trend.kpi.slopeUnit': (p) => `${p.unit}/yr`,
  'trend.kpi.significance': 'Statistical significance (p-value)',
  'trend.kpi.mean': 'Period mean',
  'trend.kpi.rSquared': (p) => `R²: ${p.value}`,
  'trend.kpi.coverage': 'Valid observations / satellite coverage',
  'trend.kpi.coverageDetail': (p) => `Mean valid-pixel coverage: ${p.percent}`,
  'trend.status.significant': 'Statistically significant trend (p < 0.05)',
  'trend.status.notSignificant': 'Not significant (p ≥ 0.05)',
  'trend.status.insufficient': 'Insufficient data to decide',
  'trend.chart.title': (p) => `${p.region} — ${p.variable} time series`,
  'trend.chart.series': 'Aggregated series',
  'trend.chart.trendLine': 'Linear trend',
  'trend.chart.ciBand': '95% confidence band',
  'trend.tooltip.time': (p) => `Time: ${p.label}`,
  'trend.tooltip.coverage': (p) => `Pixel coverage: ${p.percent}`,
  'trend.variableLong.sst': 'sea surface temperature (SST)',
  'trend.variableLong.chlorA': 'chlorophyll-a concentration (Chl-a)',
  'trend.variableShort.sst': 'sea surface temperature',
  'trend.variableShort.chlorA': 'chlorophyll-a concentration',
  'trend.summary.title': 'Summary & interpretation',
  'trend.summary.body': (p) =>
    `In ${p.region}, ${p.variable} over ${p.range} shows a linear trend of ${p.slope} (n = ${p.n}, p = ${p.pValue}).`,
  'trend.summary.slope': (p) => `${p.value} ${p.unit}/yr`,
  'trend.summary.slopeUnavailable': 'no estimate available',
  'trend.interpretation.significant':
    'With p < 0.05, the change over the observation period is judged statistically significant. That motivates examining how migration routes and forage distribution may be reorganising as water temperature shifts.',
  'trend.interpretation.notSignificant':
    'With p ≥ 0.05, no statistically significant monotonic change was detected — which is not proof that nothing is changing.',
  'trend.limitations.title': 'Scientific limitations & caveats',
  'trend.limitation.1':
    'Statistical significance is not the same thing as catch volume or the magnitude of ecological change.',
  'trend.limitation.2':
    'The p < 0.05 threshold is illustrative. With few samples, or with strong autocorrelation in a monthly series, it can overstate significance (design document §7.1).',
  'trend.limitation.3':
    'Winter cloud cover reduces the number of valid pixels. The coverage shown for each month is a measured value and is never interpolated.',
  'trend.limitation.4':
    'Chl-a is strongly skewed, so the area value uses the median — which is interpreted differently from a mean.',
  'trend.limitation.5':
    'Chl-a indicates phytoplankton. It is not a direct measurement of the zooplankton or small fish that larger fish feed on.',
  'trend.limitation.6':
    'Chl-a comes from MODIS-Aqua (launched 2002). Long-term drift in sensor characteristics is a caveat when interpreting long-term trends.',

  'demo.prev': 'Back',
  'demo.next': 'Next step',
  'demo.finish': 'Finish demo',
  'demo.close': 'Close demo',
  'demo.step1.title': 'Check the target area and sea surface temperature (SST)',
  'demo.step1.description':
    'Showing the September sample area off southern Hokkaido and the Tsugaru Strait (40.5–43.0°N). Look for the boundary between the warm current and cold water.',
  'demo.step2.title': 'Switch to chlorophyll-a (Chl-a)',
  'demo.step2.description':
    'Switch to Chl-a concentration, an indicator of primary production, and see where phytoplankton accumulates along fronts — and how gaps are handled.',
  'demo.step3.title': 'Overlay the habitat index with historical OBIS occurrences',
  'demo.step3.description':
    'Overlay historical OBIS records for Pacific bluefin tuna on the habitat index map, then select candidate point A where conditions and past records coincide.',
  'demo.step4.title': 'Verify the long-term trend statistically',
  'demo.step4.description':
    'Fit a linear regression to the 2016–2025 annual mean SST series and judge the significance of the change from the per-year slope, p-value and 95% confidence interval.',
  'demo.step5.title': 'Compare fuel-aware routes in Route Lab',
  'demo.step5.description':
    'For candidate point A, compare distance, duration and fuel cost between the shortest line (Route A) and the current- and wave-aware line (Route B).',

  'app.translationPending': 'This section is currently available in Japanese only',

  'switcher.ariaLabel': 'Change display language',

  'demo.start': 'Play demo',
  'demo.stop': 'Stop demo',
};
