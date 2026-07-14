import type { CarbonTransactionRow, ScopeTrendPoint } from '../types';

export function aggregateScopeTrend(transactions: CarbonTransactionRow[]): ScopeTrendPoint[] {
  const buckets = new Map<string, { scope1: number; scope2: number; scope3: number }>();

  for (const tx of transactions) {
    if (tx.status === 'rejected' || tx.status === 'cancelled') {
      continue;
    }

    const dateSource = tx.activityDate ?? tx.createdAt;
    if (!dateSource) {
      continue;
    }

    const month = dateSource.slice(0, 7);
    const existing = buckets.get(month) ?? { scope1: 0, scope2: 0, scope3: 0 };
    const kg = Number(tx.co2eKg);

    if (tx.scope === 'scope_1') existing.scope1 += kg;
    else if (tx.scope === 'scope_2') existing.scope2 += kg;
    else if (tx.scope === 'scope_3') existing.scope3 += kg;

    buckets.set(month, existing);
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, values]) => ({
      month,
      scope1: Math.round(values.scope1 * 100) / 100,
      scope2: Math.round(values.scope2 * 100) / 100,
      scope3: Math.round(values.scope3 * 100) / 100,
      total: Math.round((values.scope1 + values.scope2 + values.scope3) * 100) / 100,
    }));
}
