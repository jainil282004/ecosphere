import { useQuery } from '@tanstack/react-query';
import { Building2, FileDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useOrgContext } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { Card, EmptyState, PageHeader } from '@/components/ui';
import { EmployeeDirectoryPanel } from '@/features/dashboard/components/EmployeeDirectoryPanel';

export function AdminPage() {
  const { orgId } = useOrgContext();

  const departmentsQuery = useQuery({
    queryKey: queryKeys.departments(orgId!),
    queryFn: () =>
      apiClient<Array<{ id: string; name: string; code: string }>>(`/orgs/${orgId}/departments`),
    enabled: Boolean(orgId),
  });

  const reportsQuery = useQuery({
    queryKey: queryKeys.reports.list(orgId!),
    queryFn: () =>
      apiClient<Array<{ id: string; reportType: string; generatedAt: string }>>(
        `/orgs/${orgId}/reports`,
      ),
    enabled: Boolean(orgId),
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Administration"
        title="Organization Administration"
        description="Departments, employee roster, and reporting artifacts for operational oversight."
        breadcrumbs={[{ label: 'EcoSphere', to: '/' }, { label: 'Administration' }]}
      />

      {orgId ? <EmployeeDirectoryPanel orgId={orgId} /> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-brand-300" />
            <h2 className="h-section">Departments</h2>
          </div>
          <p className="mt-1 text-sm text-slate-400">Organizational structure and ESG ownership.</p>
          <div className="mt-5 space-y-2">
            {departmentsQuery.data?.length ? (
              departmentsQuery.data.map((department) => (
                <div key={department.id} className="table-row grid-cols-[1fr_auto]">
                  <span className="font-medium text-white">{department.name}</span>
                  <span className="chip-brand num">{department.code}</span>
                </div>
              ))
            ) : (
              <EmptyState
                title="No departments yet"
                description="Add departments to organize teams and assign ESG owners."
              />
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <FileDown className="h-5 w-5 text-accent-300" />
            <h2 className="h-section">Generated reports</h2>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Export PDF, Excel, or CSV from the{' '}
            <Link
              to={`/orgs/${orgId}/reports`}
              className="font-semibold text-brand-300 hover:text-brand-200"
            >
              Reports
            </Link>{' '}
            page.
          </p>
          <div className="mt-5 space-y-2">
            {reportsQuery.data?.length ? (
              reportsQuery.data.slice(0, 8).map((report) => (
                <div key={report.id} className="table-row grid-cols-[1fr_auto]">
                  <span className="truncate text-sm text-slate-200">{report.reportType}</span>
                  <span className="text-xs text-slate-500">
                    {new Date(report.generatedAt).toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <EmptyState
                title="No reports generated"
                description="Generate an ESG score report from the Reports page to populate this list."
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
