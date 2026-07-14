import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ShieldAlert, Activity, User, Monitor, Clock } from 'lucide-react';
import { queryKeys } from '@/lib/query-keys';
import { apiClient } from '@/lib/api-client';
import { LoadingScreen } from '@/components/ui';
import { useOrgContext } from '@/hooks/useAuth';
import type { AuditLogRecord } from '@ecosphere/shared';

export function AuditLogsPage() {
  const { orgId } = useOrgContext();
  const { data: logs, isLoading } = useQuery({
    queryKey: [...queryKeys.governance.auditLogs(orgId!), 'all'],
    queryFn: () =>
      apiClient<AuditLogRecord[]>(`/orgs/${orgId}/governance/audit-logs?limit=50`),
    enabled: Boolean(orgId),
  });

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="h-page flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-brand-400" />
          Audit Logs
        </h1>
        <p className="mt-2 text-slate-400">
          Strictly confidential. Monitor all employee and administrative actions within the organization.
        </p>
      </header>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 shadow-panel">
        {logs?.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Monitor className="mx-auto h-8 w-8 mb-3 opacity-50" />
            <p>No audit logs recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/[0.06] text-xs uppercase text-slate-500">
                <tr>
                  <th className="pb-3 pr-4 font-medium">Timestamp</th>
                  <th className="pb-3 pr-4 font-medium">Actor</th>
                  <th className="pb-3 pr-4 font-medium">Action</th>
                  <th className="pb-3 font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {logs?.map((log) => (
                  <tr key={log.id} className="transition hover:bg-white/[0.02]">
                    <td className="py-4 pr-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Clock className="h-3.5 w-3.5 text-slate-500" />
                        {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm:ss')}
                      </div>
                    </td>
                    <td className="py-4 pr-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-500/20">
                          <User className="h-3 w-3 text-accent-300" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-200">
                            {log.user?.firstName} {log.user?.lastName}
                          </p>
                          <p className="text-xs text-slate-500">{log.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
                          log.action === 'Failed Login'
                            ? 'border-red-400/20 bg-red-500/10 text-red-400'
                            : 'border-brand-400/20 bg-brand-500/10 text-brand-300'
                        }`}
                      >
                        <Activity className="h-3 w-3" />
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4">
                      {log.details ? (
                        <pre className="max-w-xs overflow-hidden text-ellipsis rounded-md bg-ink-950 p-2 text-[10px] text-slate-400">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      ) : (
                        <span className="text-xs text-slate-500">No additional details</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
