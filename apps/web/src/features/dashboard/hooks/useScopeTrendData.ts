import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { SAMPLE_SCOPE_TREND } from '../constants';
import type { CarbonTransactionRow, ScopeTrendPoint } from '../types';
import { aggregateScopeTrend } from '../utils/aggregateScopeTrend';

export function useScopeTrendData(orgId: string | null) {
  const transactionsQuery = useQuery({
    queryKey: queryKeys.carbon.transactions(orgId!, 'dashboard-trend'),
    queryFn: () =>
      apiClient<{ data: CarbonTransactionRow[] }>(
        `/orgs/${orgId}/environmental/carbon-transactions`,
        { params: { page: 1, limit: 100 } },
      ),
    enabled: Boolean(orgId),
    staleTime: 30_000,
  });

  const trendPoints: ScopeTrendPoint[] = useMemo(() => {
    const aggregated = aggregateScopeTrend(transactionsQuery.data?.data ?? []);
    return aggregated.length > 0 ? aggregated : SAMPLE_SCOPE_TREND;
  }, [transactionsQuery.data]);

  return {
    trendPoints,
    isSampleData: (transactionsQuery.data?.data ?? []).length === 0,
    isLoading: transactionsQuery.isLoading,
    isError: transactionsQuery.isError,
  };
}
