import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Locale } from '../types/ocean';

interface Slide {
  number: number;
  titleEn: string;
  subtitleJa: string;
  subtitleEn: string;
  bullets: { labelJa: string; labelEn: string; detailJa: string; detailEn: string }[];
  takeawayJa: string;
  takeawayEn: string;
}

const SLIDES: Slide[] = [
  {
    number: 1,
    titleEn: 'FishShift — Find Fish. Save Fuel. Understand Our Oceans.',
    subtitleJa: '衛星海洋観測・魚種出現履歴・海況予報を統合した説明可能な漁場探索＆省燃料航路比較',
    subtitleEn:
      'Explainable Fishing Ground Exploration & Fuel-Aware Route Comparison Integrating Satellite Ocean Data, OBIS History, and Marine Forecasts',
    bullets: [
      {
        labelJa: '課題領域',
        labelEn: 'Problem Space',
        detailJa:
          '経験頼みの漁場探索と燃料費高騰に対し、NASA地球観測データと海況モデルを同一画面で意思決定支援へ統合。',
        detailEn:
          'Bridges intuition-based searching and rising fuel costs by unifying NASA Earth observation data and ocean state models in one decision console.',
      },
      {
        labelJa: '設計原則',
        labelEn: 'Design Principles',
        detailJa:
          '実データの来歴（Provenance）を厳格に管理し、未検証モデル値や試算条件を誤認させない透明なUI。',
        detailEn:
          'Maintains strict data provenance and transparent UI framing so exploratory models and assumptions are never mistaken for guaranteed forecasts.',
      },
      {
        labelJa: '提供価値',
        labelEn: 'Core Value',
        detailJa:
          '海洋変化トレンドの統計的検証、探索用環境適合マップ、2航路の燃料試算比較をワンストップで提供。',
        detailEn:
          'Delivers statistical ocean trend validation, exploratory suitability mapping, and two-route fuel comparison in one coherent workbench.',
      },
    ],
    takeawayJa: 'NASA Space Apps Challenge 2026 — Be An Earth System Trend Detective! 対応構成（計7枚）',
    takeawayEn: 'NASA Space Apps Challenge 2026 — Be An Earth System Trend Detective! (7-Slide Deck)',
  },
  {
    number: 2,
    titleEn: 'The Problem — Uncertainty & Fuel Burden at Sea',
    subtitleJa: 'なぜ漁業現場で衛星データと最適航路の統合が難しいのか',
    subtitleEn: 'Why unifying satellite oceanography and fuel-efficient routing remains difficult at sea',
    bullets: [
      {
        labelJa: '漁場環境の急速な変化',
        labelEn: 'Rapidly Shifting Marine Habitats',
        detailJa:
          '海水温の上昇や暖水塊・黒潮蛇行により、従来の経験則だけでは対象魚や餌生物の集積域を捉えにくくなっている。',
        detailEn:
          'Ocean warming, warm-core eddies, and shifting currents make historical intuition alone unreliable for locating forage fronts.',
      },
      {
        labelJa: '探索航行に伴う燃料コスト',
        labelEn: 'High Search Fuel Burden',
        detailJa:
          '広大な海域で漁場を探し回る探索時間・逆潮や高波浪中の航行は、燃料消費とCO2排出を押し上げる。',
        detailEn:
          'Long search transits and steaming against adverse currents, headwinds, and rough seas drive up fuel cost and emissions.',
      },
      {
        labelJa: 'データの分断',
        labelEn: 'Fragmented Data Silos',
        detailJa:
          '衛星SST/Chl-a、生物出現DB（OBIS）、気象海流予報が別々のフォーマットとツールに分断されている。',
        detailEn:
          'Satellite SST/Chl-a, biological occurrence records (OBIS), and marine/wind forecasts remain scattered across incompatible tools.',
      },
    ],
    takeawayJa: '科学的データを「現場が直感的に比較・判断できるワークベンチ」へ翻訳する必要がある。',
    takeawayEn: 'Scientific datasets must be translated into an intuitive comparative workbench.',
  },
  {
    number: 3,
    titleEn: 'Our Solution — 4-Step Explainable Workflow',
    subtitleJa: '4ステップで完結する現場向け意思決定プロトタイプ',
    subtitleEn: 'A 4-step explainable decision-support workflow for fisheries',
    bullets: [
      {
        labelJa: '01. 対象海域・魚種の選択',
        labelEn: '01. Select Region & Target Species',
        detailJa:
          '北海道南部（津軽海峡）・三陸沖・米国メキシコ湾岸などの比較海域と、クロマグロ・キハダマグロ等の対象魚種を指定。',
        detailEn:
          'Choose study regions (Tsugaru Strait, Sanriku, US Gulf Coast / Houston) and OBIS-standardized target species.',
      },
      {
        labelJa: '02. 海洋環境レイヤーの重ね合わせ',
        labelEn: '02. Overlay Environmental & Vector Layers',
        detailJa:
          '海面水温（SST）とクロロフィルa（Chl-a）の潮目・境界に、海流・海上風ベクトルとOBIS過去出現記録を重ねて可視化。',
        detailEn:
          'Overlay ocean currents, surface winds, and historical OBIS records onto SST and Chl-a thermal fronts.',
      },
      {
        labelJa: '03. 長期トレンドと統計的有意性の確認',
        labelEn: '03. Verify Long-Term Statistical Trends',
        detailJa:
          '対象海域が長期的に温暖化・基礎生産シフトしているかを、傾き・p値・95%信頼区間で検証。',
        detailEn:
          'Quantify multi-year SST and Chl-a shifts using OLS slope, p-value, and 95% confidence intervals.',
      },
      {
        labelJa: '04. 2航路の省燃料比較試算',
        labelEn: '04. Compare Fuel-Aware Routes',
        detailJa:
          '最短距離ラインと海流・風向・波浪配慮ラインの燃料消費量・コスト差を、仮定条件を明示した上で比較。',
        detailEn:
          'Compare Direct vs. Current/Wind-aware sample routes with transparent vessel drag and fuel-cost assumptions.',
      },
    ],
    takeawayJa: 'ブラックボックスな「AI予測」ではなく、根拠が見える「説明可能な探索支援」を採用。',
    takeawayEn: 'Adopts transparent, evidence-backed exploration rather than opaque black-box claims.',
  },
  {
    number: 4,
    titleEn: 'Powered by NASA Data & Open Marine APIs',
    subtitleJa: 'データソースの役割分担とバッチ／キャッシュ分離アーキテクチャ',
    subtitleEn: 'Role separation across NASA Earthdata, OBIS, and Open-Meteo via offline batch + fast cache',
    bullets: [
      {
        labelJa: 'NASA OB.DAAC / Earthdata (SST & Chl-a)',
        labelEn: 'NASA OB.DAAC / Earthdata (SST & Chl-a)',
        detailJa:
          '開発バッチ側で海域切り出し・QC（雲欠損除外）・月次集約を実施し、公開アプリでは高速キャッシュを表示。',
        detailEn:
          'Batch preprocessing handles spatial subsetting, cloud-gap QC, and monthly aggregation so the public app serves fast cached snapshots.',
      },
      {
        labelJa: 'NASA PO.DAAC (CCMP / ASCAT / CYGNSS 海上風)',
        labelEn: 'NASA PO.DAAC Winds (CCMP / ASCAT / CYGNSS)',
        detailJa:
          'CCMP 0.25° 6時間毎ギャップフリー風ベクトルを主軸に、沿岸ASCATおよび中低緯度CYGNSSを補完利用。',
        detailEn:
          'Uses CCMP 0.25° 6-hourly gap-free u10/v10 vectors as baseline, complemented by coastal ASCAT and low-latitude CYGNSS.',
      },
      {
        labelJa: 'OBIS API v3 (生物出現実績)',
        labelEn: 'OBIS API v3 (Species Occurrences)',
        detailJa:
          '学名解決した過去の報告記録をGeoJSON化。サンプリング偏りを注記し「現在の魚群位置」とは明確に区別。',
        detailEn:
          'GeoJSON historical records keyed by scientific name, explicitly labeled as past observations rather than live schools.',
      },
      {
        labelJa: 'Open-Meteo Marine & Weather API',
        labelEn: 'Open-Meteo Marine & Weather API',
        detailJa:
          '翌日出航試算向けに波高・海流・風速・風向の予報値を取得し、単位変換と予報取得時刻の明示を徹底。',
        detailEn:
          'Provides short-range wave, current, and wind forecasts for next-day transit estimation with explicit unit conversions.',
      },
    ],
    takeawayJa: '公開閲覧者にEarthdata認証や外部API遅延を一切強いない堅牢なスナップショット設計。',
    takeawayEn: 'Resilient snapshot architecture requiring zero Earthdata login or live API latency for end users.',
  },
  {
    number: 5,
    titleEn: 'Discovering Ocean Trends — Statistical Rigor',
    subtitleJa: 'Trend Explorer による複数年変化率・有意性・限界の提示',
    subtitleEn: 'Presenting multi-year rates of change, p-values, and scientific caveats in Trend Explorer',
    bullets: [
      {
        labelJa: '年次集約による季節バイアス抑制',
        labelEn: 'Annual Aggregation Reduces Seasonal Bias',
        detailJa:
          '有効月（例: 9/12か月以上）を満たす年平均値に対して線形回帰を行い、自己相関・季節周期の影響を抑制。',
        detailEn:
          'Applies OLS regression on annual means requiring ≥ 9/12 valid months to limit seasonal cycles and autocorrelation.',
      },
      {
        labelJa: '傾き・p値・95%信頼区間・被覆率',
        labelEn: 'Slope, p-Value, 95% CI & Coverage',
        detailJa:
          'SIGNIFICANT / NOT SIGNIFICANT / INSUFFICIENT DATA の3値で判定し、「有意差なし＝変化なし」と断定しない。',
        detailEn:
          'Classifies trends into SIGNIFICANT, NOT SIGNIFICANT, or INSUFFICIENT DATA without conflating non-significance with no change.',
      },
      {
        labelJa: '欠損画素の誠実な可視化',
        labelEn: 'Honest Cloud-Gap Handling',
        detailJa:
          '衛星の雲域欠損を0値として補間せず、有効画素被覆率（coverage_ratio）を併記して推定の信頼性を担保。',
        detailEn:
          'Preserves missing satellite cloud pixels as null rather than zero-filling, reporting valid pixel coverage alongside trends.',
      },
    ],
    takeawayJa: 'NASA公式課題の要である「定量的なトレンド検証と科学的誠実さ」を中核に配置。',
    takeawayEn: 'Places quantitative trend verification and scientific honesty at the core of the challenge.',
  },
  {
    number: 6,
    titleEn: 'Fish Habitats & Route Comparison',
    subtitleJa: '探索用環境適合指数と海況配慮ルートの試算モデル',
    subtitleEn: 'Exploratory habitat suitability scoring and sea-state-aware fuel estimation',
    bullets: [
      {
        labelJa: '探索用環境適合指数 (Exploratory Habitat Index)',
        labelEn: 'Exploratory Habitat Index',
        detailJa:
          '水温適性(0.40) + Chl-a文脈(0.35) + 過去出現文脈(0.25)の透明な合成スコア。未検証係数であることをUI明記。',
        detailEn:
          'Transparent weighted score (0.40 SST + 0.35 Chl-a + 0.25 OBIS) explicitly marked as an unvalidated exploratory heuristic.',
      },
      {
        labelJa: '2航路の同一条件シミュレーション',
        labelEn: 'Controlled Two-Route Simulation',
        detailJa:
          '距離優先(Route A)と海況配慮(Route B)について、Haversine距離・海流/風向ベクトル・仮定波浪抵抗から燃料を試算。',
        detailEn:
          'Compares Route A vs. Route B using Haversine distance, ocean current + aerodynamic wind vectors, and wave drag factors.',
      },
      {
        labelJa: '安全性・誇張表現の排除',
        labelEn: 'Strict Safety & Anti-Hype Guardrails',
        detailJa:
          '削減差が0%や増加する場合もそのまま出力し、航行安全保証や「確実に釣れる」等の誇張表現を完全禁止。',
        detailEn:
          'Reports zero or negative fuel savings honestly and enforces mandatory non-navigational safety disclaimers.',
      },
    ],
    takeawayJa: '「比較と感度の把握」に徹することで、誤判断を防ぎつつ実用検証への橋渡しを実現。',
    takeawayEn: 'Focuses on comparative sensitivity to prevent misinterpretation while bridging to field trials.',
  },
  {
    number: 7,
    titleEn: "Impact & What's Next — Bridging to Real Fisheries",
    subtitleJa: '実漁業の課題解決に向けた段階的ロードマップ',
    subtitleEn: 'Phased roadmap toward operational fisheries validation and routing',
    bullets: [
      {
        labelJa: '短期的ギャップの解消（実データ接続）',
        labelEn: 'Near-Term: Ground-Truth Calibration',
        detailJa:
          '衛星Chl-aと魚類の「餌（動物プランクトン・小型浮魚）」の時間・空間ラグを補うため、漁業者のCPUE／操業日誌と突合。',
        detailEn:
          'Validate the trophic time-lag between satellite Chl-a blooms and prey/fish aggregation against vessel logbooks and CPUE.',
      },
      {
        labelJa: '中期的高度化（A*動的航路最適化）',
        labelEn: 'Mid-Term: Dynamic A* Maritime Routing',
        detailJa:
          'MVPの2航路比較から、陸地・浅瀬・定置網ポリゴンと船舶固有の燃費曲線を組み込んだ動的グラフ探索へ拡張。',
        detailEn:
          'Upgrade from two fixed sample paths to dynamic A* graph search over coastline, bathymetry, and vessel-specific fuel curves.',
      },
      {
        labelJa: '社会的インパクト',
        labelEn: 'Real-World Impact',
        detailJa:
          '探索時間の短縮による燃料コスト削減と、海洋環境シフトに順応した持続可能な資源利用の両立を目指す。',
        detailEn:
          'Reduces wasted search fuel and emissions while helping coastal fleets adapt sustainably to shifting ocean ecosystems.',
      },
    ],
    takeawayJa: 'ハッカソンMVPの堅実な基盤から、現場の実漁獲データ検証・実船燃費モデル校正へと段階的に発展。',
    takeawayEn: 'Progresses systematically from a grounded hackathon MVP to empirical catch validation and hull calibration.',
  },
];

