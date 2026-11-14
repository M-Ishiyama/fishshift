# FishShift — Claude Code 実装用システム設計書

> **Version:** 1.0  
> **作成日:** 2026-11-14  
> **対象:** NASA Space Apps Challenge 2026 — **Be An Earth System Trend Detective!**  
> **タグライン:** *Find Fish. Save Fuel. Understand Our Oceans.*  
> **用途:** このMarkdownをClaude Codeに読み込ませ、実装・試験・公開・発表資料作成の単一の仕様書として使用する。

---

## 0. この設計書の読み方と優先順位

- `MUST`: ハッカソンMVPで必須。`SHOULD`: 時間があれば。`LATER`: 将来拡張。
- **最優先はNASA公式課題への適合**：NASA地球観測データを用い、場所・変数・期間を選択して時系列を可視化し、変化量と統計的有意性を説明する。
- 釣り／漁業の価値として、**魚種別の過去の出現実績**と**海洋環境の重ね合わせ**を実現する。
- 風・波・海流に基づく**省燃料ルート比較は試算／意思決定支援**として実装する。実航海用のナビゲーションや確実な魚群検出を名乗らない。
- **実データを偽装しない**。取得失敗時は「保存済みの実データ」または明示した「シミュレーション」へフォールバックする。
- 本書中の画面、スコア係数、座標、燃料数値、期間等は実装用の設定例であって観測事実・最適な航路の保証ではない。

## 1. 提出要件（絶対に守る）

ユーザーが共有したイベント提出ルールを**受け入れ基準**とする。

| ID | 制約 | 実装／提出方法 | 確認 |
|---|---|---|---|
| SUB-01 | シンプルな動作デモを提供 | 公開Webアプリの「Demo」画面で、事前用意した再現可能なユースケースを1クリック再生可能にする | [ ] |
| SUB-02 | 提出リンクは**1つだけ** | **公開アプリのURLを1件のみ**提出する。アプリ内にデモと発表資料を含める | [ ] |
| SUB-03 | 発表は最大7枚のスライド **または** 30秒動画 | **スライド方式を採用**。タイトル含め最大7枚。アプリ内の「Presentation」ページで7枚を閲覧可能にする。必要ならPDFをアプリ内からダウンロードできるようにする | [ ] |
| SUB-04 | 外部ホスティング／リポジトリにアップロード | Streamlit Community Cloud等でアプリを公開（要件に合うホスティング先を実際に確認） | [ ] |
| SUB-05 | パスワード・許可・登録不要 | プライベートウィンドウ／ログアウトした別端末でURLを開き、全デモとスライドが閲覧できること | [ ] |
| SUB-06 | 18歳未満の人の氏名・声・肖像を含めない | デモデータ・画像・スライド・動画をチェック。未成年の個人情報・声・写真は含めない | [ ] |
| SUB-07 | 新規WebサイトのWebフィルタ分類を推奨 | 公開先の分類申請が可能なら実施。推奨事項であり必須項目とは区別する | [ ] |

**提出に関する重要事項**：主催者の提出フォームにスライドの**別添アップロード欄**が存在するか等は、イベントの最新画面で最終確認する。本設計では「**提出リンクは1件、アプリ内にデモと7枚の発表を内包**」を基本案とする。もし資料を個別添付できる場合は、同じ7枚を別添してもよいが、公開リンクを2件記載しない。公開GitHubリポジトリのURLを別途記載しない（アプリ内のSources表示も審査ルール上『リンク1件』に含めるか迷う場合は提出本文には公開アプリ以外のURLを載せない）。

**重要：NASA Earthdataの認証**は、開発者がデータを事前取得する場合にだけ必要となる可能性がある。**公開閲覧者にはEarthdata認証を絶対に要求しない**。公開アプリの実行時にEarthdataログインへリダイレクトしない。

## 2. プロダクト概要

### 2.1 解決する課題

漁業・釣りでは、過去の経験や断片的な情報に依存して漁場を選びやすい。一方、海水温・植物プランクトン環境は時間・場所とともに変化し、航行には燃料費がかかる。一般ユーザーが衛星データ、魚種出現記録、海況予報を同じ画面で理解することは難しい。

### 2.2 提案する体験

1. 漁業／釣りの対象海域を選ぶ（初期値：北海道南部〜津軽海峡の**サンプル調査範囲**）。
2. 魚種を選ぶ（初期：クロマグロ *Thunnus orientalis*。追加候補：サケ *Oncorhynchus keta*、マイワシ *Sardinops melanostictus*）。学名はOBISで名前解決し実際の取得件数を検証する。
3. マップ上でNASA衛星の**海面水温（SST）**、**クロロフィルa濃度（Chl-a）**を切り替えて表示。
4. 魚種の**過去の出現記録（OBIS）**を別レイヤー表示。
5. 選択範囲について、NASA観測変数の時系列・年当たりの変化率・p値／信頼区間／有効観測数を表示。
6. 候補地点をクリックし、海洋環境の適合度を**説明可能な参考スコア**として表示。
7. 任意の出発点から候補地点への**2航路の試算**を比較（距離、時間、燃料、海況の注意点）。

### 2.3 メインメッセージ

> FishShift turns NASA ocean observations into explainable insights about changing fish habitats, with an experimental fuel-aware route comparison.

