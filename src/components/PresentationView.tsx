import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Slide {
  number: number;
  titleEn: string;
  subtitleJa: string;
  bullets: { label: string; detail: string }[];
  takeaway: string;
}

const SLIDES: Slide[] = [
  {
    number: 1,
    titleEn: 'FishShift — Find Fish. Save Fuel. Understand Our Oceans.',
    subtitleJa: '衛星海洋観測・魚種出現履歴・海況予報を統合した説明可能な漁場探索＆省燃料航路比較',
    bullets: [
      {
        label: '課題領域',
        detail: '経験頼みの漁場探索と燃料費高騰に対し、NASA地球観測データと海況モデルを同一画面で意思決定支援へ統合。',
      },
      {
        label: '設計原則',
        detail: '実データの来歴（Provenance）を厳格に管理し、未検証モデル値や試算条件を誤認させない透明なUI。',
      },
      {
        label: '提供価値',
        detail: '海洋変化トレンドの統計的検証、探索用環境適合マップ、2航路の燃料試算比較をワンストップで提供。',
      },
    ],
    takeaway: 'NASA Space Apps Challenge 2026 — Be An Earth System Trend Detective! 対応構成（計7枚）',
  },
  {
    number: 2,
    titleEn: 'The Problem — Uncertainty & Fuel Burden at Sea',
    subtitleJa: 'なぜ漁業現場で衛星データと最適航路の統合が難しいのか',
    bullets: [
      {
        label: '漁場環境の急速な変化',
        detail: '海水温の上昇や暖水塊・黒潮蛇行により、従来の経験則だけでは対象魚や餌生物の集積域を捉えにくくなっている。',
      },
      {
        label: '探索航行に伴う燃料コスト',
        detail: '広大な海域で漁場を探し回る探索時間・逆潮や高波浪中の航行は、燃料消費とCO2排出を押し上げる。',
      },
      {
        label: 'データの分断',
        detail: '衛星SST/Chl-a、生物出現DB（OBIS）、気象海流予報が別々のフォーマットとツールに分断されている。',
      },
    ],
    takeaway: '科学的データを「現場が直感的に比較・判断できるワークベンチ」へ翻訳する必要がある。',
  },
  {
    number: 3,
    titleEn: 'Our Solution — 4-Step Explainable Workflow',
    subtitleJa: '4ステップで完結する現場向け意思決定プロトタイプ',
    bullets: [
      {
        label: '01. 対象海域・魚種の選択',
        detail: '北海道南部（津軽海峡）や三陸沖など比較海域と、クロマグロ・サケ・マイワシ等の対象魚種を指定。',
      },
      {
        label: '02. 海洋環境レイヤーの重ね合わせ',
        detail: '海面水温（SST）とクロロフィルa（Chl-a）の潮目・境界に、過去のOBIS出現記録を重ねて可視化。',
      },
      {
        label: '03. 長期トレンドと統計的有意性の確認',
        detail: '対象海域が長期的に温暖化・基礎生産シフトしているかを、傾き・p値・95%信頼区間で検証。',
      },
      {
        label: '04. 2航路の省燃料比較試算',
        detail: '最短距離ラインと海流・波浪配慮ラインの燃料消費量・コスト差を、仮定条件を明示した上で比較。',
      },
    ],
    takeaway: 'ブラックボックスな「AI予測」ではなく、根拠が見える「説明可能な探索支援」を採用。',
  },
  {
    number: 4,
    titleEn: 'Powered by NASA Data & Open Marine APIs',
    subtitleJa: 'データソースの役割分担とバッチ／キャッシュ分離アーキテクチャ',
    bullets: [
      {
        label: 'NASA OB.DAAC / Earthdata (SST & Chl-a)',
        detail: '開発バッチ側で海域切り出し・QC（雲欠損除外）・月次集約を実施し、公開アプリでは高速キャッシュを表示。',
      },
      {
        label: 'OBIS API v3 (生物出現実績)',
        detail: '学名解決した過去の報告記録をGeoJSON化。サンプリング偏りを注記し「現在の魚群位置」とは明確に区別。',
      },
      {
        label: 'Open-Meteo Marine & Weather API',
        detail: '波高・海流・風速・風向の予報値を取得し、単位変換と予報取得時刻の明示を徹底。',
      },
    ],
    takeaway: '公開閲覧者にEarthdata認証や外部API遅延を一切強いない堅牢なスナップショット設計。',
  },
  {
    number: 5,
    titleEn: 'Discovering Ocean Trends — Statistical Rigor',
    subtitleJa: 'Trend Explorer による複数年変化率・有意性・限界の提示',
    bullets: [
      {
        label: '年次集約による季節バイアス抑制',
        detail: '有効月（例: 9/12か月以上）を満たす年平均値に対して線形回帰を行い、自己相関・季節周期の影響を抑制。',
      },
      {
        label: '傾き・p値・95%信頼区間・被覆率',
        detail: 'SIGNIFICANT / NOT SIGNIFICANT / INSUFFICIENT DATA の3値で判定し、「有意差なし＝変化なし」と断定しない。',
      },
      {
        label: '欠損画素の誠実な可視化',
        detail: '衛星の雲域欠損を0値として補間せず、有効画素被覆率（coverage_ratio）を併記して推定の信頼性を担保。',
      },
    ],
    takeaway: 'NASA公式課題の要である「定量的なトレンド検証と科学的誠実さ」を中核に配置。',
  },
  {
    number: 6,
    titleEn: 'Fish Habitats & Route Comparison',
    subtitleJa: '探索用環境適合指数と海況配慮ルートの試算モデル',
    bullets: [
      {
        label: '探索用環境適合指数 (Exploratory Habitat Index)',
        detail: '水温適性(0.40) + Chl-a文脈(0.35) + 過去出現文脈(0.25)の透明な合成スコア。未検証係数であることをUI明記。',
      },
      {
        label: '2航路の同一条件シミュレーション',
        detail: '距離優先(Route A)と海況配慮(Route B)について、Haversine距離・海流ベクトル成分・仮定波浪抵抗から燃料を試算。',
      },
      {
        label: '安全性・誇張表現の排除',
        detail: '削減差が0%や増加する場合もそのまま出力し、航行安全保証や「確実に釣れる」等の誇張表現を完全禁止。',
      },
    ],
    takeaway: '「比較と感度の把握」に徹することで、誤判断を防ぎつつ実用検証への橋渡しを実現。',
  },
  {
    number: 7,
    titleEn: "Impact & What's Next — Bridging to Real Fisheries",
    subtitleJa: '実漁業の課題解決に向けた段階的ロードマップ',
    bullets: [
      {
        label: '短期的ギャップの解消（実データ接続）',
        detail: '衛星Chl-aと魚類の「餌（動物プランクトン・小型浮魚）」の時間・空間ラグを補うため、漁業者のCPUE／操業日誌と突合。',
      },
      {
        label: '中期的高度化（A*動的航路最適化）',
        detail: 'MVPの2航路比較から、陸地・浅瀬・定置網ポリゴンと船舶固有の燃費曲線を組み込んだ動的グラフ探索へ拡張。',
      },
      {
        label: '社会的インパクト',
        detail: '探索時間の短縮による燃料コスト削減と、海洋環境シフトに順応した持続可能な資源利用の両立を目指す。',
      },
    ],
    takeaway: 'ハッカソンMVPの堅実な基盤から、現場の実漁獲データ検証・実船燃費モデル校正へと段階的に発展。',
  },
];

export function PresentationView() {
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
            <span>提出要件準拠: タイトル含め最大7枚</span>
            <span className="mx-2 text-slate-600">·</span>
            <span>キーボード ← / → でページ送り可能</span>
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
            <span>前へ</span>
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
            <span>次へ</span>
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
          <p className="mt-2 text-sm text-slate-300">{slide.subtitleJa}</p>

          <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-2">
            {slide.bullets.map((b) => (
              <div
                key={b.label}
                className="rounded-md border border-slate-800 bg-[#070B12]/80 p-4"
              >
                <div className="text-xs font-semibold text-cyan-300">{b.label}</div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-300">{b.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 border-t border-slate-800 pt-4 text-xs text-slate-400">
          <span className="font-semibold text-slate-200">Key Takeaway: </span>
          {slide.takeaway}
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
