/**
 * Reports the trend statistics the app computes from the prefetched NASA data.
 *
 * Whatever this prints IS the finding: the UI copy must follow these numbers,
 * never the other way round.
 *
 * Usage: npx tsx scripts/check_trends.ts
 */
import { readFileSync } from 'node:fs';
import { aggregateAnnualSeries, computeLinearTrend } from '../src/utils/oceanMath';
import type { MonthlyObservation, RegionId } from '../src/types/ocean';

const series = JSON.parse(
  readFileSync('src/data/nasa/monthly_series.json', 'utf8')
) as Record<RegionId, MonthlyObservation[]>;

for (const region of ['tsugaru', 'sanriku'] as RegionId[]) {
  for (const variable of ['sst', 'chlor_a'] as const) {
    // Same aggregation and call shape as TrendExplorerView's annual mode.
    const annual = aggregateAnnualSeries(series[region], variable, 9);
    const t = computeLinearTrend(
      annual.map((a) => ({ x: a.year, y: a.value, coverage: a.coverageRatio })),
      variable,
      region,
      'OLS 年次線形回帰 (有効月 ≥ 9/12)'
    );
    process.stdout.write(
      `${region.padEnd(8)} ${variable.padEnd(8)} n=${t.n} ` +
        `slope=${t.slopePerYear?.toFixed(4)} ${t.unit.padEnd(10)} ` +
        `p=${t.pValue?.toFixed(4)} R2=${t.rSquared?.toFixed(3)} ` +
        `CI=[${t.ci95Low?.toFixed(4)}, ${t.ci95High?.toFixed(4)}] -> ${t.status}\n`
    );
  }
}
