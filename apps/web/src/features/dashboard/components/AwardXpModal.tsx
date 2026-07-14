import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { awardXpSchema, type AwardXpInput } from '@ecosphere/shared';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { Button, Input, Textarea } from '@/components/ui';
import type { EmployeeDirectoryEntry } from '@/features/dashboard/components/EmployeeDirectoryPanel';

interface AwardXpModalProps {
  orgId: string;
  employee: EmployeeDirectoryEntry;
  onClose: () => void;
}

export function AwardXpModal({ orgId, employee, onClose }: AwardXpModalProps) {
  const queryClient = useQueryClient();

  const form = useForm<AwardXpInput>({
    resolver: zodResolver(awardXpSchema),
    defaultValues: {
      userId: employee.id,
      xpAmount: 25,
      pointsAmount: 10,
      reason: `Recognition for outstanding ESG contribution — ${employee.firstName} ${employee.lastName}`,
    },
  });

  const awardMutation = useMutation({
    mutationFn: (values: AwardXpInput) =>
      apiClient(`/orgs/${orgId}/gamification/award`, { method: 'POST', body: values }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.gamification.leaderboard(orgId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.gamification.profile(orgId) });
      onClose();
    },
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="award-xp-title"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="award-xp-title" className="text-xl font-bold text-white">
          Award XP to {employee.firstName}
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          {employee.departmentName} · {employee.email}
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={form.handleSubmit((values) => awardMutation.mutate(values))}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="xpAmount">
                XP amount
              </label>
              <Input
                id="xpAmount"
                type="number"
                min={1}
                max={500}
                {...form.register('xpAmount', { valueAsNumber: true })}
              />
            </div>
            <div>
              <label className="label" htmlFor="pointsAmount">
                Points
              </label>
              <Input
                id="pointsAmount"
                type="number"
                min={0}
                max={500}
                {...form.register('pointsAmount', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="reason">
              Reason
            </label>
            <Textarea id="reason" {...form.register('reason')} />
          </div>

          {awardMutation.isError ? (
            <p className="text-sm text-brand-300">Failed to award XP. Please try again.</p>
          ) : null}

          <div className="flex gap-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={awardMutation.isPending}>
              {awardMutation.isPending ? 'Awarding…' : 'Award XP'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
