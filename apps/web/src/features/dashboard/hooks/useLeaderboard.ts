import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { LeaderboardEntry } from '../types';

interface RawLeaderboardRow {
  userId: string;
  firstName: string;
  lastName: string;
  totalXp: number;
}

export function useLeaderboard(orgId: string | null) {
  return useQuery({
    queryKey: queryKeys.gamification.leaderboard(orgId!),
    queryFn: async () => {
      const rows = await apiClient<RawLeaderboardRow[]>(`/orgs/${orgId}/gamification/leaderboard`);
      return rows.map(
        (row, index): LeaderboardEntry => ({
          userId: row.userId,
          firstName: row.firstName,
          lastName: row.lastName,
          totalXp: Number(row.totalXp),
          rank: index + 1,
        }),
      );
    },
    enabled: Boolean(orgId),
    staleTime: 60_000,
  });
}
