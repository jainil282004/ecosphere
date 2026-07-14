import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { useOrgContext } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { Button, Card, EmptyState, PageHeader, StatusBadge } from '@/components/ui';

interface ApprovalItem {
  id: string;
  entityType: string;
  entityId: string;
  status: string;
  submittedAt: string;
  entity: {
    id: string;
    title: string;
    departmentId: string | null;
    submittedById: string;
    status: string;
    hoursContributed?: string;
    xpReward?: number;
    pointsReward?: number;
  };
}

function estimateXpReward(item: ApprovalItem): string {
  if (item.entityType === 'csr_activity' && item.entity.hoursContributed) {
    const hours = Number(item.entity.hoursContributed);
    return `~${Math.round(hours * 5)} XP · ~${Math.round(hours * 2)} pts`;
  }
  if (item.entityType === 'challenge_participation' && item.entity.xpReward) {
    return `~${item.entity.xpReward} XP · ~${item.entity.pointsReward ?? 0} pts`;
  }
  return 'XP awarded on approval';
}

export function ApprovalsPage() {
  const { orgId } = useOrgContext();
  const queryClient = useQueryClient();

  const inboxQuery = useQuery({
    queryKey: queryKeys.approvals.inbox(orgId!),
    queryFn: () => apiClient<ApprovalItem[]>(`/orgs/${orgId}/approvals/inbox`),
    enabled: Boolean(orgId),
  });

  const decideMutation = useMutation({
    mutationFn: (input: { id: string; decision: 'approved' | 'rejected' }) =>
      apiClient(`/orgs/${orgId}/approvals/${input.id}/decide`, {
        method: 'POST',
        body: { decision: input.decision },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.approvals.inbox(orgId!) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(orgId!) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.gamification.profile(orgId!) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.gamification.leaderboard(orgId!) });
    },
  });

  return (
    <div>
      <PageHeader
        title="Approvals Inbox"
        description="Review submissions, approve to grant XP and reward points automatically."
      />

      {inboxQuery.data?.length ? (
        <div className="space-y-4">
          {inboxQuery.data.map((item) => (
            <Card
              key={item.id}
              className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-semibold text-white">{item.entity.title}</h3>
                  <StatusBadge status={item.status} />
                </div>
                <p className="mt-2 text-sm text-slate-400">
                  {item.entityType.replaceAll('_', ' ')} · submitted{' '}
                  {new Date(item.submittedAt).toLocaleString()}
                </p>
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-accent-300">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                  {estimateXpReward(item)}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  variant="secondary"
                  disabled={decideMutation.isPending}
                  onClick={() => decideMutation.mutate({ id: item.id, decision: 'rejected' })}
                  aria-label={`Reject ${item.entity.title}`}
                >
                  Reject
                </Button>
                <Button
                  disabled={decideMutation.isPending}
                  onClick={() => decideMutation.mutate({ id: item.id, decision: 'approved' })}
                  aria-label={`Approve ${item.entity.title} and award XP`}
                >
                  Approve & award XP
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Inbox clear"
          description="There are no pending submissions requiring your approval."
        />
      )}
    </div>
  );
}
