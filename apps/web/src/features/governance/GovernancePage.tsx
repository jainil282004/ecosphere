import { useQuery } from '@tanstack/react-query';
import { Shield, FileCheck, ScrollText } from 'lucide-react';
import { useOrgContext } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { Card, EmptyState, PageHeader, StatusBadge } from '@/components/ui';

interface FrameworkMapping {
  id: string;
  framework: string;
  metricCode: string;
  metricTitle: string;
  domain: string;
  isMandatory: boolean;
}

interface FrameworkSubmission {
  id: string;
  snapshotMetricTitle: string;
  snapshotFramework: string;
  reportedValue: string;
  status: string;
}

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  createdAt: string;
  actorUserId: string | null;
}

export function GovernancePage() {
  const { orgId } = useOrgContext();

  const mappingsQuery = useQuery({
    queryKey: queryKeys.governance.frameworks(orgId!),
    queryFn: () =>
      apiClient<FrameworkMapping[]>(`/orgs/${orgId}/governance/frameworks/mappings`),
    enabled: Boolean(orgId),
  });

  const submissionsQuery = useQuery({
    queryKey: queryKeys.governance.submissions(orgId!),
    queryFn: () =>
      apiClient<FrameworkSubmission[]>(`/orgs/${orgId}/governance/frameworks/submissions`),
    enabled: Boolean(orgId),
  });

  const auditQuery = useQuery({
    queryKey: queryKeys.governance.auditLogs(orgId!),
    queryFn: () => apiClient<AuditLog[]>(`/orgs/${orgId}/governance/audit-logs`),
    enabled: Boolean(orgId),
  });

  const frameworks = ['brsr', 'gri', 'csrd'] as const;

  return (
    <div>
      <PageHeader
        title="Governance & Compliance"
        description="Framework mapping (BRSR, GRI, CSRD), metric submissions, and immutable audit logs."
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {frameworks.map((framework) => {
          const count =
            mappingsQuery.data?.filter((m) => m.framework === framework).length ?? 0;
          return (
            <Card key={framework}>
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-brand-400" />
                <div>
                  <p className="text-sm uppercase text-slate-400">{framework}</p>
                  <p className="text-2xl font-bold text-white">{count}</p>
                  <p className="text-xs text-slate-500">mapped metrics</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-brand-400" />
            <h2 className="text-lg font-semibold text-white">Framework mappings</h2>
          </div>
          <div className="mt-4 space-y-3">
            {mappingsQuery.data?.length ? (
              mappingsQuery.data.map((mapping) => (
                <div
                  key={mapping.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase text-brand-400">{mapping.framework}</span>
                    <span className="text-xs text-slate-500">{mapping.domain}</span>
                  </div>
                  <p className="mt-1 font-medium text-white">{mapping.metricTitle}</p>
                  <p className="text-sm text-slate-400">{mapping.metricCode}</p>
                </div>
              ))
            ) : (
              <EmptyState title="No framework mappings" description="Seed or configure BRSR/GRI/CSRD metrics." />
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-brand-400" />
            <h2 className="text-lg font-semibold text-white">Metric submissions</h2>
          </div>
          <div className="mt-4 space-y-3">
            {submissionsQuery.data?.length ? (
              submissionsQuery.data.map((submission) => (
                <div
                  key={submission.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-white">{submission.snapshotMetricTitle}</h3>
                    <StatusBadge status={submission.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-400">
                    {submission.snapshotFramework.toUpperCase()} · {submission.reportedValue}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState title="No submissions yet" description="Framework metric submissions appear here." />
            )}
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <h2 className="text-lg font-semibold text-white">Immutable audit log</h2>
          <p className="mt-1 text-sm text-slate-400">Append-only record of all mutating API actions</p>
          <div className="mt-4 max-h-80 space-y-2 overflow-y-auto">
            {auditQuery.data?.length ? (
              auditQuery.data.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded-lg border border-slate-800 px-3 py-2 text-sm"
                >
                  <span className="text-slate-300">{log.action}</span>
                  <span className="text-xs text-slate-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <EmptyState title="No audit entries" description="Mutations will be logged automatically." />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
