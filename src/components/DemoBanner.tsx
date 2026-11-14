import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export interface DemoStep {
  step: number;
  title: string;
  description: string;
}

export const DEMO_STEPS: DemoStep[] = [
  {
    step: 1,
    title: '対象海域と海面水温 (SST) の確認',
    description:
      '北海道南部・津軽海峡（40.5–43.0°N）の9月期サンプル海域を表示中。暖流の張り出しと冷水の境界（潮目）を確認します。',
  },
  {
    step: 2,
    title: 'クロロフィルa (Chl-a) 分布への切替',
    description:
      '基礎生産の指標であるChl-a濃度へ切り替え、植物プランクトンが集積しやすい前線帯と欠損画素の扱いを確認します。',
  },
  {
    step: 3,
    title: '適合指数とOBIS過去出現記録の重ね合わせ',
    description:
      '探索用適合指数マップ上にクロマグロのOBIS過去記録を重ね、環境条件と過去実績が重なる候補ポイントAを選択します。',
  },
  {
    step: 4,
    title: 'Trend Explorer による長期統計検証',
    description:
      '2016–2025年の年平均SST時系列を線形回帰し、年あたり上昇率・p値・95%信頼区間から長期変化の有意性を評価します。',
  },
  {
    step: 5,
    title: 'Route Lab での省燃料ルート比較試算',
    description:
      '選択した候補ポイントAに対し、最短ライン（Route A）と海流・波浪配慮ライン（Route B）の距離・時間・燃料コストを比較します。',
  },
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
            <span className="font-semibold text-slate-100">{current.title}</span>
            <span className="mx-2 text-slate-500">·</span>
            <span className="text-slate-300">{current.description}</span>
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
            <span>戻る</span>
          </button>
          <button
            type="button"
            onClick={currentStepIndex < DEMO_STEPS.length - 1 ? onNext : onClose}
            className="inline-flex items-center gap-1 rounded bg-cyan-500 px-3 py-1 text-xs font-semibold text-slate-950 hover:bg-cyan-400 cursor-pointer"
          >
            <span>{currentStepIndex < DEMO_STEPS.length - 1 ? '次のステップ' : 'デモ完了'}</span>
            {currentStepIndex < DEMO_STEPS.length - 1 && <ChevronRight className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="デモを閉じる"
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
