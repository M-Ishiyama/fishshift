import { CheckCircle2, AlertCircle, Database } from 'lucide-react';

export function FeasibilityView() {
  return (
    <div className="mx-auto max-w-[1280px] px-6 py-6 space-y-6">
      <div className="border-b border-slate-800 pb-3">
        <h1 className="font-display text-xl font-semibold text-slate-50">
          設計妥当性・フィジビリティ検証 &amp; データ仕様
        </h1>
        <p className="mt-0.5 text-xs text-slate-400">
          <span>解決課題（リアルタイム餌場予測＋最適航路算出）に対する添付設計書（FishShift v1.0）の適合性・実現性評価</span>
        </p>
      </div>

      {/* Section 1: Fit & Gap Matrix */}
      <section className="rounded-lg border border-slate-800 bg-[#0D1524] p-5">
        <h2 className="font-display text-base font-semibold text-slate-100">
          1. 課題に対する設計の妥当性評価（目的整合性・ギャップ整理）
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">
          添付設計書は「NASA Space Apps Challenge 2026（長期海洋トレンド解析）」を主軸にしつつ、実漁業課題である「餌場予測・航路算出」へ橋渡しするMVP仕様となっています。実運用を見据えた際、以下の通り「妥当な点」と「意図的にスコープ外（ギャップ）としている点」が明確に分かれます。
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 pr-4 font-medium">評価観点</th>
                <th className="py-2.5 pr-4 font-medium">判定</th>
                <th className="py-2.5 pr-4 font-medium">添付設計での扱い</th>
                <th className="py-2.5 font-medium">実漁業課題に向けた補足・拡張要件</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-slate-300">
              <tr>
                <td className="py-3 pr-4 font-semibold text-slate-100">衛星SST・Chl-aの取得と可視化</td>
                <td className="py-3 pr-4 text-emerald-400 whitespace-nowrap font-medium">
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> 高妥当・実現可
                  </span>
                </td>
                <td className="py-3 pr-4">開発時バッチ取得＋公開時キャッシュ表示で認証・遅延問題を回避。雲欠損を0にせず除外。</td>
                <td className="py-3">リアルタイム運用では衛星通過の遅延（数時間〜1日）や雲被覆を補うモデル同化データ（例: CMEMS/JCOPE）の併用が有効。</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold text-slate-100">餌の密集・魚群行動予測</td>
                <td className="py-3 pr-4 text-amber-400 whitespace-nowrap font-medium">
                  <span className="inline-flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" /> 要段階検証
                  </span>
                </td>
                <td className="py-3 pr-4">Chl-aを「餌そのもの」と誤認させず、探索用指数 + OBIS過去記録として誠実に分離。</td>
                <td className="py-3">植物プランクトン増殖から小魚・大型魚集積には時間・空間ラグ（数日〜数週間・潮目移流）があるため、実操業CPUEでの校正が必須。</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold text-slate-100">海流・気象を活用した最適航路</td>
                <td className="py-3 pr-4 text-amber-400 whitespace-nowrap font-medium">
                  <span className="inline-flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" /> 試算比較止まり
                  </span>
                </td>
                <td className="py-3 pr-4">MVPではグローバル最適探索（A*等）を行わず、定義済み2航路の燃料試算比較と安全免責を徹底。</td>
                <td className="py-3">実船適用には海岸線・浅瀬・定置網回避メッシュ上のA*探索と、船舶機関別の実燃費曲線（馬力・波浪抵抗）の同定が必要。</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold text-slate-100">運用アーキテクチャの堅牢性</td>
                <td className="py-3 pr-4 text-emerald-400 whitespace-nowrap font-medium">
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> 非常に妥当
                  </span>
                </td>
                <td className="py-3 pr-4">取得バッチ（Python）と表示UIを分離し、認証キー漏洩やAPI制限による画面停止を防止。</td>
                <td className="py-3">ハッカソン段階から商用検証（自動日次更新＋船上オフラインキャッシュPWA）へそのまま拡張しやすい設計。</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 2: Technical Feasibility Breakdown */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="rounded-lg border border-slate-800 bg-[#0D1524] p-4">
          <h3 className="font-display text-sm font-semibold text-cyan-300">
            技術的フィジビリティ（データ取得）
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-300">
            NASA Earthdata / OB.DAAC、OBIS v3、Open-Meteo Marine &amp; Weather APIはいずれも公開または無償登録で利用可能であり、前処理済み軽量Parquet/GeoJSONへの変換パイプラインは標準Python（xarray / pandas / SciPy）で十分に構築可能です。
          </p>
        </div>

        <div className="rounded-lg border border-slate-800 bg-[#0D1524] p-4">
          <h3 className="font-display text-sm font-semibold text-cyan-300">
            科学的フィジビリティ（予測精度）
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-300">
            「リアルタイムに魚の群れを直接ピンポイント特定する」ことは衛星光学センサ単独では不可（雲・表層のみ・餌のタイムラグ）。しかし設計書が「探索用指数＋過去出現＋長期トレンド」へスコープを絞った点は科学的に極めて妥当です。
          </p>
        </div>

        <div className="rounded-lg border border-slate-800 bg-[#0D1524] p-4">
          <h3 className="font-display text-sm font-semibold text-cyan-300">
            実航海・法規制フィジビリティ
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-300">
            Open-Meteo Marine API等は外洋向け解像度であり沿岸の浅瀬・潮流・暗礁を扱えません。実航行の推奨は海事法規・安全責任のリスクが高いため、MVPで「比較試算・ナビゲーション非対応」を明記している判断は適切です。
          </p>
        </div>
      </div>

      {/* Section 3: Data Provenance & Attribution */}
      <section className="rounded-lg border border-slate-800 bg-[#0D1524] p-5">
        <div className="flex items-center gap-2 mb-3">
          <Database className="h-4 w-4 text-cyan-400" />
          <h2 className="font-display text-base font-semibold text-slate-100">
            2. 本イメージアプリにおけるデータ構成・出典リファレンス
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 text-xs">
          <div className="rounded border border-slate-800 bg-[#070B12]/70 p-3.5 space-y-1.5">
            <div className="font-semibold text-slate-200">衛星海洋観測データ（設計上の取得元）</div>
            <div className="text-slate-400">
              ・海面水温 (SST): NASA Earthdata Search / MODIS-Aqua / VIIRS 等月次L3プロダクト（単位: °C）
            </div>
            <div className="text-slate-400">
              ・クロロフィルa (Chl-a): NASA Ocean Color OB.DAAC / PACE OCI・MODIS等（単位: mg/m³）
            </div>
            <div className="font-mono text-[11px] text-amber-300/90 pt-1">
              ※ 本ブラウザ版プレビューでは、上記仕様を再現した事前キャッシュ・シミュレーション値を使用しています。
            </div>
          </div>

          <div className="rounded border border-slate-800 bg-[#070B12]/70 p-3.5 space-y-1.5">
            <div className="font-semibold text-slate-200">生物出現記録・気象海況予報（設計上の取得元）</div>
            <div className="text-slate-400">
              ・魚種出現履歴: OBIS API v3 (/v3/occurrence) — 学名基準（Thunnus orientalis 等）
            </div>
            <div className="text-slate-400">
              ・波浪・海流・風予報: Open-Meteo Marine Weather API / Forecast API（1 knot = 1.852 km/h 換算）
            </div>
            <div className="font-mono text-[11px] text-slate-400 pt-1">
              ※ 統計計算（OLS傾き・t検定p値・95%CI）およびHaversine距離・燃料試算はブラウザ内でリアルタイム実計算しています。
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
