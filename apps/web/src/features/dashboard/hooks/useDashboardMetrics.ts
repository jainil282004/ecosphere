import { useQuery } from '@tanstack/react-query';
import type { CarbonFootprintSummary, DashboardMetrics, VarianceSnapshot } from '@ecosphere/shared';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

export function useDashboardMetrics(orgId: string | null) {
  return useQuery({
    queryKey: queryKeys.dashboard(orgId!),
    queryFn: () => apiClient<DashboardMetrics>(`/orgs/${orgId}/reports/dashboard`),
    enabled: Boolean(orgId),
    staleTime: 30_000,
  });
}

export function useCarbonFootprint(orgId: string | null) {
  return useQuery({
    queryKey: queryKeys.dashboardFootprint(orgId!),
    queryFn: () =>
      apiClient<CarbonFootprintSummary>(`/orgs/${orgId}/environmental/carbon/footprint`),
    enabled: Boolean(orgId),
    staleTime: 30_000,
  });
}

export function useVarianceSnapshots(orgId: string | null) {
  return useQuery({
    queryKey: queryKeys.reports.variance(orgId!),
    queryFn: () => apiClient<VarianceSnapshot[]>(`/orgs/${orgId}/reports/variance`),
    enabled: Boolean(orgId),
  });
}
