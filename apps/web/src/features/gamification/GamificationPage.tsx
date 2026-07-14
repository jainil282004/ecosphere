import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { GamificationProfile } from '@ecosphere/shared';
import { useOrgContext } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { Button, Card, MetricCard, PageHeader } from '@/components/ui';

interface RewardItem {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  stockRemaining: number;
}

export function GamificationPage() {
  const { orgId } = useOrgContext();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: queryKeys.gamification.profile(orgId!),
    queryFn: () => apiClient<GamificationProfile>(`/orgs/${orgId}/gamification/me`),
    enabled: Boolean(orgId),
  });

  const rewardsQuery = useQuery({
    queryKey: queryKeys.rewards(orgId!),
    queryFn: () => apiClient<RewardItem[]>(`/orgs/${orgId}/rewards`),
    enabled: Boolean(orgId),
  });

  const redeemMutation = useMutation({
    mutationFn: (rewardId: string) =>
      apiClient(`/orgs/${orgId}/rewards/redeem`, {
        method: 'POST',
        body: { rewardId },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.gamification.profile(orgId!) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.rewards(orgId!) });
    },
  });

  const profile = profileQuery.data;

  return (
    <div>
      <PageHeader
        title="Gamification Hub"
        description="Track XP, reward points, badges, and redeem catalog items after approval."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Total XP" value={profile?.totalXp ?? 0} hint={`Level ${profile?.level ?? 1}`} />
        <MetricCard label="Reward points" value={profile?.totalPoints ?? 0} hint="Ledger-derived balance" />
        <MetricCard label="Badges earned" value={profile?.badges.length ?? 0} hint="Approval-triggered achievements" />
        <MetricCard
          label="Participation streak"
          value={`${profile?.currentStreakWeeks ?? 0} wks`}
          hint={`Longest: ${profile?.longestStreakWeeks ?? 0} weeks`}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold text-white">Badges</h2>
          <div className="mt-4 space-y-3">
            {profile?.badges.length ? (
              profile.badges.map((badge) => (
                <div
                  key={badge.id}
                  className="rounded-xl border border-brand-500/20 bg-brand-500/5 px-4 py-3"
                >
                  <p className="font-medium text-white">{badge.name}</p>
                  <p className="mt-1 text-sm text-slate-400">{badge.description}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Earned {new Date(badge.earnedAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">
                Complete approved CSR and carbon activities to unlock badges.
              </p>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-white">Reward catalog</h2>
          <div className="mt-4 space-y-3">
            {rewardsQuery.data?.map((reward) => (
              <div
                key={reward.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-medium text-white">{reward.name}</p>
                  <p className="mt-1 text-sm text-slate-400">{reward.description}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {reward.pointsCost} points · {reward.stockRemaining} in stock
                  </p>
                </div>
                <Button
                  disabled={
                    redeemMutation.isPending ||
                    reward.stockRemaining <= 0 ||
                    (profile?.totalPoints ?? 0) < reward.pointsCost
                  }
                  onClick={() => redeemMutation.mutate(reward.id)}
                >
                  Redeem
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