interface PresentationViewProps {
  locale: Locale;
}

export function PresentationView({ locale }: PresentationViewProps) {
  const isJa = locale === 'ja';
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(SLIDES.length - 1, i + 1));
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="mx-auto max-w-[1160px] px-6 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div>
          <h1 className="font-display text-xl font-semibold text-slate-50">
            Presentation Deck (7 Slides)
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">
            <span>
              {isJa
                ? '提出要件準拠: タイトル含め最大7枚'
                : 'Submission-aligned deck: 7 slides max including title'}
            </span>
            <span className="mx-2 text-slate-600">·</span>
            <span>
              {isJa
                ? 'キーボード ← / → でページ送り可能'
                : 'Use keyboard ← / → arrows to navigate'}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            className="inline-flex items-center gap-1 rounded border border-slate-700 bg-[#0D1524] px-3 py-1.5 text-xs text-slate-200 hover:border-slate-600 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>{isJa ? '前へ' : 'Prev'}</span>
          </button>
          <span className="px-2 font-mono text-xs text-slate-300 tabular-nums">
            {slide.number} / {SLIDES.length}
          </span>
          <button
            type="button"
            disabled={index === SLIDES.length - 1}
            onClick={() => setIndex((i) => Math.min(SLIDES.length - 1, i + 1))}
            className="inline-flex items-center gap-1 rounded border border-slate-700 bg-[#0D1524] px-3 py-1.5 text-xs text-slate-200 hover:border-slate-600 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            <span>{isJa ? '次へ' : 'Next'}</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Slide Stage */}
      <div className="rounded-lg border border-slate-800 bg-[#0D1524] p-8 md:p-10 min-h-[430px] flex flex-col justify-between">
        <div>
          <div className="font-mono text-xs text-cyan-400 tabular-nums">
            SLIDE {String(slide.number).padStart(2, '0')} OF 07
          </div>
          <h2 className="mt-2 font-display text-2xl font-bold text-slate-50 md:text-3xl text-balance">
            {slide.titleEn}
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            {isJa ? slide.subtitleJa : slide.subtitleEn}
          </p>

          <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-2">
            {slide.bullets.map((b) => (
              <div
                key={b.labelEn}
                className="rounded-md border border-slate-800 bg-[#070B12]/80 p-4"
              >
                <div className="text-xs font-semibold text-cyan-300">
                  {isJa ? b.labelJa : b.labelEn}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                  {isJa ? b.detailJa : b.detailEn}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 border-t border-slate-800 pt-4 text-xs text-slate-400">
          <span className="font-semibold text-slate-200">Key Takeaway: </span>
          {isJa ? slide.takeawayJa : slide.takeawayEn}
        </div>
      </div>

      {/* Slide Selector Strip */}
      <div className="mt-4 grid grid-cols-7 gap-2">
        {SLIDES.map((s, idx) => (
          <button
            key={s.number}
            type="button"
            onClick={() => setIndex(idx)}
            className={`rounded border px-2 py-2 text-left transition-colors cursor-pointer ${
              idx === index
                ? 'border-cyan-500 bg-cyan-500/15 text-cyan-200'
                : 'border-slate-800 bg-[#0D1524] text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <div className="font-mono text-[11px] tabular-nums">0{s.number}</div>
            <div className="mt-0.5 truncate text-[11px] font-medium">
              {s.titleEn.split('—')[0].trim()}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
