import { CheckCircle2, AlertCircle, Database } from 'lucide-react';
import type { Locale } from '../types/ocean';

interface FeasibilityViewProps {
  locale: Locale;
}

export function FeasibilityView({ locale }: FeasibilityViewProps) {
  const isJa = locale === 'ja';

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-6 space-y-6">
      <div className="border-b border-slate-800 pb-3">
        <h1 className="font-display text-xl font-semibold text-slate-50">
          {isJa
            ? '設計妥当性・フィジビリティ検証 & データ仕様'
            : 'Design Validity, Feasibility Assessment & Data Specifications'}
        </h1>
        <p className="mt-0.5 text-xs text-slate-400">
          <span>
            {isJa
              ? '解決課題（リアルタイム餌場予測＋最適航路算出）に対する添付設計書（FishShift v1.0）の適合性・実現性評価'
              : 'Fit-and-gap evaluation of the FishShift v1.0 design spec against real-time forage prediction and optimal routing goals'}
          </span>
        </p>
      </div>

      {/* Section 1: Fit & Gap Matrix */}
      <section className="rounded-lg border border-slate-800 bg-[#0D1524] p-5">
        <h2 className="font-display text-base font-semibold text-slate-100">
          {isJa
            ? '1. 課題に対する設計の妥当性評価（目的整合性・ギャップ整理）'
            : '1. Fit-and-Gap Matrix Against Operational Fisheries Goals'}
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">
          {isJa
            ? '添付設計書は「NASA Space Apps Challenge 2026（長期海洋トレンド解析）」を主軸にしつつ、実漁業課題である「餌場予測・航路算出」へ橋渡しするMVP仕様となっています。実運用を見据えた際、以下の通り「妥当な点」と「意図的にスコープ外（ギャップ）としている点」が明確に分かれます。'
            : 'The FishShift spec centers on NASA Space Apps Challenge 2026 (long-term ocean trend validation) while bridging toward fisheries exploration and route comparison. Below are areas where the design is strong versus intentionally scoped out for MVP safety.'}
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 pr-4 font-medium">
                  {isJa ? '評価観点' : 'Evaluation Dimension'}
                </th>
                <th className="py-2.5 pr-4 font-medium">{isJa ? '判定' : 'Verdict'}</th>
                <th className="py-2.5 pr-4 font-medium">
                  {isJa ? '添付設計での扱い' : 'Handling in Design Spec'}
                </th>
                <th className="py-2.5 font-medium">
                  {isJa ? '実漁業課題に向けた補足・拡張要件' : 'Operational Extension Requirements'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-slate-300">
              <tr>
                <td className="py-3 pr-4 font-semibold text-slate-100">
                  {isJa ? '衛星SST・Chl-aの取得と可視化' : 'Satellite SST & Chl-a Ingestion'}
                </td>
                <td className="py-3 pr-4 text-emerald-400 whitespace-nowrap font-medium">
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />{' '}
                    {isJa ? '高妥当・実現可' : 'Highly Feasible'}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  {isJa
                    ? '開発時バッチ取得＋公開時キャッシュ表示で認証・遅延問題を回避。雲欠損を0にせず除外。'
                    : 'Offline batch ingestion + cached snapshots prevent auth/latency issues; cloud gaps are masked rather than zero-filled.'}
                </td>
                <td className="py-3">
                  {isJa
                    ? 'リアルタイム運用では衛星通過の遅延（数時間〜1日）や雲被覆を補うモデル同化データ（例: CMEMS/JCOPE）の併用が有効。'
                    : 'For near-real-time operations, blend assimilated ocean reanalyses (e.g., CMEMS/JCOPE) to bridge swath latency and cloud cover.'}
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold text-slate-100">
                  {isJa ? '餌の密集・魚群行動予測' : 'Forage & Schooling Prediction'}
                </td>
                <td className="py-3 pr-4 text-amber-400 whitespace-nowrap font-medium">
                  <span className="inline-flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />{' '}
                    {isJa ? '要段階検証' : 'Phased Validation'}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  {isJa
                    ? 'Chl-aを「餌そのもの」と誤認させず、探索用指数 + OBIS過去記録として誠実に分離。'
                    : 'Avoids conflating Chl-a with live prey; separates exploratory suitability from historical OBIS occurrences.'}
                </td>
                <td className="py-3">
                  {isJa
                    ? '植物プランクトン増殖から小魚・大型魚集積には時間・空間ラグ（数日〜数週間・潮目移流）があるため、実操業CPUEでの校正が必須。'
                    : 'Because trophic lags span days to weeks and advect along fronts, calibration against catch logs / CPUE is essential.'}
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold text-slate-100">
                  {isJa ? '海流・気象を活用した最適航路' : 'Current & Weather-Aware Routing'}
                </td>
                <td className="py-3 pr-4 text-emerald-400 whitespace-nowrap font-medium">
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />{' '}
                    {isJa ? 'A*陸地回避実装済' : 'Land-Avoiding A*'}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  {isJa
                    ? '40×52海域メッシュ上で海岸線ポリゴンとの線分交差を除外し、A*＋見通し線スムージングで最短距離(A)と最小燃料(B)を動的算出。'
                    : 'Computes land-avoiding Route A (shortest distance) and Route B (minimum fuel) via 40×52 A* + line-of-sight smoothing with polygon intersection checks.'}
                </td>
                <td className="py-3">
                  {isJa
                    ? '実船適用には水深（浅瀬・暗礁）・定置網回避メッシュの追加と、船舶機関別の実燃費曲線（馬力・波浪抵抗）の同定が必要。'
                    : 'Operational use still requires bathymetry/reef/gear-avoidance layers and calibrated vessel engine fuel curves.'}
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold text-slate-100">
                  {isJa ? '運用アーキテクチャの堅牢性' : 'Operational Architecture Robustness'}
                </td>
                <td className="py-3 pr-4 text-emerald-400 whitespace-nowrap font-medium">
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />{' '}
                    {isJa ? '非常に妥当' : 'Well-Structured'}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  {isJa
                    ? '取得バッチ（Python）と表示UIを分離し、認証キー漏洩やAPI制限による画面停止を防止。'
                    : 'Decouples Python ingestion batch from static/frontend UI, eliminating API key exposure and rate-limit outages.'}
                </td>
                <td className="py-3">
                  {isJa
                    ? 'ハッカソン段階から商用検証（自動日次更新＋船上オフラインキャッシュPWA）へそのまま拡張しやすい設計。'
                    : 'Scales cleanly from hackathon demo to automated daily updates and offline-capable shipboard PWA caching.'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 2: Technical Feasibility Breakdown */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="rounded-lg border border-slate-800 bg-[#0D1524] p-4">
          <h3 className="font-display text-sm font-semibold text-cyan-300">
            {isJa ? '技術的フィジビリティ（データ取得）' : 'Technical Feasibility (Ingestion)'}
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-300">
            {isJa
              ? 'NASA Earthdata / OB.DAAC、OBIS v3、Open-Meteo Marine & Weather APIはいずれも公開または無償登録で利用可能であり、前処理済み軽量Parquet/GeoJSONへの変換パイプラインは標準Python（xarray / pandas / SciPy）で十分に構築可能です。'
              : 'NASA Earthdata / OB.DAAC, PO.DAAC, OBIS v3, and Open-Meteo APIs are openly accessible, and lightweight Parquet/GeoJSON pipelines are straightforward in standard Python (xarray / pandas / SciPy).'}
          </p>
        </div>

        <div className="rounded-lg border border-slate-800 bg-[#0D1524] p-4">
          <h3 className="font-display text-sm font-semibold text-cyan-300">
            {isJa ? '科学的フィジビリティ（予測精度）' : 'Scientific Feasibility (Accuracy)'}
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-300">
            {isJa
              ? '「リアルタイムに魚の群れを直接ピンポイント特定する」ことは衛星光学センサ単独では不可（雲・表層のみ・餌のタイムラグ）。しかし設計書が「探索用指数＋過去出現＋長期トレンド」へスコープを絞った点は科学的に極めて妥当です。'
              : 'Pinpointing live fish schools solely from optical satellites is physically impossible (cloud gaps, surface skin, trophic lag). Scoping the MVP to suitability indices, OBIS history, and statistical trends is scientifically sound.'}
          </p>
        </div>

        <div className="rounded-lg border border-slate-800 bg-[#0D1524] p-4">
          <h3 className="font-display text-sm font-semibold text-cyan-300">
            {isJa ? '実航海・法規制フィジビリティ' : 'Maritime & Regulatory Feasibility'}
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-300">
            {isJa
              ? 'Open-Meteo Marine API等は外洋向け解像度であり沿岸の浅瀬・潮流・暗礁を扱えません。実航行の推奨は海事法規・安全責任のリスクが高いため、MVPで「比較試算・ナビゲーション非対応」を明記している判断は適切です。'
              : 'Open marine grids lack coastal bathymetry, reef hazards, and local tidal detail. Explicitly framing outputs as comparative estimates ("not for navigation") appropriately manages maritime safety and liability.'}
          </p>
        </div>
      </div>

      {/* Section 3: Data Provenance & Attribution */}
      <section className="rounded-lg border border-slate-800 bg-[#0D1524] p-5">
        <div className="flex items-center gap-2 mb-3">
          <Database className="h-4 w-4 text-cyan-400" />
          <h2 className="font-display text-base font-semibold text-slate-100">
            {isJa
              ? '2. 本イメージアプリにおけるデータ構成・出典リファレンス'
              : '2. Data Provenance & Reference Architecture in This Prototype'}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 text-xs">
          <div className="rounded border border-slate-800 bg-[#070B12]/70 p-3.5 space-y-1.5">
            <div className="font-semibold text-slate-200">
              {isJa
                ? '衛星海洋観測データ（NASA実観測スナップショット組込済）'
                : 'Satellite Ocean Observations (Real NASA Snapshots Integrated)'}
            </div>
            <div className="text-slate-300">
              {isJa
                ? '・海面水温 (SST): NASA JPL「GHRSST Level 4 MUR Global Foundation SST Analysis v4.1（月次 / jplMURSST41mday）」[2016-01 〜 2025-12, 単位: °C]'
                : '• SST: NASA JPL "GHRSST Level 4 MUR Global Foundation SST Analysis v4.1 (Monthly / jplMURSST41mday)" [2016-01 to 2025-12, °C]'}
            </div>
            <div className="text-slate-300">
              {isJa
                ? '・クロロフィルa (Chl-a): NASA OB.DAAC「Aqua MODIS NPP L3SMI Global 4km R2022 Science Quality（月次 / erdMH1chlamday_R2022SQ）」[2016-01 〜 2025-12, 単位: mg m⁻³]'
                : '• Chlorophyll-a: NASA OB.DAAC "Aqua MODIS NPP L3SMI Global 4km R2022 Science Quality (Monthly / erdMH1chlamday_R2022SQ)" [2016-01 to 2025-12, mg m⁻³]'}
            </div>
            <div className="text-slate-400">
              {isJa
                ? '・配信経路: NOAA CoastWatch ERDDAP 再配信ミラー経由で開発時バッチ取得（データ生産者は NASA JPL / NASA OB.DAAC）。雲・アーカイブ欠損月は補間せず null として保持。'
                : '• Delivery: Batch-fetched via NOAA CoastWatch ERDDAP mirror (primary producers: NASA JPL / NASA OB.DAAC). Cloud and archive gaps are preserved as null.'}
            </div>
          </div>

          <div className="rounded border border-slate-800 bg-[#070B12]/70 p-3.5 space-y-1.5">
            <div className="font-semibold text-slate-200">
              {isJa
                ? '生物出現記録（OBIS実測）＆ 物理海況・航路試算モデル'
                : 'Biological Occurrences (Real OBIS) & Modeled Sea-State Layers'}
            </div>
            <div className="text-slate-300">
              {isJa
                ? '・魚種出現履歴: OBIS API v3（/v3/occurrence）実測記録のみ描画（津軽・三陸の3魚種計27件 / 5データセット由来、メキシコ湾キハダ4,011件中500件描画、0件の組合せは0件と表示）。'
                : '• Species Occurrences: OBIS API v3 (/v3/occurrence) real coordinates only (27 records across 5 datasets for Japan; 500 of 4,011 for Gulf Yellowfin; 0-record pairs shown as 0).'}
            </div>
            <div className="text-slate-400">
              {isJa
                ? '・海流・海上風・波浪（モデル値）: 季節別の合成物理場モデルを使用（将来的な NASA PO.DAAC CCMP / Open-Meteo Marine API 接続を想定）。'
                : '• Currents, Winds & Waves (Modeled): Seasonal physical field model in this preview (designed for future NASA PO.DAAC CCMP / Open-Meteo Marine integration).'}
            </div>
            <div className="font-mono text-[11px] text-emerald-300/90 pt-1">
              {isJa
                ? '※ 統計計算（OLS傾き・Student-t p値・95%CI）およびHaversine距離・燃料試算は実データ上でリアルタイム計算しています。'
                : '※ OLS regression, Student-t p-values, 95% CIs, Haversine distances, and fuel estimates execute live in-browser over real observations.'}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