### 2.4 公式課題との対応

公式課題は、NASAの地球観測／モデルデータから変数を選び、対象地域の**十分な長さの時系列**を可視化し、**変化の方向・程度・有意性**を統計分析することを求める。

| 公式課題の観点 | FishShift機能 | 受け入れ基準 |
|---|---|---|
| NASA由来の地球科学変数を選ぶ | SST / Chl-a データレイヤー | 両変数の出典・単位・観測期間が表示される |
| 地域を選択する | 地図／プリセット海域 | 調査範囲が切替可能 |
| 時系列を表示 | 月別／年別チャート | 年月ラベル付きの実測集計値を表示 |
| 変化速度 | 年当たりの線形傾き | °C/年など適切な単位で表示 |
| 統計的有意性 | 傾きのp値、95%CI、n | 有意／非有意／判定不能を明示 |
| 結果の解釈 | 分析説明パネル | 結果、限界、採用手法を明示 |

**採点・デモではこの「Trend Explorer」機能を一番強く見せること。**

## 3. MVPのスコープと非対象

### 3.1 MUST（絶対に完成）

- 日本語UI（画面タイトルや重要項目は英語を併記すると国際審査でもわかりやすい）。
- 地図（デモ海域）とNASA由来SST／Chl-aを少なくとも1つずつ可視化。**データが入手できた変数のみ「実データ」と表示**。
- 少なくともNASA由来1変数について**複数年の時系列・傾き・統計的有意性・データ出典**を表示。
- 魚種の選択UIとOBISの過去出現地点表示（対象魚種に記録がない場合は説明し、代替魚種／範囲を選べる）。
- 航路2本の比較UIと、**モデル条件・試算値**表示（実運航推奨と混同しない）。
- 「Demo」「Presentation」「About & Data」へのナビゲーション。
- 開発環境での実データ前処理、公開環境での**オフライン・キャッシュ表示**。
- 公開URL1件、ログイン不要、最大7枚スライド、18歳未満の人の氏名・声・肖像なし。

### 3.2 SHOULD（余裕があれば）

- 魚種別の環境適合ヒートマップ、理由説明。
- 地図上で複数海域の比較（変化傾向が異なる2海域）。
- 予報日時スライダー、波・風・海流レイヤー。
- 傾向分析のMann–Kendallテストなど補助指標。
- 英語UI切替。

### 3.3 LATER（ハッカソン後）

- 実漁獲量／CPUEデータによる検証済みの魚種別分布予測。
- 実船舶の燃費曲線・船級・航行制限を考慮した運航最適化。
- 自動更新ワークフロー、アカウント認証、パーソナライズ、AWS API化。
- 高度な衛星データ同化／大規模AI学習。

### 3.4 禁止する誤表現

- OBIS出現点を「現在の魚群位置」や「確実に釣れる地点」と表現しない。
- Chl-aを「魚の分布」「すべてのプランクトン数」として直接表示しない。
- 相関を因果と表現しない。
- 地図上の航路線を、船舶が安全に通航できると保証しない。
- 単純な近似燃料モデルで「燃料がX%削減される」と確約しない。「**試算条件下の比較**」と記載。
- ダミーデータを実観測のふりをして表示しない。

## 4. データソースと取得方式

### 4.1 優先ソース一覧

