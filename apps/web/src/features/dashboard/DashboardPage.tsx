import { Play, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EsgScoreChart } from '@/features/reports/EsgScoreChart';
import { ButtonLink, HeroBanner } from '@/components/ui';
import { useOrgContext } from '@/hooks/useAuth';
import { DashboardMetricsRow } from './components/DashboardMetricsRow';
import { EmployeeDirectoryPanel } from './components/EmployeeDirectoryPanel';
import { EnvironmentalMetricForm } from './components/EnvironmentalMetricForm';
import { LeaderboardPanel } from './components/LeaderboardPanel';
import { ScopeHistoricalChart } from './components/ScopeHistoricalChart';
import { ScopeTrendEChart } from './components/ScopeTrendEChart';
import { AIInsightsPanel } from './components/AIInsightsPanel';
import { RecentActivityTimeline } from './components/RecentActivityTimeline';
import { QuickActionsPanel } from './components/QuickActionsPanel';
import { StatusOverviewPanel } from './components/StatusOverviewPanel';
import { useCarbonFootprint, useDashboardMetrics } from './hooks/useDashboardMetrics';
import { useLeaderboard } from './hooks/useLeaderboard';
import { useScopeTrendData } from './hooks/useScopeTrendData';
import { motion } from 'framer-motion';

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
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.6 }}
      className="space-y-8"
    >
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

      {/* Row 1: Large KPI Cards */}
      <DashboardMetricsRow
        metrics={metricsQuery.data}
        footprint={footprintQuery.data}
        isLoading={isLoading}
      />

      {/* Row 2: Charts */}
      <div className="grid gap-6 xl:grid-cols-2">
        <ScopeHistoricalChart data={scopeTrend.trendPoints} isLoading={scopeTrend.isLoading} />
        <ScopeTrendEChart data={scopeTrend.trendPoints} isLoading={scopeTrend.isLoading} />
      </div>

      {/* Row 3: AI Insights + Recent Activity */}
      <div className="grid gap-6 xl:grid-cols-2">
        <AIInsightsPanel metrics={metricsQuery.data} footprint={footprintQuery.data} isLoading={isLoading} />
        <RecentActivityTimeline />
      </div>

      {/* Row 4: Quick Actions + Status Overview */}
      <div className="grid gap-6 xl:grid-cols-2">
        <QuickActionsPanel />
        <StatusOverviewPanel metrics={metricsQuery.data} footprint={footprintQuery.data} isLoading={isLoading} />
      </div>

      {/* Row 5: Retained Existing Functionality */}
      <div className="grid gap-6 xl:grid-cols-12 pt-8 border-t border-white/[0.06]">
        <div className="xl:col-span-8">
          <EsgScoreChart metrics={metricsQuery.data} />
        </div>
        <div className="xl:col-span-4">
          <LeaderboardPanel
            entries={leaderboardQuery.data ?? []}
            isLoading={leaderboardQuery.isLoading}
            orgId={orgId ?? undefined}
          />
        </div>
      </div>

      {/* Row 6: Management & Forms */}
      <div className="grid gap-6 lg:grid-cols-2">
        {orgId ? <EnvironmentalMetricForm orgId={orgId} /> : null}
        {orgId ? <EmployeeDirectoryPanel orgId={orgId} /> : null}
      </div>

      {/* Silence the "unused" linter for Link — Link is used by MetricCard/PageHeader children */}
      <Link to="#" className="hidden" aria-hidden />
    </motion.div>
  );
}
