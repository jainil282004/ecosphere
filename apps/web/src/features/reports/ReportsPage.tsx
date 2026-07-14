import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Play,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { useOrgContext } from '@/hooks/useAuth';
import { apiClient, apiDownload, triggerBrowserDownload } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import {
  Button,
  Card,
  EmptyState,
  PageHeader,
  Section,
  StatusBadge,
} from '@/components/ui';
import type { ReportExportFormat } from '@ecosphere/shared';

const REPORT_TYPES = [
  { value: 'esg_summary', label: 'ESG Summary Report' },
  { value: 'environmental', label: 'Environmental Report' },
  { value: 'social', label: 'Social Report' },
  { value: 'governance', label: 'Governance Report' },
  { value: 'custom', label: 'Custom Report Builder' },
] as const;

const MODULES = [
  { value: '', label: 'All modules' },
  { value: 'environmental', label: 'Environmental' },
  { value: 'social', label: 'Social' },
  { value: 'governance', label: 'Governance' },
  { value: 'summary', label: 'Summary' },
] as const;

const FORMATS: {
  value: ReportExportFormat;
  label: string;
  icon: typeof FileText;
  tone: 'brand' | 'accent' | 'gold';
}[] = [
  { value: 'pdf', label: 'PDF', icon: FileText, tone: 'brand' },
  { value: 'xlsx', label: 'Excel', icon: FileSpreadsheet, tone: 'accent' },
  { value: 'csv', label: 'CSV', icon: Download, tone: 'gold' },
];

interface ReportRow {
  id: string;
  reportType: string;
  generatedAt: string;
  periodStart: string;
  periodEnd: string;
  fileKey: string | null;
  compositeScore: number | null;
}

interface PipelineRow {
  id: string;
  reportType: string;
  status: string;
  createdAt: string;
  currentStep: string;
}

function pipelineIcon(status: string) {
  if (status === 'completed') return <CheckCircle2 className="h-4 w-4 text-brand-300" />;
  if (status === 'failed') return <XCircle className="h-4 w-4 text-danger-300" />;
  return <Clock className="h-4 w-4 text-accent-300" />;
}