| 種類 | ソース | 用途 | 開発時の取得 | 公開時の使用 | 重要な注意 |
|---|---|---|---|---|---|
| NASA海色 | [NASA Ocean Color / OB.DAAC](https://oceandata.sci.gsfc.nasa.gov/) | Chl-a（mg/m³） | 地域・期間限定L3 mapped等を取得 | 加工済みParquet/GeoJSON | 一部取得に**Earthdata Login**必要。公開閲覧時の認証不要化 |
| NASA海面水温 | [NASA Earthdata Search](https://search.earthdata.nasa.gov/) | SST（°C） | 同じ地域・月別時系列を取得 | 加工済みParquet/GeoJSON | 特定プロダクトID・単位・有効値範囲を確認 |
| NASA API補助 | [NASA Open Data Portal](https://data.nasa.gov/) / [NASA Open APIs](https://api.nasa.gov/) | データセット探索 | 調査・出典確認 | アプリ実行に必須ではない | APOD等は本システムの海洋データには不向き |
| 生物出現 | [OBIS API](https://api.obis.org/) | 種別過去出現記録 | 学名とBBoxで取得 | GeoJSON/Parquet | サンプリング偏りあり。魚群密度ではない |
| 海況予報 | [Open-Meteo Marine API](https://open-meteo.com/en/docs/marine-weather-api) | 波高・波向・海流 | 航路代表点で取得 | 保存済み予報＋取得時刻 | 沿岸精度に限界。航海判断に使用不可 |
| 風予報 | [Open-Meteo Weather API](https://open-meteo.com/en/docs) | 風速・風向 | 航路代表点で取得 | 保存済み予報＋取得時刻 | 予報と過去観測を同一視しない |

**データ取得設計原則**：NASAデータは「データ取得・加工のバッチ」と「UIでの表示」を分離。**ブラウザで直接NASA認証付きAPIを呼ばない**。取得物にはソースURL、プロダクト名、処理日時、観測期間、単位をメタデータとして保存する。

### 4.2 NASAデータセット確定手順（Claude Codeの最初の作業）

1. 初期海域のBBoxを決める。サンプルは `lat: 40.5–43.0, lon: 139.5–143.0`。これは**実験用範囲**で漁場の推奨ではない。
2. OB.DAACとEarthdata Searchで、対象範囲を含む**月次のSSTとChl-aプロダクト**を調査する。
3. 時系列解析に必要な**複数年**が同一センサー／同一処理系で得られるプロダクトを優先する（例：まず5～10年の月平均、可能なら10年以上）。センサー差やプロダクト変更の期間を無批判に連結しない。
4. ファイル形式、単位、欠損値、座標系、取得ライセンス、認証要否、入手URLを**`data/metadata/datasets.yaml`に確定記録**する。
5. プロダクトが確定するまで、架空のNASAファイルURLや存在未検証のIDをコードに埋め込まない。
6. `scripts/prepare_nasa.py`で、海域に切り出し、月ごとに集約・QCを行い、軽量ParquetまたはCSV＋GeoJSONを生成。
7. 正式データが取得できない場合は、**NASA製品由来の公開サンプルを別手段で取得可能か検証**。それも無理なら当該データ機能は非表示／未取得を明示し、他の実データで課題要件を満たす。架空の科学結果を生成しない。

**取得元メモ**：PACE OCIのEarthdataアクセスには開発者ログインが必要となる場合がある。NASA公式Python例では `earthaccess` が案内されている。<https://nasa.github.io/oceandata-notebooks/notebooks/oci/oci_data_access.html>

### 4.3 OBIS魚種出現記録

- 取得：OBIS `/v3/occurrence` 等。APIドキュメントのパラメータを**実際に調べて** `scientificname` / 生物分類ID / 範囲 / ページネーションに対応する。
- 始めに `Thunnus orientalis`, `Oncorhynchus keta`, `Sardinops melanostictus` を名称解決し、取得件数を確認する。魚種ごとに過去記録数が不十分なら対象範囲／魚種を見直す。
- `eventDate`, `decimalLatitude`, `decimalLongitude`, `scientificName`, `datasetID`, `basisOfRecord` 等、存在する項目だけ正規化して保存。
- 不正座標、明らかな陸上点、重複、不明日時を検出し、除外件数をログに残す。
- UIは「過去の観測／報告点」レイヤー名、期間表示、件数表示。未調査範囲を「魚がいない」と判断しない。
- APIの応答上限・ページ送りを実装。APIが利用不可なら取得済みスナップショットを表示。

### 4.4 Open-Meteo海況／風

サンプル（実行前にパラメータと戻り値仕様を公式ドキュメントで再確認）：

```text
GET https://marine-api.open-meteo.com/v1/marine
  ?latitude=41.5&longitude=141.0
  &hourly=wave_height,wave_direction,ocean_current_velocity,ocean_current_direction
  &forecast_days=2

GET https://api.open-meteo.com/v1/forecast
  ?latitude=41.5&longitude=141.0
  &hourly=wind_speed_10m,wind_direction_10m
  &forecast_days=2
```

- 予報の日時・モデル・取得時刻を保持し、**予報の期限切れ**を表示。
- `ocean_current_velocity` 等はAPIレスポンスの**units**を読み、km/h・m/s・ノットを間違えない。方向の解釈（向かう方向／来る方向）を仕様に沿って変換する。
- Marine APIは沿岸付近の精度に限界があり、**沿岸航行ナビゲーションに使えない旨をUIへ常設**。
- 非商用無料利用などの利用規約・クレジット表示を公開前に再確認。

## 5. 画面設計

### 5.1 画面一覧（Streamlit Multi-page またはタブ）

| 画面ID | 表示名 | 目的 | 優先 |
|---|---|---|---|
| S-01 | `Demo` | 審査員向け1クリックデモ | MUST |
| S-02 | `Ocean Map` | NASA Chl-a・SST・OBISの地図重ね合わせ | MUST |
| S-03 | `Trend Explorer` | NASA時系列トレンド解析と有意性 | MUST |
| S-04 | `Route Lab` | 航路2本の燃料試算・海況比較 | MUST（簡易版） |
| S-05 | `Presentation` | 7枚以内の発表スライド | MUST |
| S-06 | `About & Data` | データ出典、観測日時、解析方法、制約 | MUST |

### 5.2 S-01 Demo

- **CTA**「Run Demo」をクリックすると、初期海域、初期魚種、月別NASAデータ、航路モデルのサンプルを選択する。
- デモストーリー（約60～90秒操作）：
  1. 対象海域を表示。
  2. Chl-a分布を切替表示。
  3. クロマグロの過去出現点を重ねる。
  4. `Trend Explorer`でNASA由来時系列、傾き・p値を示す。
  5. `Route Lab`で最短ルートと海況配慮ルートの**仮定付き燃料試算**を比較。
  6. 最後に社会的価値と科学的限界を説明。
- 外部APIを呼ばなくても動く**事前キャッシュモード**をデフォルトにする。
- デモ時は「データ最終更新」「観測期間」「実データ／シミュレーション」を常時表示。

### 5.3 S-02 Ocean Map

**上部コントロール**

- 海域：プリセット（北海道南部、比較対象海域）＋BBox任意指定（後回し可）。
- 魚種：学名付きドロップダウン。
- 観測時期：月・年スライダー（データが存在する範囲に限る）。
- 主レイヤー：`Sea Surface Temperature` / `Chlorophyll-a`。
- オーバーレイ：`Historical Fish Occurrences`（ON/OFF）。
- 凡例：単位、値の意味、欠損値を視覚的に区別。

**地図**

- Mapbox APIキー不要な構成を優先。`pydeck`はベースマップのトークン要否を環境で確認し、必要ならPlotlyやFolium等へ変更。
- 格子色、出現記録点、調査エリア、候補地点を描画。
- 空間解像度の粗いNASAデータを細かい点に擬似補間して「高精度」に見せない。
- 最小データ量：ハッカソンでは対象BBoxを前処理した軽量ファイルとする。

### 5.4 S-03 Trend Explorer

**入力**：NASA変数、海域、開始年／終了年、月次／年次表示、季節調整ON/OFF（初期は年次または月ごとの季節性を考慮）。

**出力**：

1. 時系列の実測集計値の折れ線グラフ（観測数、欠損を表示）。
2. 線形トレンド線および95%信頼区間（実装可能なら）。
3. KPI：平均値、傾き／年、p値、観測点数、観測期間、有意判定、データ被覆率。
4. 説明文：「この領域の〇〇は、観測期間中、推定〇〇/年で変化しています。統計的有意性は…」
5. 注意書き：統計的有意＝生態学的・実用上の重要性ではない。衛星欠損、自己相関、季節変化が推定に影響。

**有意性ラベル**

- `SIGNIFICANT`：事前定義した検定手法で `p < 0.05`、サンプル数・データ品質条件を満たす。
- `NOT SIGNIFICANT`：条件は満たすが `p >= 0.05`。
- `INSUFFICIENT DATA`：観測点不足、欠損過多、同一値のみ、解析不能等。
- 有意差なしを「変化なし」と断定しない。

### 5.5 S-04 Route Lab

**入力**：

- 出港地点（デモでは仮定の洋上出発点または検証済み港からの概略位置）。
- 目標地点（候補地点）。
- 船速 `speed_knots`、基本燃料消費 `fuel_liters_per_hour`、燃料単価 `yen_per_liter`。
- 予報日時と、比較対象ルート2本（距離優先／海況優先）。

**出力**：

- 2本のルートの概略線、距離km、推定所要時間h、推定燃料L、推定燃料費円。
- 参照した予報日時・波高・風・海流の簡潔なサマリー。
- 危険判定ではなく、「強い波／風の条件があるため注意」とする説明。安全保障ではない。
- すべてに「**Experimental estimation — not for navigation**」「**試算であり航行・安全判断には使用不可**」を常時表示。

**UI上の工夫**：異なる海況による削減差がモデル上生じない場合も、そのまま0%または同等と表示する。恣意的に『10%削減』など演出しない。

### 5.6 S-05 Presentation

公開アプリと同じURLで見られる**最大7枚**のスライド。別の会員登録・認証は不要。日本語本文でも可能だが、審査員向けに英語タイトル／英語の要点を併記することを推奨。

| 枚数 | タイトル（英語） | 内容 |
|---:|---|---|
| 1 | FishShift — Find Fish. Save Fuel. Understand Our Oceans. | タイトル、対象課題、短い価値提案 |
| 2 | The Problem | 漁場選択の不確実性、海洋環境変化、燃料費 |
| 3 | Our Solution | 4ステップのユーザー体験、地図スクリーンショット |
| 4 | Powered by NASA Data | SST・Chl-aと出典、OBIS、気象データの役割 |
| 5 | Discovering Ocean Trends | 実データに基づく時系列・傾き・p値・分析結果 |
| 6 | Fish Habitats & Route Comparison | 魚種実績の重ね合わせと燃料シミュレーション、限界 |
| 7 | Impact & What's Next | 課題適合性、社会的価値、今後の検証計画 |

**禁止**：スライドを8枚以上にしない。動画方式を選ばない限り30秒字幕付き動画の制作は不要。もし動画方式へ切り替えるなら、最大30秒・英語字幕必須・未成年の声／氏名／肖像なしで制作し、スライドとの選択条件を再確認する。

### 5.7 S-06 About & Data

- 各データの実名・プロダクト・期間・取得元・加工手法・更新日時。
- NASA Earthdataとその他のライセンス・謝辞。
- 出現点の観測偏り、クロロフィルと魚群分布の違い、予報限界、解析の統計的仮定。
- デモでは使用した地図／航路の「実測／推定／仮想」属性を一覧化。

## 6. データモデル／ファイル仕様

### 6.1 格納方針

- デモ用の**小さな実データスナップショット**をGit管理する（サイズ／ライセンスに注意）。
- 元の巨大NetCDFはリポジトリ管理外。`data/raw/` は `.gitignore` 対象。
- `data/processed/` 以下に `parquet / csv / geojson` と `provenance.json` を格納。
- 現在時刻／外部API呼び出しに依存せずデモを再現できるようにする。

### 6.2 型定義（Pydanticまたはdataclassで実装）

```python
class Region:
    id: str
    name_ja: str
    bbox: tuple[float, float, float, float]  # west, south, east, north

class OceanObservation:
    region_id: str
    variable: str           # "sst" | "chlor_a"
    observed_month: str     # YYYY-MM
    latitude: float
    longitude: float
    value: float | None
    unit: str               # "degC" | "mg/m3"
    dataset_id: str
    is_valid: bool

class FishOccurrence:
    species_scientific_name: str
    observed_at: str | None # ISO8601 or YYYY-MM-DD
    latitude: float
    longitude: float
    source: str             # "OBIS"
    record_id: str | None
    dataset_id: str | None

class TrendResult:
    variable: str
    region_id: str
    start_month: str
    end_month: str
    n: int
    slope_per_year: float | None
    slope_unit: str
    p_value: float | None
    ci95_low: float | None
    ci95_high: float | None
    significant: bool | None
    status: str             # significant | not_significant | insufficient_data
    method: str
    coverage_ratio: float

class RouteEstimate:
    route_id: str
    is_simulation: bool
    points: list[tuple[float, float]]
    distance_km: float
    duration_h: float
    estimated_fuel_l: float
    estimated_fuel_cost_jpy: float
    weather_reference_time: str | None
    assumptions: list[str]
    limitations: list[str]
```

### 6.3 証跡メタデータ例

```json
{
  "dataset_id": "REPLACE_WITH_VERIFIED_REAL_DATASET_ID",
  "provider": "NASA OB.DAAC",
  "variable": "chlor_a",
  "unit": "mg/m3",
  "source_url": "REPLACE_WITH_ACTUAL_DATA_PRODUCT_URL",
  "observation_start": "YYYY-MM",
  "observation_end": "YYYY-MM",
  "retrieved_at_utc": "YYYY-MM-DDTHH:MM:SSZ",
  "processing": "regional monthly valid-pixel summary",
  "license_note": "verify before publication",
  "data_kind": "observed"
}
```

**注意**：JSONはスキーマ例。プレースホルダーを実データと誤表示して公開しない。海域集約では海面マスク・QCフラグ・有効画素数・面積加重の必要性を記録。

## 7. 分析アルゴリズム

### 7.1 NASAトレンド解析（MUST）

**入力**：同一プロダクト由来の `timestamp`, `value`, `quality` の時系列。

1. 取得元のFillValue、無効フラグ、明らかな範囲外値を除外。
2. 同じ集計範囲・月に対する値を集約。Chl-aは分布の歪みが大きいため、地域内中央値・幾何平均などの選択根拠を表示。`log10(chl_a)`で検定する場合は、**検定上の傾きの単位と表示値の解釈が変わる**ことを明示する。
3. 月次データでは季節性と自己相関に注意。**MVPのデフォルトは年平均（最低8年以上を推奨）または月別季節偏差**にし、解析に使用する系列を明示。年平均を使う場合は有効月が一定数未満の年を除外（例：12か月中9か月以上。ただし閾値は設定可能）。
4. SciPy `linregress`等で傾き／年・p値・近似95%信頼区間を求める。時間軸は連続年表現で処理。
5. `n`, `coverage_ratio`, `slope`, `p`, `CI` を返す。検定不可なら `insufficient_data`。
6. `p < 0.05` は例示的な判定基準であり、サンプル数が少ない・自己相関が強い場合に過大評価の可能性があることを表示。
7. 少なくとも**2海域×1変数**、または**1海域×2変数**の比較ができる設計にする。

疑似コード：

```python
def compute_trend(years: list[float], values: list[float]) -> TrendResult:
    # 1) filter NaN/Inf, ensure paired values and time order
    # 2) check quality & minimum sample count
    # 3) slope, intercept, r, p, stderr = scipy.stats.linregress(years, values)
    # 4) compute 95% CI using t critical value and stderr
    # 5) return typed result, including method and caveats
    ...
```

**決して**ランダムデータで公式課題の「有意な変化」を実証したように見せない。

### 7.2 魚種別環境適合スコア（SHOULD）

海域セルごとに：

```text
HabitatScore = 100 × (wT × TemperatureSuitability
                     + wC × ChlorophyllContext
                     + wH × HistoricalOccurrenceContext)
```

- 初期重みの例：`wT=0.4`, `wC=0.35`, `wH=0.25`（合計1）。**未検証のデモ係数**であり、実際の生息確率ではない。
- スコア名は `Exploratory Habitat Index` / `探索用環境適合指数`。
- 魚種別の適温は科学的根拠の出典が確認できる場合に限り設定し、未確認なら適温スコアを無効化して表示する。
- OBIS点の多寡をそのまま生息密度に変換しない。観測努力量の偏りに注意。
- スコアに信頼度やデータ欠損警告を添える。

### 7.3 航路の比較（MUST：試算モデル）

対象：**ユーザーが指定する仮の海上出発点と目標点**。実際の港からの航行を提示するなら、安全確認済みの航路網を別途要するため、MVPは**地理的な安全性を保証しない単純な洋上サンプル線**とする。

- `Route A`：海上に限定したサンプル最短系ライン（陸地交差チェックが未実装なら**実地図の航行可能航路として描かない**）。
- `Route B`：サンプル迂回ライン。代表地点の海況を参照し、海況への露出を比較。
- `haversine`などで各区間の距離を計算。
- 基本モデル：`fuel_liters = Σ(distance_km / effective_speed_kmh × fuel_rate_lph)`。
- `effective_speed`は船速と海流の**進行方向成分**の簡易加算などで推定できるが、風・波影響は校正済みの船舶性能モデルがない限り、**仮定した係数**で感度分析として示す。
- 比較時に「仮定した波浪抵抗係数／燃費／船速」を常時表示する。
- 経路A/Bに実データが欠ける区間があれば、その区間を無理に補間せず `coverage_warning` を表示する。
- 燃料費は `fuel_liters × yen_per_liter`。船速ノットは `1 knot = 1.852 km/h` に換算。
- 安全性、航路標識、法的制限、浅瀬、潮流・風向等の高度考慮は対象外。

### 7.4 最適化の範囲（明確化）

**MVPでは、厳密なグローバル最適航路は計算しない。** 2本の予め定義した海上サンプルルートに対して同一条件で燃料試算を行う。UIでは「Route comparison」と表現し、「guaranteed optimal route」は使用禁止。将来版でA*等の海域グラフ最適化を検討する。

## 8. プログラム構成

```text
fishshift/
├── README.md
├── DESIGN.md                          # 本設計書
├── requirements.txt
├── .gitignore
├── .streamlit/
│   └── config.toml
├── app.py                             # Streamlit entry point
├── src/
│   ├── __init__.py
│   ├── config.py                       # 地域、魚種、環境変数、モデル係数
│   ├── schemas.py                      # 型定義
│   ├── sources/
│   │   ├── nasa.py                     # NASAデータ読込・プロダクトメタデータ
│   │   ├── obis.py                     # OBISクライアント
│   │   └── open_meteo.py               # 気象海況クライアント
│   ├── processing/
│   │   ├── grids.py                    # 海域格子、QC、領域集計
│   │   ├── trends.py                   # 時系列・統計検定
│   │   ├── habitats.py                 # 探索用環境指数（任意）
│   │   └── routes.py                   # 距離・燃料試算
│   ├── repository/
│   │   └── snapshot.py                 # Parquet/GeoJSON/metadata読込
│   └── ui/
│       ├── components.py               # 共通凡例・注意事項・データ出典
│       └── pages/
│           ├── demo.py
│           ├── ocean_map.py
│           ├── trend_explorer.py
│           ├── route_lab.py
│           ├── presentation.py
│           └── about.py
├── scripts/
│   ├── discover_datasets.py           # NASAプロダクト調査・ログ
│   ├── prepare_nasa.py                # NASAファイル→軽量スナップショット
│   ├── prepare_obis.py                # OBIS→GeoJSON
│   ├── prepare_weather.py             # 海況予報サンプル取得
│   ├── validate_provenance.py         # メタデータ・実データ整合チェック
│   └── make_slides.py                 # 7枚のスライド生成（可能なら）
├── data/
│   ├── metadata/
│   │   ├── datasets.yaml
│   │   └── provenance.json
│   ├── processed/                      # リポジトリ同梱可能な小規模データ
│   │   ├── ocean_timeseries.parquet
│   │   ├── ocean_map.parquet
│   │   ├── fish_occurrences.geojson
│   │   └── route_weather.json
│   └── raw/                            # 非公開／Git追跡しない
├── assets/
│   └── slides/                         # スライド画像またはPDF
└── tests/
    ├── test_trends.py
    ├── test_routes.py
    ├── test_sources.py
    ├── test_provenance.py
    └── test_app_smoke.py
```

**注意**：上記 `data/processed` のファイル名は成果物の規約であり、設計時点でファイルが存在するという意味ではない。ソースデータの利用条件に従って公開する。

## 9. モジュール間インターフェース

```python
# src/repository/snapshot.py
load_regions() -> list[Region]
load_ocean_map(region_id: str, variable: str, observed_month: str) -> DataFrame
load_ocean_timeseries(region_id: str, variable: str) -> DataFrame
load_fish_occurrences(species: str, region_id: str) -> DataFrame
load_route_weather(scenario_id: str) -> dict
load_provenance(dataset_id: str) -> dict

# src/processing/trends.py
aggregate_to_annual(monthly_df: DataFrame, min_months_per_year: int = 9) -> DataFrame
compute_trend(annual_df: DataFrame, variable: str, region_id: str) -> TrendResult

# src/processing/routes.py
calculate_route_distance_km(points: list[tuple[float, float]]) -> float
estimate_route_fuel(route: list[tuple[float, float]], vessel: dict,
                    conditions: dict, assumptions: dict) -> RouteEstimate
compare_routes(a: RouteEstimate, b: RouteEstimate) -> dict
```

**座標と型**：コード内部では座標を `(latitude, longitude)` とし、GeoJSONにシリアライズするときは必ず `[longitude, latitude]`。BBoxは `(west, south, east, north)`。混同を防ぐ単体テストを書く。

### 9.1 エラー処理

- API timeout / 429 / 5xx：指数バックオフ付きの最大3回リトライを**取得バッチ側だけ**で行う。
- 公開アプリ：API障害でも事前スナップショットを表示。無い場合は理解可能なエラーを表示して落ちない。
- 統計不能：データ不足を明示。NaNやゼロを実際のp値として表示しない。
- データ欠損：色なしで表示。0と欠損を区別。
- 認証トークン・APIキーは公開リポジトリに含めない。
- データキャッシュが古い場合は、**最終更新日と観測／予報日時**を表示。

## 10. UI・UX仕様

- メインカラー：ディープネイビー×海の青緑。読みやすさ優先。凡例は色覚多様性を考慮。
- PC（1280px以上）中心で作成、スマホは最低限閲覧できる。
- 全画面共通：製品ロゴ、ページ名、データ取得日、観測データ／予報／シミュレーションのラベル。
- 日本語はわかりやすい言葉（例：「統計的有意性とは？」の説明ポップアップ）。
- **初期ロードで画面が真っ白にならない**。最初からキャッシュ済みデモデータをロード。
- GIS描画重すぎ防止：海域の低解像度スナップショット、出現点数の上限、`st.cache_data`。
- グラフは軸・単位・期間・ソース・欠損の説明を付ける。
- 実測とモデル値を同じ色・凡例で表示しない。

## 11. テスト設計（pytest）

### 11.1 数理・データ

| ID | 試験 | 期待結果 |
|---|---|---|
| T-01 | 明確な右上がりの既知系列で線形回帰 | 傾きが既知値と一致 |
| T-02 | 定数系列／データ2点以下／欠損過多 | `INSUFFICIENT DATA`。例外でUIが落ちない |
| T-03 | 緩やかなノイズ付き系列 | p値とCIがSciPy計算と整合 |
| T-04 | 年次集計の必要月数未満 | 該当年を欠損扱い |
| T-05 | 経度・緯度の変換 | GeoJSONのlon/lat順が正しい |
| T-06 | クロロフィル欠損・海面マスク | 0として扱わず欠損にする |
| T-07 | OBIS記録重複・異常座標 | 除外件数がログ化 |
| T-08 | 既知距離の2地点 | 距離計算が許容誤差内 |
| T-09 | ノット→km/h | 1 knot = 1.852 km/h |
| T-10 | 同条件の2同距離ルート | 同じ燃料消費量になる |
| T-11 | 波浪係数等の仮定を変更 | 試算が一貫して更新され仮定が表示 |
| T-12 | provenance欠落 | 公開アプリの「実データ」表示を禁止 |

### 11.2 デモ・公開

| ID | 試験 | 期待結果 |
|---|---|---|
| U-01 | アプリ初回起動 | デモ画面が開く |
| U-02 | ネット接続が不安定 | キャッシュ済み実データでデモが継続 |
| U-03 | 魚種切替 | 出現点／件数が連動し、空データも正常 |
| U-04 | SST/Chl-a切替 | 凡例・単位・出典が連動 |
| U-05 | 地域／期間変更 | 時系列・傾き・有意性が再計算 |
| U-06 | 航路比較 | 距離／時間／燃料／仮定を2ルートで表示 |
| U-07 | Presentation | 7枚以下、タイトル含む |
| U-08 | シークレットブラウザで公開URL | 無料閲覧・ログイン不要・権限要求なし |
| U-09 | 新規ユーザー（別ブラウザ） | Demo、Trend、Route、Presentationを操作できる |
| U-10 | 提出文 | **外部リンクが1件だけ** |
| U-11 | 個人情報レビュー | 18歳未満の人物の氏名・声・肖像なし |

## 12. 公開・デモ・提出手順

1. GitHub等にコードを置く（`.env`、Earthdata認証、APIシークレットを**コミットしない**）。
2. Streamlit Community Cloud等の公開可能なホスティングへ `app.py` をデプロイ。無料枠や公開仕様・スリープ・ファイルサイズ制約を事前確認。
3. デモには**前処理済みの実データ**を同梱し、公開環境からNASAへ認証付きデータを取りに行かない。
4. ホームに `Run Demo` と `Presentation (7 slides)` の導線を設ける。
5. 公開アプリのURLを**一つだけ**提出する。スライドPDFは必要なら**そのアプリ内で**表示またはダウンロードできるようにする。
6. ブラウザのシークレットウィンドウで開き、別アカウントやログインを要求されないことを確認。
7. スライドの枚数・出典・データラベル・年齢関連個人情報・リンク数を最終チェック。
8. 公開サイトのWebフィルタ分類が可能なら申請。

**実公開前の必須注意**：Streamlit／GitHub／公開先の利用規約と、NASA/OBIS/Open-Meteoのデータ再配布・表示・クレジット要件を確認。NASA由来のデータであっても各データ製品に付属する利用条件を尊重する。

## 13. 開発順序（Claude Codeにこの順番を厳守させる）

| フェーズ | タスク | 成果物 | 完了の定義 |
|---|---|---|---|
| P0 | リポジトリ初期化、依存ライブラリ、型定義 | `app.py`, `src/`, `tests/` | Streamlit起動、pytest実行 |
| P1 | NASAプロダクト調査と**実データ取得** | `datasets.yaml`, NOAA/NASAではなく**NASA由来**時系列スナップショット | 出典確認済みNASA観測系列が複数年分存在 |
| P2 | Trend Explorer完成 | 時系列・傾き・p・CI UI | 公式課題の要件をデモ可能 |
| P3 | Ocean Map＋OBIS | SST/Chl-aレイヤー、出現点 | 選択魚種の出現記録の重ね合わせ |
| P4 | Route Lab | 2ルート燃料比較 | 計算過程と仮定表示 |
| P5 | Demo／Presentation | 1クリックデモと7枚 | 一つの公開アプリ内でアクセス可能 |
| P6 | テスト／デプロイ／公開検証 | 公開URL（1件） | 未ログインで使用可能、全チェック通過 |

### 13.1 時間が足りない場合の削減順

1. AIチャット、LLM連携、魚種自動予測を削除。
2. 魚種は1種でデモし、選択可能UIと将来追加の設計を残す。
3. 航路は保存済み予報＋仮想の2ルートのみに限定。
4. マップは1海域・2変数・1期間に限定。
5. **NASAトレンド分析とデモ・公開要件は絶対に削らない。**

## 14. Claude Codeへの実装指示（コピペ用）

```text
あなたは上級Pythonエンジニア兼データサイエンティストです。
リポジトリ内の DESIGN.md を必ず最初から最後まで読んでください。
その内容を唯一のプロダクト設計仕様として、FishShiftを実装してください。

優先順位：
1. NASA公式課題「Be An Earth System Trend Detective!」への適合。
   NASAデータの実測時系列、年あたりの変化率、p値／信頼区間、科学的な限界を示す。
2. Chl-a / SST の地図、魚種別OBIS過去出現記録。
3. 2ルートの燃料消費シミュレーション。
4. デモ、7枚以内のスライドを同じ公開Webアプリ内に統合。

絶対に守ること：
- 実在しないデータ・API・取得結果を捏造しない。
- NASAデータのプロダクト情報を実際に検証し、出典メタデータを残す。
- 外部API不可時は保存済み実データでデモを動かす。作成した架空データにはSimulationと明示。
- OBIS過去出現点を現在の魚群位置と呼ばない。
- 航路比較は試算であり、実航海への利用を禁止する注意書きを表示する。
- 認証やパスワードが必要な公開アプリを作らない。
- 提出用リンクは1件を前提に、デモと最大7枚の発表資料をアプリに含める。
- 18歳未満の人物の氏名・声・肖像を含めない。
- 秘密情報をコミットしない。
- Python 3.12、Streamlit、pandas、xarray、SciPy、Plotly等のシンプルな構成を採用する。
- 必須機能の実装後にpytestを通し、READMEに実行・前処理・デプロイ手順を記載する。

まずP0/P1を実施し、検証できたデータ製品と不足点をREADMEに明記してからP2へ進んでください。
実装時に未確定の事柄は科学的に保守的なデフォルトを選択し、未検証事項をTODOとして残してください。
```

## 15. Done（完成判定）

**以下すべてを満たしたら提出可能。**

- [ ] NASA由来と検証できる**実観測**変数（少なくとも1件）の複数年時系列を表示。
- [ ] 選択した変数／海域について変化率、p値／95%CI、観測数、解釈を表示。
- [ ] Chl-aとSSTの地図表示が機能する（未取得なら未取得として正直に表示し、審査に必要な実データは確保）。
- [ ] 魚種を選び、OBIS出現点を表示。現在の魚群位置と混同させない。
- [ ] 航路2本の比較に試算条件・燃料コスト・安全免責を表示。
- [ ] `Demo`が外部認証・API障害なしで成立。
- [ ] タイトル含め発表スライド**最大7枚**。
- [ ] 公開URLは**1件**、ログインなし・許可なし・パスワードなしで閲覧可能。
- [ ] 18歳未満の人物の名前・声・肖像を含めない。
- [ ] pytestの主要テスト通過、ソース・単位・観測期間・クレジット明記。

---

## 16. 一次資料・仕様参照

1. [NASA Space Apps Challenge 2026: Be An Earth System Trend Detective!](https://www.spaceappschallenge.org/2026/challenges/earth-system-trend-detective/) — 公式課題の目的・統計解析要件。
2. [NASA Open Data Portal](https://data.nasa.gov/) — NASA公開データカタログ。
3. [NASA Earthdata Search](https://search.earthdata.nasa.gov/) — 地球観測データの検索。
4. [NASA Open APIs](https://api.nasa.gov/) — NASA API一覧（本MVPの海洋データの主要取得手段ではない）。
5. [NASA Ocean Color](https://oceandata.sci.gsfc.nasa.gov/) — 海色・Chl-a観測データ。
6. [NASA Ocean Color Level-3 Browser](https://oceandata.sci.gsfc.nasa.gov/l3/order/) — 時系列用製品の検索・抽出。
7. [NASA official: Access Data from the Ocean Color Instrument](https://nasa.github.io/oceandata-notebooks/notebooks/oci/oci_data_access.html) — `earthaccess`を使う例と認証説明。
8. [OBIS API v3](https://api.obis.org/) — 海洋生物出現記録API。
9. [OBIS Manual: Access](https://manual.obis.org/access.html) — API利用と出現データの注意点。
10. [Open-Meteo Marine Weather API](https://open-meteo.com/en/docs/marine-weather-api) — 波・海流・水温予報、沿岸精度の制限。
11. [Open-Meteo Weather API](https://open-meteo.com/en/docs) — 風速・風向。

**更新ポリシー**：実装時に参照した製品ID・取得日時・使用条件・APIパラメータを再確認し、データプロダクト決定後にこの設計書の未確定項目を更新すること。
