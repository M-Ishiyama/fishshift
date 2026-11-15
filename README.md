# FishShift — Ocean Trend & Fuel-Aware Fishing Intelligence

**NASA Space Apps Challenge 2026 — "Be An Earth System Trend Detective!"**

NASA の地球観測データ（衛星による海面水温・クロロフィルa）から日本近海の10年間の海洋トレンドを統計的に検証し、その結果を漁業者の実務課題である「餌場探索」と「省燃料航路選択」へ橋渡しする意思決定支援プロトタイプです。

対象海域は、暖流と寒流が交差して明瞭な潮目が形成される 2 海域:

| 海域 | 範囲 | 特徴 |
|---|---|---|
| 北海道南部・津軽海峡 | 40.5–43.0°N, 139.5–143.0°E | 津軽暖流と親潮系冷水の交差域 |
| 三陸沖・黒潮親潮混合域 | 37.5–40.5°N, 141.5–145.5°E | 黒潮続流と親潮の衝突による前線帯 |

---

## 利用している NASA オープンデータ

本アプリの中核となる 2 変数は、いずれも **NASA が生産した実観測プロダクト**です。合成データ・ダミー値は使用していません。

### 1. 海面水温 (SST)

| 項目 | 内容 |
|---|---|
| プロダクト | GHRSST Level 4 MUR Global Foundation SST Analysis v4.1（月次） |
| 生産者 | **NASA JPL**（Jet Propulsion Laboratory） |
| 観測プラットフォーム | GHRSST 多衛星統合（MODIS / AVHRR / AMSR-E 等） |
| 変数 / 単位 | `analysed_sst` / °C |
| データセットID | `jplMURSST41mday` |
| 対象期間 | 2016-01 〜 2025-12（120ヶ月） |

### 2. クロロフィルa (Chl-a)

| 項目 | 内容 |
|---|---|
| プロダクト | Chlorophyll-a, Aqua MODIS, NPP, L3SMI, Global 4km, R2022 Science Quality（月次） |
| 生産者 | **NASA OB.DAAC**（Ocean Biology Distributed Active Archive Center） |
| 観測プラットフォーム | **NASA Aqua 衛星 / MODIS センサー** |
| 変数 / 単位 | `chlor_a` / mg m⁻³ |
| データセットID | `erdMH1chlamday_R2022SQ` |
| 対象期間 | 2016-01 〜 2025-12（120ヶ月） |

### 配信経路について

上記 2 プロダクトは **NOAA CoastWatch ERDDAP** 経由で取得しています。

```text
https://coastwatch.pfeg.noaa.gov/erddap/griddap/jplMURSST41mday.html
https://coastwatch.pfeg.noaa.gov/erddap/griddap/erdMH1chlamday_R2022SQ.html
```

ERDDAP は**再配信ミラーであり、データの生産者は NASA** です。アプリ内の出典表記もこの区別を保持し、NASA プロダクト名を主、配信経路を従として表示しています（[`formatNasaSource()`](src/data/oceanData.ts)）。

### 補助データ: 魚種出現記録（NASA 以外）

| 項目 | 内容 |
|---|---|
| ソース | OBIS (Ocean Biodiversity Information System) API v3 |
| エンドポイント | `https://api.obis.org/v3/occurrence` |
| 対象種 | Thunnus orientalis（クロマグロ）/ Oncorhynchus keta（シロザケ）/ Sardinops melanostictus（マイワシ） |

本海域の実測記録は**種・海域あたり 0〜9 件と極めて疎**です（計 27 件 / 5 データセット由来）。これを水増し・内挿してヒートマップ化することはせず、**点として実測位置のみ描画**しています。記録が 0 件の組み合わせは「0 件である」とそのまま表示します。

### 推定値として明示している変数（NASA 由来ではない）

`currentSpeedMs` / `currentDirDeg` / `waveHeightM` / `windSpeedMs` / `windDirDeg`

同等の月次 NASA プロダクトが本解像度で存在しないため、**沖合距離と季節から算出したパラメトリック推定値**です。provenance 上で `data_kind: "estimated"` として実観測と分離管理され、UI 上でも推定値と明記しています。**実際の航海判断には使用できません。**

---

## 科学的な取り扱い

