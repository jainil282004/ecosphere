import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateCarbonTransactionWithCalculationInput } from '@ecosphere/shared';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { CarbonTransactionRow } from '../types';

interface TransactionsCache {
  data: CarbonTransactionRow[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

interface MutationContext {
  previousTransactions?: TransactionsCache;
  previousDashboard?: unknown;
}

export function useLogEnvironmentalMetric(orgId: string) {
  const queryClient = useQueryClient();
  const transactionsKey = queryKeys.carbon.transactions(orgId, 'dashboard-trend');

  return useMutation({
    mutationFn: (values: CreateCarbonTransactionWithCalculationInput) =>
      apiClient<{ transaction: CarbonTransactionRow; calculation: { co2eKg: number; scope: string } }>(
        `/orgs/${orgId}/environmental/carbon-transactions`,
        { method: 'POST', body: values },
      ),

    onMutate: async (values): Promise<MutationContext> => {
      await queryClient.cancelQueries({ queryKey: transactionsKey });
      await queryClient.cancelQueries({ queryKey: queryKeys.dashboard(orgId) });

      const previousTransactions = queryClient.getQueryData<TransactionsCache>(transactionsKey);
      const previousDashboard = queryClient.getQueryData(queryKeys.dashboard(orgId));

      const optimisticRow: CarbonTransactionRow = {
        id: `optimistic-${Date.now()}`,
        activityType: values.activityType,
        co2eKg: '…',
        status: 'submitted',
        quantity: String(values.quantity),
        unit: values.unit,
        scope: 'scope_2',
        activityDate: values.activityDate,
      };

      if (previousTransactions) {
        queryClient.setQueryData<TransactionsCache>(transactionsKey, {
          ...previousTransactions,
          data: [optimisticRow, ...previousTransactions.data],
        });
      }

      queryClient.setQueryData<DashboardMetricsOptimistic>(queryKeys.dashboard(orgId), (old) =>
        old
          ? {
              ...old,
              pendingApprovals: old.pendingApprovals + 1,
            }
          : old,
      );

      return { previousTransactions, previousDashboard };
    },

    onError: (_error, _values, context) => {
      if (context?.previousTransactions) {
        queryClient.setQueryData(transactionsKey, context.previousTransactions);
      }
      if (context?.previousDashboard !== undefined) {
        queryClient.setQueryData(queryKeys.dashboard(orgId), context.previousDashboard);
      }
    },

    onSuccess: (result) => {
      queryClient.setQueryData<TransactionsCache>(transactionsKey, (old) => {
        if (!old) {
          return old;
        }
        const withoutOptimistic = old.data.filter((row) => !row.id.startsWith('optimistic-'));
        return {
          ...old,
          data: [result.transaction, ...withoutOptimistic],
        };
      });
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.carbon.all(orgId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(orgId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboardFootprint(orgId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.reports.carbonTrend(orgId) });
    },
  });
}

interface DashboardMetricsOptimistic {
  pendingApprovals: number;
  totalCarbonKg: number;
  csrHours: number;
  esgScore: number;
  [key: string]: unknown;
}
