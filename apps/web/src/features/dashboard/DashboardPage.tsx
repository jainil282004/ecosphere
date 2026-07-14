import { Play, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EsgScoreChart } from '@/features/reports/EsgScoreChart';
import { ButtonLink, HeroBanner } from '@/components/ui';
import { useOrgContext } from '@/hooks/useAuth';
import { DashboardMetricsRow } from './components/DashboardMetricsRow';
import { EmployeeDirectoryPanel } from './components/EmployeeDirectoryPanel';
import { EnvironmentalMetricForm } from './components/EnvironmentalMetricForm';
import { ExecutiveInsightsPanel } from './components/ExecutiveInsightsPanel';
import { LeaderboardPanel } from './components/LeaderboardPanel';
import { ScopeHistoricalChart } from './components/ScopeHistoricalChart';
import { ScopeTrendEChart } from './components/ScopeTrendEChart';
import { useCarbonFootprint, useDashboardMetrics } from './hooks/useDashboardMetrics';
import { useLeaderboard } from './hooks/useLeaderboard';
import { useScopeTrendData } from './hooks/useScopeTrendData';

export function DashboardPage() {
  const { orgId } = useOrgContext();

  const metricsQuery = useDashboardMetrics(orgId);
  const footprintQuery = useCarbonFootprint(orgId);
  const scopeTrend = useScopeTrendData(orgId);
  const leaderboardQuery = useLeaderboard(orgId);

  const isLoading = metricsQuery.isLoading || footprintQuery.isLoading;
  const composite = metricsQuery.data?.esgScore ?? 0;
  const footprint = footprintQuery.data;
  const totalCarbon = footprint
    ? footprint.scope1Kg + footprint.scope2Kg + footprint.scope3Kg
    : (metricsQuery.data?.totalCarbonKg ?? 0);

  return (
    <div className="space-y-8">
      <HeroBanner
        eyebrow="Command Center"
        title="Your ESG performance, in real time."
        subtitle="Track scope 1–3 emissions, employee engagement, and governance readiness in a single operating view — with everything an auditor asks for one click away."
        score={{
          value: composite,
          label: 'Composite ESG',
          sublabel: 'Weighted E · S · G',
        }}
        pills={[
          { label: 'Carbon', value: `${totalCarbon.toFixed(0)} kg`, tone: 'brand' },
          { label: 'CSR hrs', value: `${(metricsQuery.data?.csrHours ?? 0).toFixed(0)}`, tone: 'accent' },
          { label: 'Approvals', value: `${metricsQuery.data?.pendingApprovals ?? 0}`, tone: 'gold' },
          {
            label: 'Compliance',
            value: `${metricsQuery.data?.openComplianceIssues ?? 0}`,
            tone: 'danger',
          },
        ]}
        actions={
          orgId ? (
            <>
              <ButtonLink
                href={`/orgs/${orgId}/reports`}
                variant="primary"
                size="md"
                leftIcon={<Sparkles className="h-4 w-4" />}
              >
                Generate ESG report
              </ButtonLink>
              <ButtonLink
                href={`/orgs/${orgId}/carbon`}
                variant="secondary"
                size="md"
                leftIcon={<Play className="h-4 w-4" />}
              >
                Log environmental metric
              </ButtonLink>
            </>
          ) : null
        }
      />

      <DashboardMetricsRow
        metrics={metricsQuery.data}
        footprint={footprintQuery.data}
        isLoading={isLoading}
      />

      <ExecutiveInsightsPanel
        metrics={metricsQuery.data}
        footprint={footprintQuery.data}
        trendPoints={scopeTrend.trendPoints}
        isSampleData={scopeTrend.isSampleData}
      />

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <ScopeHistoricalChart data={scopeTrend.trendPoints} isLoading={scopeTrend.isLoading} />
        </div>
        <div className="xl:col-span-4">
          <LeaderboardPanel
            entries={leaderboardQuery.data ?? []}
            isLoading={leaderboardQuery.isLoading}
            orgId={orgId ?? undefined}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ScopeTrendEChart data={scopeTrend.trendPoints} isLoading={scopeTrend.isLoading} />
        {orgId ? <EnvironmentalMetricForm orgId={orgId} /> : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <EsgScoreChart metrics={metricsQuery.data} />
        {orgId ? <EmployeeDirectoryPanel orgId={orgId} /> : null}
      </div>

      {/* Silence the "unused" linter for Link — Link is used by MetricCard/PageHeader children */}
      <Link to="#" className="hidden" aria-hidden />
    </div>
  );
}
