/**
 * Japanese dictionary -- the source of truth for the key space.
 *
 * `en.ts` is typed against this object, so a key added here fails the build
 * until its English counterpart exists. Keys are flat and dot-separated so
 * that `keyof` stays exhaustive and every key is greppable.
 *
 * Entries are either a plain string (static label) or a function taking
 * pre-formatted string params (interpolated sentence). Numeric formatting is
 * decided once in format.ts, never inside a dictionary.
 */
export const ja = {
  'app.documentTitle': 'FishShift — 海洋トレンド解析・省燃料漁場探索',
  'app.metaDescription':
    '衛星海洋観測（SST / Chl-a）・OBIS魚種出現履歴・海況予報を統合し、海洋トレンド解析と省燃料航路比較を可視化する水産・海洋意思決定プロトタイプ',
  'app.footer.attribution':
    'SST・Chl-a: NASA地球観測データ（JPL MUR L4 / OB.DAAC MODIS-Aqua） ・ 魚類出現: OBIS実測 / 海流・波高・風: 推定値（実航海判断には使用不可）',

  'format.year': (p: { year: string }) => `${p.year}年`,
  'format.yearMonth': (p: { year: string; month: string }) => `${p.year}年 ${p.month}`,
  'format.yearRange': (p: { from: string; to: string; span: string }) =>
    `${p.from}年 – ${p.to}年（${p.span}年間）`,

  'region.tsugaru.shortName': '北海道南部',
  'region.tsugaru.port': '函館沖 仮想出港点',
  'region.tsugaru.description':
    '対馬暖流系の津軽暖流と親潮系冷水が交差する実験対象海域（設計書サンプルBBox: 40.5–43.0°N, 139.5–143.0°E）。',
  'region.sanriku.shortName': '三陸沖',
  'region.sanriku.port': '気仙沼沖 仮想出港点',
  'region.sanriku.description':
    '暖水塊（黒潮続流）と寒流（親潮）が衝突し、明瞭な潮目と植物プランクトン増殖帯が形成される比較海域。',

  'species.thunnus_orientalis.forageNote':
    '潮目周辺のイワシ・スルメイカ等の餌生物（高次捕食対象）が集まりやすい水温前線域に過去の回遊記録が集中。',
  'species.oncorhynchus_keta.forageNote':
    '親潮系の冷水域と基礎生産が高い混合域に分布する傾向。高水温化による分布域の北上傾向の検証対象。',
  'species.sardinops_melanostictus.forageNote':
    '植物プランクトン（Chl-a高濃度帯）を直接・間接的に利用する小型浮魚類。大型魚の餌密集ポイントの指標候補。',

  'hotspot.descriptor.primaryFront': '最有力潮目',
  'hotspot.descriptor.planktonFront': 'プランクトン前線',
  'hotspot.descriptor.offshoreReference': '沖合比較点',
  'hotspot.descriptor.generic': '追加候補',
  'hotspot.fullLabel': (p: { letter: string; descriptor: string }) =>
    `候補ポイント ${p.letter}（${p.descriptor}）`,
  'hotspot.rationale': (p: {
    species: string;
    lo: string;
    hi: string;
    sst: string;
    chl: string;
  }) =>
    `${p.species}の参照適温帯（${p.lo}–${p.hi}°C）に対し実観測値 ${p.sst}°C、Chl-a ${p.chl} mg/m³ が重なる境界域。`,
  'hotspot.indexShort': '指数',

  'route.a.label': 'Route A: 最短距離優先ライン',
  'route.b.label': 'Route B: 海流・波浪配慮ライン',
  'route.caution.calm': '海況は比較的穏やかな試算条件です。',
  'route.caution.roughSeas': (p: { maxWave: string; avgWind: string }) =>
    `最大波高 ${p.maxWave} m / 平均風速 ${p.avgWind} m/s の区間あり。波浪抵抗と安全余力に注意。`,
  'route.caution.favorableCurrent': (p: { assist: string }) =>
    `順流成分（平均 ${p.assist} kt）を活用する軌道。`,
  'route.caution.adverseCurrent': (p: { assist: string }) =>
    `逆流区間（平均 ${p.assist} kt）により対地速度低下。`,

  'source.withDistribution': (p: { lead: string; distribution: string }) =>
    `${p.lead}（配信: ${p.distribution} 経由）`,

  'map.heading': '海洋環境・餌場予測探索マップ',
  'map.subtitle.data': 'SST・Chl-a: NASA地球観測データ（衛星実観測・事前取得） / 海流・波高・風: 推定値',
  'map.subtitle.region': (p: { region: string }) => `対象海域: ${p.region}`,
  'map.subtitle.obisCaveat': 'OBIS出現点は過去の報告記録であり現在の魚群位置ではありません',
  'map.cta.routeLab': '選択ポイントへ省燃料ルート試算',
  'map.control.region': '対象海域（プリセット）',
  'map.control.species': '対象魚種（OBIS学名基準）',
  'map.control.baseLayer': '衛星・解析ベースレイヤー',
  'map.control.overlays': '重ね合わせレイヤー',
  'map.control.timeSlider': '観測年月スライダー',
  'map.slider.year': '年',
  'map.slider.month': '月',
  'map.layer.sst': '海面水温',
  'map.layer.habitat': '適合指数',
  'map.overlay.obis': (p: { count: string }) => `OBIS 実測出現記録 (${p.count}点)`,
  'map.overlay.obisEmpty':
    'この海域・種のOBIS実測記録は0件です。表示点を増やすための補完は行っていません。',
  'map.overlay.currents': '海流ベクトル (流速・流向)',
  'map.overlay.routes': '比較航路サンプル線 (A/B)',
  'map.disclaimer':
    '欠損（雲域等）は透明ハッチで区別表示し、0として補間していません。適合指数は未検証の探索用モデル値です。',
  'map.legend.sst.title': '海面水温 SST (°C)',
  'map.legend.chlorA.title': 'クロロフィルa濃度 (mg/m³)',
  'map.legend.habitat.title': '探索用環境適合指数 (0–100)',
  'map.legend.observed': (p: { source: string }) => `実観測: ${p.source}`,
  'map.legend.habitatSource':
    '探索用合成指数 (0.40×水温 + 0.35×Chl-a + 0.25×環境適合) — 実観測SST/Chl-aから算出',
  'map.legend.missing': '□ 欠損(雲)',
  'map.probe.missingCloud': '欠損(雲)',
  'map.probe.missing': '欠損',
  'map.probe.current': '海流',
  'map.probe.wave': '波高',
  'map.probe.hint': 'マップ上でカーソル移動すると詳細値を計測',
  'map.key.obis': 'OBIS過去記録',
  'map.key.routeA': 'Route A (最短)',
  'map.key.routeB': 'Route B (海況配慮)',

  'route.safety.label': 'Experimental estimation — not for navigation:',
  'route.safety.body':
    '本画面は2本の定義済み洋上サンプル線に対するモデル試算比較であり、陸地・浅瀬・航路標識・法規を考慮した実航海ナビゲーションには使用できません。',
  'route.modelNote': '1 knot = 1.852 km/h · 試算モデル',
  'route.provenance.label': '本画面の入力データ:',
  'route.provenance.lead': '海流・波高・風（',
  'route.provenance.emphasis': 'NASA由来ではないパラメトリック推定値',
  'route.provenance.mid': '）は',
  'route.provenance.tail':
    'です。沖合距離と季節から算出しており、同等の月次NASAプロダクトが本解像度で存在しないための代替です。所要時間・燃料消費・燃料費はこの推定値に依存するため、',
  'route.provenance.relative': '絶対値ではなく2航路間の相対比較',
  'route.provenance.close':
    'としてのみ解釈してください。なお目標地点の座標は、NASA実観測のSST/Chl-aから抽出された候補ポイントに基づきます。',
  'route.panel.conditions': '試算条件・船舶パラメータ',
  'route.panel.port': '仮想出港点',
  'route.panel.target': '目標候補ポイント',
  'route.vessel.speed': '基準船速',
  'route.vessel.fuelRate': '基本燃料消費率',
  'route.vessel.fuelPrice': '燃料単価 (A重油/軽油想定)',
  'route.vessel.waveDrag': '仮定波浪抵抗感度 (α)',
  'route.mvpNote':
    'MVP仕様として、グローバルA*最適化ではなく2本の定義済みサンプル航路を同一海況・仮定係数のもとで比較します。',
  'route.delta.fuel': '推定燃料差 (Route B − Route A)',
  'route.delta.fuelBetter': '試算条件下ではRoute Bが低燃費',
  'route.delta.fuelWorse': '迂回距離によりRoute Bが同等または増加',
  'route.delta.cost': '推定燃料費差額',
  'route.delta.costBasis': (p: { price: string }) => `単価 ${p.price} 円/L 基準（片道試算）`,
  'route.delta.time': '所要時間差',
  'route.delta.timeNote': '順流成分と波浪減速の両方を反映',
  'route.preview.title': '航路サンプル比較プレビュー',
  'route.preview.legend': '波高背景 + 海流ベクトル',
  'route.preview.port': '出港点',
  'route.preview.target': '目標海域',
  'route.table.title': '航路別シミュレーション比較表',
  'route.table.metric': '比較項目',
  'route.table.routeA': 'Route A (最短)',
  'route.table.routeB': 'Route B (配慮)',
  'route.table.distance': '航行距離',
  'route.table.duration': '推定所要時間',
  'route.table.fuel': '推定燃料消費',
  'route.table.cost': '推定燃料費',
  'route.table.wave': '平均 / 最大波高',
  'route.table.assist': '平均海流アシスト',
  'route.finding.a': 'Route A 所見:',
  'route.finding.b': 'Route B 所見:',
  'route.footnote':
    '※ 上表の波高・海流アシスト、およびそれらに依存する所要時間・燃料・費用は推定値（NASA由来ではない）です。',
  'unit.jpy': '円',
  'unit.jpyPerLiter': '円/L',
  'unit.jpyPrefixed': (p: { amount: string }) => `¥${p.amount}`,

  'trend.heading': '海洋トレンド統計解析 (Trend Explorer)',
  'trend.subtitle.challenge': '対象課題: NASA Earth System Trend Detective',
  'trend.subtitle.region': (p: { region: string }) => `海域: ${p.region}`,
  'trend.subtitle.method': (p: { method: string }) => `手法: ${p.method}`,
  'trend.subtitle.source': (p: { source: string }) => `出典: ${p.source}`,
  'trend.method.annual': 'OLS 年次線形回帰 (有効月 ≥ 9/12)',
  'trend.method.monthly': 'OLS 月次線形回帰（季節変動含む）',
  'trend.explain.toggle': '統計的有意性とは？',
  'trend.explain.title': 'p値と95%信頼区間の読み方（科学的な注意点）',
  'trend.explain.body':
    'p値 < 0.05（SIGNIFICANT）は「観測期間中に傾きがゼロであるという帰無仮説のもとでは起こりにくい変化が見られる」ことを示しますが、生態学的な重要性や将来の継続を直接保証するものではありません。また、月次データでは季節周期や時間的自己相関によりp値が小さく見えやすいため、本画面では年次平均（有効月 9か月以上）を標準の傾向検定として推奨しています。',
  'trend.control.variable': '解析変数 (NASA観測)',
  'trend.control.region': '対象海域',
  'trend.control.aggregation': '時間集計',
  'trend.control.startYear': '解析開始年 (〜2025年)',
  'trend.variable.sst': '海面水温 SST',
  'trend.variable.chlorA': 'クロロフィルa',
  'trend.mode.annual': '年平均 (推奨)',
  'trend.mode.monthly': '月次推移',
  'trend.kpi.slope': '年あたり線形傾き',
  'trend.kpi.slopeUnit': (p: { unit: string }) => `${p.unit}/年`,
  'trend.kpi.significance': '統計的有意性 (p値)',
  'trend.kpi.mean': '期間平均値',
  'trend.kpi.rSquared': (p: { value: string }) => `決定係数 R²: ${p.value}`,
  'trend.kpi.coverage': '有効観測数 / 衛星被覆率',
  'trend.kpi.coverageDetail': (p: { percent: string }) => `平均有効画素被覆率: ${p.percent}`,
  'trend.status.significant': '統計的に有意な傾向 (p < 0.05)',
  'trend.status.notSignificant': '有意差なし (p ≥ 0.05)',
  'trend.status.insufficient': 'データ不足のため判定不能',
  'trend.chart.title': (p: { region: string; variable: string }) =>
    `${p.region} — ${p.variable} 時系列`,
  'trend.chart.series': '集計系列',
  'trend.chart.trendLine': '線形トレンド',
  'trend.chart.ciBand': '95%信頼帯',
  'trend.tooltip.time': (p: { label: string }) => `時点: ${p.label}`,
  'trend.tooltip.coverage': (p: { percent: string }) => `画素被覆率: ${p.percent}`,
  'trend.variableLong.sst': '海面水温 (SST)',
  'trend.variableLong.chlorA': 'クロロフィルa濃度 (Chl-a)',
  'trend.variableShort.sst': '海面水温',
  'trend.variableShort.chlorA': 'クロロフィルa濃度',
  'trend.summary.title': '解析サマリーと解釈',
  'trend.summary.body': (p: {
    region: string;
    range: string;
    variable: string;
    slope: string;
    n: string;
    pValue: string;
  }) =>
    `${p.region}における ${p.range}の${p.variable}は、${p.slope}の線形傾向を示しています（n = ${p.n}, p = ${p.pValue}）。`,
  'trend.summary.slope': (p: { value: string; unit: string }) => `推定 ${p.value} ${p.unit}/年`,
  'trend.summary.slopeUnavailable': '解析不能',
  'trend.interpretation.significant':
    'p < 0.05 により、観測期間中の変化傾向は統計的に有意と判定されました。水温シフトに伴う回遊経路・餌生物分布の再配置を検証する動機となります。',
  'trend.interpretation.notSignificant':
    'p ≥ 0.05 のため、統計的に有意な単調変化は確認されませんでした（ただし「変化が全くない」ことの証明ではありません）。',
  'trend.limitations.title': '科学的限界・留意事項',
  'trend.limitation.1': '統計的有意性は、現場の漁獲量や生態学的変化の大きさと同義ではありません。',
  'trend.limitation.2':
    'p < 0.05 は例示的な判定基準です。標本数が少ない場合や月次系列の自己相関が強い場合、有意性を過大評価する可能性があります（設計書§7.1）。',
  'trend.limitation.3':
    '冬季の雲被覆により有効画素が減少します。各月の coverage は実測値であり、補間していません。',
  'trend.limitation.4':
    'Chl-aは分布の歪みが大きいため、海域代表値には中央値を用いています（平均値とは解釈が異なります）。',
  'trend.limitation.5':
    'Chl-aは植物プランクトン指標であり、魚類の餌となる動物プランクトンや小魚の直接計測ではありません。',
  'trend.limitation.6':
    'Chl-aはMODIS-Aqua（2002年打ち上げ）由来です。長期センサー特性の変化は長期トレンド解釈時の留意点です。',

  'demo.prev': '戻る',
  'demo.next': '次のステップ',
  'demo.finish': 'デモ完了',
  'demo.close': 'デモを閉じる',
  'demo.step1.title': '対象海域と海面水温 (SST) の確認',
  'demo.step1.description':
    '北海道南部・津軽海峡（40.5–43.0°N）の9月期サンプル海域を表示中。暖流の張り出しと冷水の境界（潮目）を確認します。',
  'demo.step2.title': 'クロロフィルa (Chl-a) 分布への切替',
  'demo.step2.description':
    '基礎生産の指標であるChl-a濃度へ切り替え、植物プランクトンが集積しやすい前線帯と欠損画素の扱いを確認します。',
  'demo.step3.title': '適合指数とOBIS過去出現記録の重ね合わせ',
  'demo.step3.description':
    '探索用適合指数マップ上にクロマグロのOBIS過去記録を重ね、環境条件と過去実績が重なる候補ポイントAを選択します。',
  'demo.step4.title': 'Trend Explorer による長期統計検証',
  'demo.step4.description':
    '2016–2025年の年平均SST時系列を線形回帰し、年あたり上昇率・p値・95%信頼区間から長期変化の有意性を評価します。',
  'demo.step5.title': 'Route Lab での省燃料ルート比較試算',
  'demo.step5.description':
    '選択した候補ポイントAに対し、最短ライン（Route A）と海流・波浪配慮ライン（Route B）の距離・時間・燃料コストを比較します。',

  'app.translationPending': 'このセクションは日本語のみです（英語版は準備中）',

  'switcher.ariaLabel': '表示言語の切り替え',

  'demo.start': 'デモ再生',
  'demo.stop': 'デモ終了',
};