- **雲欠損を 0 で埋めない** — ERDDAP は陸域と雲域の双方に `null` を返します。陸域は海域ポリゴンで判定し、「海域かつ `null`」は衛星欠損として区別描画します（ハッチング = 欠損、非描画 = 陸）。
- **有効画素被覆率を併記** — 各月の `coverageRatio` は実測の有効画素割合です（津軽 平均 0.75 / 三陸 平均 0.96）。
- **Chl-a は中央値で集約** — 強い右裾分布のため、海域月次代表値は算術平均ではなく中央値を使用。
- **トレンド検定は年次平均を標準** — 月次データは季節周期と時間的自己相関により p 値が過小評価されやすいため、有効月 9ヶ月以上の年次平均に対する OLS 線形回帰（傾き・t 検定 p 値・95% 信頼区間・R²）を標準の傾向検定としています。
- **統計結果を UI コピーに優先させる** — `npm run check:trends` が出力する数値が「結論」であり、UI 側の文言はそれに従います。逆方向の調整は行いません。
- **適合指数は探索用の合成指標** — 魚群の存在を予測するものではなく、実観測 SST / Chl-a と種別参照適温帯の重なりを可視化する探索補助です。

---

## アーキテクチャ: データ取得と表示の分離

ブラウザは NASA / Earthdata / ERDDAP の API を**一切直接呼び出しません**。理由は 2 つあります。

1. **ERDDAP は CORS ヘッダを返さない** — ブラウザからの直接取得は構造的に不可能。
2. **全 10 年グリッドは約 3.4MB / 22 秒** — 閲覧時取得では実用的な表示速度になりません。

このため取得・QC・集約は**ビルド前のバッチ**で完結させ、軽量 JSON をリポジトリに同梱しています。

```text
scripts/prepare_nasa.mjs          NASA/OBIS 取得バッチ（月次 L3/L4 → 海域切り出し → QC → 集約）
  ↓
src/data/nasa/tsugaru_grid.json   20×26 セル × 120ヶ月の SST / Chl-a グリッド
src/data/nasa/sanriku_grid.json
src/data/nasa/monthly_series.json 海域別 月次代表値 + 有効画素被覆率
src/data/nasa/obis_occurrences.json
src/data/nasa/provenance.json     全プロダクトの取得トレイル（機械可読）
  ↓
src/data/oceanData.ts             PROVENANCE として読み込み、全画面へ単一の出典表記を供給
```

`provenance.json` を単一の情報源とすることで、画面間で出典表記がズレないことを構造的に保証しています。

---

## 画面構成

| タブ | 内容 |
|---|---|
| **Ocean Map** | SST / Chl-a / 適合指数の月次グリッド表示、OBIS 実測記録の重ね合わせ、候補ポイント抽出 |
| **Trend Explorer** | 2016–2025 年の線形回帰による長期変化の有意性検証（傾き・p 値・95%CI・R²） |
| **Route Lab** | 候補ポイントへの最短ライン vs 海流・波浪配慮ラインの距離・時間・燃料コスト比較 |
| **Presentation** | 審査用サマリースライド（計 7 枚） |
| **Feasibility & Data** | 実運用に向けた妥当性評価と、全データの出典リファレンス |

統計計算（OLS 傾き・t 検定 p 値・95%CI）、Haversine 距離、燃料試算はすべてブラウザ内でリアルタイム実計算しています。

---

## ローカル実行

**前提:** Node.js

```bash
npm install
npm run dev
```

同梱済みの NASA データスナップショットを使うため、**API キーや認証情報は不要**です。

### NASA データを再取得する場合

```bash
npm run prepare:nasa
```

ERDDAP への実リクエストを伴い、全期間で数分かかります。完了時にサニティレポート（月数・値域・OBIS 件数）が出力されるので、異常な結果がそのままコミットされることを防げます。短期間での試験実行は環境変数で範囲を絞れます。

```bash
FISHSHIFT_START_YEAR=2024 FISHSHIFT_END_YEAR=2024 npm run prepare:nasa
```

### トレンド統計の確認

```bash
npm run check:trends
```

アプリが同梱データから算出するトレンド統計（n / 傾き / p 値 / R² / 95%CI / 判定）を海域・変数ごとに出力します。

### その他

```bash
npm run build     # 本番ビルド
npm run lint      # 型チェック (tsc --noEmit)
```

---

## データ利用条件とクレジット

- **NASA** — NASA の地球観測データはオープンデータです。本アプリは NASA JPL MUR L4 v4.1 および NASA OB.DAAC MODIS-Aqua L3SMI R2022 SQ を利用しており、生産者として NASA、配信経路として NOAA CoastWatch ERDDAP の双方を明記しています。
- **NOAA CoastWatch ERDDAP** — 上記プロダクトの再配信元。
- **OBIS** — 出現記録はデータセット単位のライセンスに従います。各レコードの `datasetId` を保持しています。

本アプリは研究・検討用のプロトタイプです。表示される航路・燃料・波高の値は推定値であり、実際の航海判断・安全判断に使用することはできません。
