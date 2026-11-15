import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useT } from '../i18n/I18nProvider';

export interface DemoStep {
  step: number;
  titleKey: DemoStepTitleKey;
  descriptionKey: DemoStepDescriptionKey;
}

type DemoStepTitleKey =
  | 'demo.step1.title'
  | 'demo.step2.title'
  | 'demo.step3.title'
  | 'demo.step4.title'
  | 'demo.step5.title';

type DemoStepDescriptionKey =
  | 'demo.step1.description'
  | 'demo.step2.description'
  | 'demo.step3.description'
  | 'demo.step4.description'
  | 'demo.step5.description';

export const DEMO_STEPS: DemoStep[] = [
  { step: 1, titleKey: 'demo.step1.title', descriptionKey: 'demo.step1.description' },
  { step: 2, titleKey: 'demo.step2.title', descriptionKey: 'demo.step2.description' },
  { step: 3, titleKey: 'demo.step3.title', descriptionKey: 'demo.step3.description' },
  { step: 4, titleKey: 'demo.step4.title', descriptionKey: 'demo.step4.description' },
  { step: 5, titleKey: 'demo.step5.title', descriptionKey: 'demo.step5.description' },
];

interface DemoBannerProps {
  currentStepIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}

export function DemoBanner({
  currentStepIndex,
  onPrev,
  onNext,
  onClose,
}: DemoBannerProps) {
  const t = useT();
  const current = DEMO_STEPS[currentStepIndex];
  if (!current) return null;

  return (
    <div className="border-b border-cyan-500/30 bg-[#0B172A]">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-6 py-2.5">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-mono text-xs font-semibold text-cyan-300 tabular-nums shrink-0">
            DEMO {current.step}/{DEMO_STEPS.length}
          </span>
          <div className="min-w-0 text-xs">
            <span className="font-semibold text-slate-100">{t(current.titleKey)}</span>
            <span className="mx-2 text-slate-500">·</span>
            <span className="text-slate-300">{t(current.descriptionKey)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={currentStepIndex === 0}
            onClick={onPrev}
            className="inline-flex items-center gap-1 rounded border border-slate-700 bg-[#070B12] px-2.5 py-1 text-xs text-slate-200 hover:border-slate-600 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>{t('demo.prev')}</span>
          </button>
          <button
            type="button"
            onClick={currentStepIndex < DEMO_STEPS.length - 1 ? onNext : onClose}
            className="inline-flex items-center gap-1 rounded bg-cyan-500 px-3 py-1 text-xs font-semibold text-slate-950 hover:bg-cyan-400 cursor-pointer"
          >
            <span>
              {currentStepIndex < DEMO_STEPS.length - 1 ? t('demo.next') : t('demo.finish')}
            </span>
            {currentStepIndex < DEMO_STEPS.length - 1 && <ChevronRight className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('demo.close')}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
