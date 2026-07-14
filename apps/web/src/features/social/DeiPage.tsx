import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  createDeiSnapshotSchema,
  type CreateDeiSnapshotInput,
} from '@ecosphere/shared';
import { useOrgContext } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { Button, Card, EmptyState, Input, PageHeader, StatusBadge, Textarea } from '@/components/ui';

interface DeiSnapshot {
  id: string;
  femalePercentage: string;
  underrepresentedPercentage: string;
  leadershipDiversityPercentage: string;
  totalHeadcount: number;
  status: string;
  periodStart: string;
  periodEnd: string;
}

export function DeiPage() {
  const { orgId } = useOrgContext();
  const queryClient = useQueryClient();

  const snapshotsQuery = useQuery({
    queryKey: queryKeys.social.dei(orgId!),
    queryFn: () => apiClient<DeiSnapshot[]>(`/orgs/${orgId}/social/dei`),
    enabled: Boolean(orgId),
  });

  const form = useForm<CreateDeiSnapshotInput>({
    resolver: zodResolver(createDeiSnapshotSchema),
    defaultValues: {
      periodStart: new Date(new Date().getFullYear(), 0, 1).toISOString(),
      periodEnd: new Date().toISOString(),
      femalePercentage: 42,
      underrepresentedPercentage: 28,
      leadershipDiversityPercentage: 35,
      totalHeadcount: 120,
      notes: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (values: CreateDeiSnapshotInput) =>
      apiClient(`/orgs/${orgId}/social/dei`, { method: 'POST', body: values }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.social.dei(orgId!) });
    },
  });

  return (
    <div>
      <PageHeader
        title="DEI Balance Tracker"
        description="Record diversity, equity, and inclusion metrics with approval-gated submissions."
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <h2 className="text-lg font-semibold text-white">DEI snapshots</h2>
          <div className="mt-4 space-y-3">
            {snapshotsQuery.data?.length ? (
              snapshotsQuery.data.map((snapshot) => (
                <div
                  key={snapshot.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-medium text-white">
                      {new Date(snapshot.periodStart).toLocaleDateString()} –{' '}
                      {new Date(snapshot.periodEnd).toLocaleDateString()}
                    </h3>
                    <StatusBadge status={snapshot.status} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-400">
                    <span>Female: {snapshot.femalePercentage}%</span>
                    <span>Underrepresented: {snapshot.underrepresentedPercentage}%</span>
                    <span>Leadership diversity: {snapshot.leadershipDiversityPercentage}%</span>
                    <span>Headcount: {snapshot.totalHeadcount}</span>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title="No DEI snapshots"
                description="Submit your first DEI balance snapshot for leadership review."
              />
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-white">Record DEI snapshot</h2>
          <form
            className="mt-4 space-y-4"
            onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label" htmlFor="femalePercentage">Female %</label>
                <Input
                  id="femalePercentage"
                  type="number"
                  step="0.01"
                  {...form.register('femalePercentage', { valueAsNumber: true })}
                />
              </div>
              <div>
                <label className="label" htmlFor="underrepresentedPercentage">
                  Underrepresented %
                </label>
                <Input
                  id="underrepresentedPercentage"
                  type="number"
                  step="0.01"
                  {...form.register('underrepresentedPercentage', { valueAsNumber: true })}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label" htmlFor="leadershipDiversityPercentage">
                  Leadership diversity %
                </label>
                <Input
                  id="leadershipDiversityPercentage"
                  type="number"
                  step="0.01"
                  {...form.register('leadershipDiversityPercentage', { valueAsNumber: true })}
                />
              </div>
              <div>
                <label className="label" htmlFor="totalHeadcount">Total headcount</label>
                <Input
                  id="totalHeadcount"
                  type="number"
                  {...form.register('totalHeadcount', { valueAsNumber: true })}
                />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="notes">Notes</label>
              <Textarea id="notes" {...form.register('notes')} />
            </div>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Submitting...' : 'Submit for approval'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
