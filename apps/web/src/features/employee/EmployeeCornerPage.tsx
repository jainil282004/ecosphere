import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { GamificationProfile } from '@ecosphere/shared';
import {
  Award,
  Bell,
  CheckSquare,
  HeartHandshake,
  Leaf,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth, useOrgContext, usePermissions } from '@/hooks/useAuth';
import { ApiError, apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { Button, Card, EmptyState, HeroBanner, MetricCard, StatusBadge, Textarea } from '@/components/ui';

interface Challenge {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  pointsReward: number;
  status: string;
  startDate: string;
  endDate: string;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface CsrActivity {
  id: string;
  title: string;
  status: string;
  hoursContributed: string;
  activityDate: string;
}

const quickLinks = [
  { to: 'csr', label: 'Submit CSR', icon: HeartHandshake, permission: 'submit_activities' as const },
  { to: 'carbon', label: 'Log Carbon', icon: Leaf, permission: 'submit_activities' as const },
  { to: 'gamification', label: 'Rewards', icon: Trophy, permission: 'view_own_gamification' as const },
  { to: 'approvals', label: 'Review & Award', icon: CheckSquare, permission: 'approve_submissions' as const },
  { to: 'dashboard', label: 'Dashboard', icon: Target, permission: 'view_reports' as const },
];

export function EmployeeCornerPage() {
  const { user } = useAuth();
  const { orgId } = useOrgContext();
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [evidence, setEvidence] = useState('');

  const profileQuery = useQuery({
    queryKey: queryKeys.gamification.profile(orgId!),
    queryFn: () => apiClient<GamificationProfile>(`/orgs/${orgId}/gamification/me`),
    enabled: Boolean(orgId),
  });

  const challengesQuery = useQuery({
    queryKey: [...queryKeys.org(orgId!), 'challenges'] as const,
    queryFn: () => apiClient<Challenge[]>(`/orgs/${orgId}/social/challenges`),
    enabled: Boolean(orgId),
  });

  const notificationsQuery = useQuery({
    queryKey: queryKeys.notifications(orgId!),
    queryFn: () => apiClient<NotificationItem[]>(`/orgs/${orgId}/notifications`),
    enabled: Boolean(orgId),
  });

  const csrQuery = useQuery({
    queryKey: [...queryKeys.csr.list(orgId!), { limit: 5 }],
    queryFn: () =>
      apiClient<{ data: CsrActivity[] }>(`/orgs/${orgId}/social/csr?limit=5`).then(
        (res) => res.data ?? [],
      ),
    enabled: Boolean(orgId),
  });

  const participateMutation = useMutation({
    mutationFn: (challengeId: string) =>
      apiClient(`/orgs/${orgId}/social/challenges/participate`, {
        method: 'POST',
        body: {
          challengeId,
          evidenceDescription: evidence.trim() || 'Completed the sustainability challenge activity.',
        },
      }),
    onSuccess: async () => {
      setJoiningId(null);
      setEvidence('');
      await queryClient.invalidateQueries({ queryKey: queryKeys.gamification.profile(orgId!) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.approvals.inbox(orgId!) });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient(`/orgs/${orgId}/notifications/${id}/read`, { method: 'PATCH' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications(orgId!) });
    },
  });

  const profile = profileQuery.data;
  const activeChallenges =
    challengesQuery.data?.filter((c) => c.status === 'active') ?? [];
  const myCsr = csrQuery.data?.slice(0, 5) ?? [];
  const visibleLinks = quickLinks.filter((link) => can(link.permission));

  return (
    <div className="space-y-8">
      <HeroBanner
        eyebrow="My impact"
        title={`Welcome back, ${user?.firstName ?? 'there'}.`}
        subtitle="Track your contribution to the company's ESG performance — join challenges, submit CSR hours, and watch your XP compound into badges and rewards."
        score={{
          value: profile?.totalXp ?? 0,
          label: 'Total XP',
          sublabel: `Level ${profile?.level ?? 1}`,
          tone: 'accent',
        }}
        pills={[
          { label: 'Points', value: `${profile?.totalPoints ?? 0}`, tone: 'gold' },
          { label: 'Badges', value: `${profile?.badges.length ?? 0}`, tone: 'accent' },
          {
            label: 'Streak',
            value: `${profile?.currentStreakWeeks ?? 0} wks`,
            tone: 'brand',
          },
        ]}
      />

      <section aria-label="Your stats" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total XP"
          value={profile?.totalXp ?? 0}
          hint={`Level ${profile?.level ?? 1}`}
          icon={<Sparkles className="h-5 w-5 text-brand-300" aria-hidden />}
          tone="brand"
        />
        <MetricCard
          label="Reward points"
          value={profile?.totalPoints ?? 0}
          hint="Redeem in Gamification"
          icon={<Trophy className="h-5 w-5 text-gold-300" aria-hidden />}
          tone="gold"
        />
        <MetricCard
          label="Badges"
          value={profile?.badges.length ?? 0}
          hint="Earned from approved activities"
          icon={<Award className="h-5 w-5 text-accent-300" aria-hidden />}
          tone="accent"
        />
        <MetricCard
          label="Streak"
          value={`${profile?.currentStreakWeeks ?? 0} wks`}
          hint={`Best: ${profile?.longestStreakWeeks ?? 0} weeks`}
          icon={<Target className="h-5 w-5 text-brand-300" aria-hidden />}
          tone="brand"
        />
      </section>

      <Card>
        <h2 className="h-section">Quick actions</h2>
        <p className="mt-1 text-sm text-slate-400">Jump to the tools you use most.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {visibleLinks.map((link) => (
            <Link
              key={link.to}
              to={`/orgs/${orgId}/${link.to}`}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-brand-400/40 hover:bg-brand-500/10 hover:text-brand-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
            >
              <link.icon className="h-4 w-4" aria-hidden />
              {link.label}
            </Link>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="h-section">Active challenges</h2>
          <p className="mt-1 text-sm text-slate-400">Join a challenge to earn XP after manager approval.</p>
          <div className="mt-4 space-y-3">
            {challengesQuery.isLoading ? (
              <p className="text-sm text-slate-500">Loading challenges…</p>
            ) : activeChallenges.length === 0 ? (
              <EmptyState
                title="No active challenges"
                description="Check back soon for new sustainability missions."
              />
            ) : (
              activeChallenges.map((challenge) => (
                <article
                  key={challenge.id}
                  className="rounded-2xl border border-brand-500/15 bg-surface-950/70 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-medium text-white">{challenge.title}</h3>
                      <p className="mt-1 text-sm text-slate-400">{challenge.description}</p>
                      <p className="mt-2 text-xs text-accent-300">
                        +{challenge.xpReward} XP · +{challenge.pointsReward} points
                      </p>
                    </div>
                    <StatusBadge status={challenge.status} />
                  </div>
                  {joiningId === challenge.id ? (
                    <div className="mt-4 space-y-3">
                      <Textarea
                        placeholder="Describe what you did for this challenge…"
                        value={evidence}
                        onChange={(e) => setEvidence(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setJoiningId(null);
                            setEvidence('');
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          disabled={participateMutation.isPending}
                          onClick={() => participateMutation.mutate(challenge.id)}
                        >
                          {participateMutation.isPending ? 'Submitting…' : 'Submit participation'}
                        </Button>
                      </div>
                      {participateMutation.isError ? (
                        <p className="field-error">
                          {participateMutation.error instanceof ApiError
                            ? participateMutation.error.message
                            : 'Failed to join challenge.'}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <Button className="mt-4" onClick={() => setJoiningId(challenge.id)}>
                      Join challenge
                    </Button>
                  )}
                </article>
              ))
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-brand-300" aria-hidden />
            <h2 className="h-section">Notifications</h2>
          </div>
          <div className="mt-4 space-y-2">
            {notificationsQuery.isLoading ? (
              <p className="text-sm text-slate-500">Loading notifications…</p>
            ) : (notificationsQuery.data?.length ?? 0) === 0 ? (
              <p className="text-sm text-slate-500">You are all caught up.</p>
            ) : (
              notificationsQuery.data?.slice(0, 8).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (!item.isRead) {
                      markReadMutation.mutate(item.id);
                    }
                  }}
                  className={`w-full rounded-xl border px-4 py-3 text-left transition hover:border-brand-400/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 ${
                    item.isRead
                      ? 'border-brand-500/10 bg-surface-950/50'
                      : 'border-accent-500/20 bg-accent-500/5'
                  }`}
                >
                  <p className="font-medium text-white">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-400">{item.message}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </button>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="h-section">My recent CSR submissions</h2>
        <div className="mt-4 space-y-2">
          {myCsr.length === 0 ? (
            <p className="text-sm text-slate-500">
              No CSR activities yet.{' '}
              <Link
                to={`/orgs/${orgId}/csr`}
                className="text-brand-300 hover:text-brand-200"
              >
                Submit your first activity →
              </Link>
            </p>
          ) : (
            myCsr.map((activity) => (
              <Link
                key={activity.id}
                to={`/orgs/${orgId}/csr`}
                className="flex items-center justify-between rounded-xl border border-brand-500/15 bg-surface-950/70 px-4 py-3 transition hover:border-brand-400/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
              >
                <div>
                  <p className="font-medium text-white">{activity.title}</p>
                  <p className="text-xs text-slate-500">
                    {activity.hoursContributed} hrs · {new Date(activity.activityDate).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={activity.status} />
              </Link>
            ))
          )}
        </div>
      </Card>

      {profile?.badges.length ? (
        <Card>
          <h2 className="h-section">Your badges</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {profile.badges.map((badge) => (
              <div
                key={badge.id}
                className="rounded-xl border border-brand-500/15 bg-brand-500/5 px-4 py-3"
              >
                <p className="font-medium text-white">{badge.name}</p>
                <p className="mt-1 text-sm text-slate-400">{badge.description}</p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
