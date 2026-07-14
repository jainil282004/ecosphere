import { useQuery } from '@tanstack/react-query';
import { Briefcase, Gift, Mail, Sparkles, Users } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button } from '@/components/ui';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { usePermissions } from '@/hooks/useAuth';
import { AwardXpModal } from './AwardXpModal';

export interface EmployeeDirectoryEntry {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  primaryRole: string;
  departmentName: string;
}

function formatRole(role: string) {
  return role.replaceAll('_', ' ');
}

export function EmployeeDirectoryPanel({ orgId }: { orgId: string }) {
  const { can } = usePermissions();
  const [awardTarget, setAwardTarget] = useState<EmployeeDirectoryEntry | null>(null);
  const canAward = can('approve_submissions') || can('manage_users');

  const directoryQuery = useQuery({
    queryKey: queryKeys.users.directory(orgId),
    queryFn: () => apiClient<EmployeeDirectoryEntry[]>(`/orgs/${orgId}/users/directory`),
    enabled: Boolean(orgId),
  });

  const employees = directoryQuery.data ?? [];

  return (
    <>
      <Card aria-labelledby="employee-directory-title">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Workforce Snapshot</p>
            <h2 id="employee-directory-title" className="mt-2 text-lg font-semibold text-white">
              Employee Directory
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Click a team member to view their corner or award XP after review.
            </p>
          </div>
          <span className="accent-pill">{employees.length} people</span>
        </header>

        <div className="mt-6 space-y-3">
          {directoryQuery.isLoading ? (
            <p className="text-sm text-slate-500">Loading employee records…</p>
          ) : employees.length === 0 ? (
            <p className="text-sm text-slate-500">No employee records available yet.</p>
          ) : (
            employees.map((employee) => (
              <article
                key={employee.id}
                className="flex items-start gap-3 rounded-2xl border border-brand-500/15 bg-surface-950/70 px-4 py-3 transition hover:border-accent-400/30"
              >
                <Link
                  to={`/orgs/${orgId}/employee-corner`}
                  className="flex min-w-0 flex-1 items-start gap-3 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
                  aria-label={`View ${employee.firstName} ${employee.lastName} in employee corner`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-500/10 text-sm font-semibold text-brand-200">
                    {employee.firstName[0]}
                    {employee.lastName[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white">
                      {employee.firstName} {employee.lastName}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 capitalize">
                        <Briefcase className="h-3.5 w-3.5 text-accent-300" aria-hidden />
                        {formatRole(employee.primaryRole)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-brand-300" aria-hidden />
                        {employee.departmentName}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5 text-brand-300" aria-hidden />
                        {employee.email}
                      </span>
                    </div>
                  </div>
                </Link>
                {canAward ? (
                  <Button
                    variant="secondary"
                    className="shrink-0"
                    onClick={() => setAwardTarget(employee)}
                    aria-label={`Award XP to ${employee.firstName}`}
                  >
                    <Gift className="mr-1.5 h-4 w-4" aria-hidden />
                    Award XP
                  </Button>
                ) : null}
              </article>
            ))
          )}
        </div>

        {canAward ? (
          <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
            <Sparkles className="h-3.5 w-3.5 text-accent-300" aria-hidden />
            Managers can also review submissions in{' '}
            <Link to={`/orgs/${orgId}/approvals`} className="text-brand-300 hover:text-brand-200">
              Approvals
            </Link>
          </p>
        ) : null}
      </Card>

      {awardTarget ? (
        <AwardXpModal
          orgId={orgId}
          employee={awardTarget}
          onClose={() => setAwardTarget(null)}
        />
      ) : null}
    </>
  );
}
