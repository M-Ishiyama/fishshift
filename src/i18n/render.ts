import { useCallback } from 'react';
import { SPECIES_LIST, nasaSourceRef } from '../data/oceanData';
import type {
  CautionNote,
  HotspotCandidate,
  HotspotRationale,
  Provenance,
  Region,
} from '../types/ocean';
import { useFormat } from './format';
import { useI18n, useT } from './I18nProvider';

/**
 * Localized text for records that carry descriptors rather than sentences.
 *
 * The data and math layers emit `{ kind, numbers }`; these hooks are the single
 * place where a locale turns them into prose, so wording and number formatting
 * stay consistent across the views that show the same value.
 */

/** Regions and species keep a nameJa/nameEn pair on the record itself. */
export function useName(): (entity: { nameJa: string; nameEn: string }) => string {
  const { locale } = useI18n();
  return useCallback(
    (entity) => (locale === 'ja' ? entity.nameJa : entity.nameEn),
    [locale]
  );
}

export function useRegionText() {
  const t = useT();
  const name = useName();
  return {
    name,
    shortName: useCallback((region: Region) => t(region.shortNameKey), [t]),
    portName: useCallback((region: Region) => t(region.defaultPort.nameKey), [t]),
    description: useCallback((region: Region) => t(region.descriptionKey), [t]),
  };
}

export function useHotspotText() {
  const t = useT();
  const name = useName();
  const fmt = useFormat();

  return {
    /** Just the descriptor, e.g. "Primary thermal front". */
    descriptor: useCallback((spot: HotspotCandidate) => t(spot.descriptorKey), [t]),
    /** Compact card heading, e.g. "A. Primary thermal front". */
    shortLabel: useCallback(
      (spot: HotspotCandidate) => `${spot.letter}. ${t(spot.descriptorKey)}`,
      [t]
    ),
    /** Full form for dropdowns, e.g. "Candidate A (Primary thermal front)". */
    fullLabel: useCallback(
      (spot: HotspotCandidate) =>
        t('hotspot.fullLabel', { letter: spot.letter, descriptor: t(spot.descriptorKey) }),
      [t]
    ),
    rationale: useCallback(
      (r: HotspotRationale) =>
        t('hotspot.rationale', {
          species: name(SPECIES_LIST[r.speciesId]),
          lo: fmt.number(r.optimalSstLow, 1),
          hi: fmt.number(r.optimalSstHigh, 1),
          sst: fmt.number(r.sst, 1),
          chl: fmt.number(r.chlorA, 2),
        }),
      [t, name, fmt]
    ),
  };
}

export function useCautionText(): (note: CautionNote) => string {
  const t = useT();
  const fmt = useFormat();

  return useCallback(
    (note) => {
      switch (note.kind) {
        case 'roughSeas':
          return t('route.caution.roughSeas', {
            maxWave: fmt.number(note.maxWaveM, 1),
            avgWind: fmt.number(note.avgWindMs, 1),
          });
        case 'favorableCurrent':
          return t('route.caution.favorableCurrent', {
            assist: fmt.signed(note.avgAssistKnots, 2),
          });
        case 'adverseCurrent':
          return t('route.caution.adverseCurrent', {
            assist: fmt.signed(note.avgAssistKnots, 2),
          });
        default:
          return t('route.caution.calm');
      }
    },
    [t, fmt]
  );
}

export function useNasaSource(): (p: Provenance, opts?: { withDataset?: boolean }) => string {
  const t = useT();
  return useCallback(
    (p, opts) => {
      const ref = nasaSourceRef(p, opts);
      const lead = ref.datasetId ? `${ref.lead} / ${ref.datasetId}` : ref.lead;
      return ref.distribution
        ? t('source.withDistribution', { lead, distribution: ref.distribution })
        : lead;
    },
    [t]
  );
}