export function ReportsPage() {
  const { orgId } = useOrgContext();
  const queryClient = useQueryClient();
  const [reportType, setReportType] = useState('esg_summary');
  const [module, setModule] = useState('');
  const [periodStart, setPeriodStart] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().slice(0, 10);
  });
  const [periodEnd, setPeriodEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [departmentId, setDepartmentId] = useState('');
  const [exportingFormat, setExportingFormat] = useState<ReportExportFormat | null>(null);

  const reportsQuery = useQuery({
    queryKey: queryKeys.reports.list(orgId!),
    queryFn: () => apiClient<ReportRow[]>(`/orgs/${orgId}/reports`),
    enabled: Boolean(orgId),
  });

  const pipelineQuery = useQuery({
    queryKey: queryKeys.reports.pipeline(orgId!),
    queryFn: () => apiClient<PipelineRow[]>(`/orgs/${orgId}/reports/pipeline`),
    enabled: Boolean(orgId),
  });

  const departmentsQuery = useQuery({
    queryKey: queryKeys.departments(orgId!),
    queryFn: () =>
      apiClient<Array<{ id: string; name: string; code: string }>>(`/orgs/${orgId}/departments`),
    enabled: Boolean(orgId),
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      apiClient(`/orgs/${orgId}/reports/generate`, {
        method: 'POST',
        body: { formats: ['pdf', 'xlsx', 'csv'] },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.list(orgId!) });
    },
  });

  const pipelineMutation = useMutation({
    mutationFn: () =>
      apiClient(`/orgs/${orgId}/reports/pipeline`, {
        method: 'POST',
        body: {
          reportType,
          periodStart: new Date(periodStart).toISOString(),
          periodEnd: new Date(periodEnd + 'T23:59:59').toISOString(),
          formats: ['pdf', 'xlsx', 'csv'],
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.pipeline(orgId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.list(orgId!) });
    },
  });

  const handleExport = async (format: ReportExportFormat) => {
    if (!orgId) return;
    setExportingFormat(format);
    try {
      const { blob, filename } = await apiDownload(`/orgs/${orgId}/reports/export`, {
        method: 'POST',
        body: {
          format,
          reportType,
          periodStart: new Date(periodStart).toISOString(),
          periodEnd: new Date(periodEnd + 'T23:59:59').toISOString(),
          ...(module ? { module } : {}),
          ...(departmentId ? { departmentId } : {}),
        },
      });
      triggerBrowserDownload(blob, filename);
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.list(orgId) });
    } catch (err) {
      console.error('Export error:', err);
      alert(err instanceof Error ? err.message : 'Export failed.');
    } finally {
      setExportingFormat(null);
    }
  };

  const handleDownloadExisting = async (reportId: string, format: ReportExportFormat) => {
    if (!orgId) return;
    setExportingFormat(format);
    try {
      const { blob, filename } = await apiDownload(
        `/orgs/${orgId}/reports/${reportId}/export`,
        { params: { format } },
      );
      triggerBrowserDownload(blob, filename);
    } catch (err) {
      console.error('Download error:', err);
      alert(err instanceof Error ? err.message : 'Download failed.');
    } finally {
      setExportingFormat(null);
    }
  };

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Reports"
        title="ESG Reports & Exports"
        description="Generate Environmental, Social, and Governance reports. Export to PDF, Excel, or CSV for audits, board reviews, and compliance submissions."
        breadcrumbs={[{ label: 'EcoSphere', to: '/' }, { label: 'Reports' }]}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* Builder */}
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">
                <Filter className="h-3.5 w-3.5" /> Custom Report Builder
              </p>
              <h2 className="mt-3 h-section">Build &amp; export</h2>
              <p className="mt-1 text-sm text-slate-400">
                Filter by department, date range, and ESG module — then download in your preferred format.
              </p>
            </div>
            <span className="chip-brand hidden sm:inline-flex">Live data</span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="report-type">Report type</label>
              <select
                id="report-type"
                className="input"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                {REPORT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="report-module">Module</label>
              <select
                id="report-module"
                className="input"
                value={module}
                onChange={(e) => setModule(e.target.value)}
              >
                {MODULES.map((m) => (
                  <option key={m.value || 'all'} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="period-start">Period start</label>
              <input
                id="period-start"
                type="date"
                className="input"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="period-end">Period end</label>
              <input
                id="period-end"
                type="date"
                className="input"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="department">Department (optional)</label>
              <select
                id="department"
                className="input"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
              >
                <option value="">All departments</option>
                {departmentsQuery.data?.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {FORMATS.map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                type="button"
                variant="secondary"
                loading={exportingFormat === value}
                disabled={exportingFormat !== null && exportingFormat !== value}
                onClick={() => handleExport(value)}
                leftIcon={exportingFormat !== value ? <Icon className="h-4 w-4" /> : undefined}
              >
                {exportingFormat === value ? `Exporting ${label}…` : `Export ${label}`}
              </Button>
            ))}
          </div>

          <div className="divider" />

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              loading={generateMutation.isPending}
              onClick={() => generateMutation.mutate()}
              leftIcon={!generateMutation.isPending ? <Sparkles className="h-4 w-4" /> : undefined}
            >
              Generate quarterly ESG score
            </Button>
            <Button
              type="button"
              variant="outline"
              loading={pipelineMutation.isPending}
              onClick={() => pipelineMutation.mutate()}
              leftIcon={!pipelineMutation.isPending ? <Play className="h-4 w-4" /> : undefined}
            >
              Run full pipeline (all formats)
            </Button>
          </div>
        </Card>

        {/* Pipeline */}
        <Card>
          <p className="eyebrow"><Clock className="h-3.5 w-3.5" /> Pipeline</p>
          <h2 className="mt-3 h-section">Recent jobs</h2>
          <p className="mt-1 text-sm text-slate-400">Automated multi-step generation with signed exports.</p>

          <div className="mt-5 space-y-2.5">
            {pipelineQuery.data?.length ? (
              pipelineQuery.data.slice(0, 8).map((job) => (
                <div
                  key={job.id}
                  className="rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 transition hover:border-brand-400/25"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {pipelineIcon(job.status)}
                        <p className="truncate text-sm font-semibold text-white">{job.reportType}</p>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        Step: <span className="text-slate-300">{job.currentStep}</span> ·{' '}
                        {new Date(job.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>
                  {job.status === 'completed' ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {FORMATS.map(({ value, label, icon: Icon }) => (
                        <button
                          key={value}
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:border-brand-400/30 hover:text-white"
                          onClick={() =>
                            orgId &&
                            apiDownload(`/orgs/${orgId}/reports/pipeline/${job.id}/export`, {
                              params: { format: value },
                            })
                              .then(({ blob, filename }) => triggerBrowserDownload(blob, filename))
                              .catch((err) => {
                                console.error('Pipeline export error:', err);
                                alert(err instanceof Error ? err.message : 'Pipeline export failed.');
                              })
                          }
                        >
                          <Icon className="h-3.5 w-3.5" /> {label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <EmptyState
                title="No pipeline jobs yet"
                description="Run the full pipeline to see multi-step generation results with downloadable artifacts."
                icon={<Clock className="h-5 w-5" />}
              />
            )}
          </div>
        </Card>
      </div>

      <Section
        eyebrow="Archive"
        title="Generated reports"
        description="Every generated report is stored with signed metadata and can be re-exported in any format."
      >
        <div className="grid gap-3">
          {reportsQuery.data?.length ? (
            reportsQuery.data.map((report) => (
              <div
                key={report.id}
                className="card-tight flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-brand-300" />
                    <p className="truncate text-sm font-semibold text-white">{report.reportType}</p>
                    {report.compositeScore != null ? (
                      <span className="chip-brand num">
                        Score {report.compositeScore.toFixed(1)}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(report.periodStart).toLocaleDateString()} —{' '}
                    {new Date(report.periodEnd).toLocaleDateString()} · Generated{' '}
                    {new Date(report.generatedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {FORMATS.map(({ value, label, icon: Icon }) => (
                    <Button
                      key={value}
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={exportingFormat !== null}
                      onClick={() => handleDownloadExisting(report.id, value)}
                      leftIcon={<Icon className="h-3.5 w-3.5" />}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="No reports generated yet"
              description="Use the builder above or generate a quarterly ESG score to populate this archive."
              icon={<FileText className="h-5 w-5" />}
            />
          )}
        </div>
      </Section>
    </div>
  );
}
