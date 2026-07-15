import { Play, Sparkles } from 'lucide-react';
import { ButtonLink, HeroBanner } from '@/components/ui';
import { useOrgContext } from '@/hooks/useAuth';
import { DashboardMetricsRow } from './components/DashboardMetricsRow';
import { EmployeeDirectoryPanel } from './components/EmployeeDirectoryPanel';
import { EnvironmentalMetricForm } from './components/EnvironmentalMetricForm';
import { LeaderboardPanel } from './components/LeaderboardPanel';
import { AIInsightsPanel } from './components/AIInsightsPanel';
import { RecentActivityTimeline } from './components/RecentActivityTimeline';
import { QuickActionsPanel } from './components/QuickActionsPanel';
import { StatusOverviewPanel } from './components/StatusOverviewPanel';
import { useCarbonFootprint, useDashboardMetrics } from './hooks/useDashboardMetrics';
import { useScopeTrendData } from './hooks/useScopeTrendData';
import { motion } from 'framer-motion';

// New Enterprise BI Components
import { DashboardFilterProvider } from './components/DashboardFilterContext';
import { FilterBar } from './components/FilterBar';
import { EsgHeatmap } from './components/EsgHeatmap';
import { ForecastWidget } from './components/ForecastWidget';
import { DrillDownModal } from './components/DrillDownModal';
import { AIRiskAnalysis } from './components/AIRiskAnalysis';
import { AISustainabilityScore } from './components/AISustainabilityScore';
import { useState } from 'react';
import {
  MonthlyCarbonChart,
  EnergyConsumptionChart,
  WaterUsageChart,
  WasteRecyclingChart,
  EsgScoreTrendChart,
  DepartmentComparisonChart,
  CarbonSourcePie,
  ComplianceStackedBar,
} from './components/charts/EnterpriseCharts';

function InnerDashboardPage() {
  const { orgId } = useOrgContext();

  const metricsQuery = useDashboardMetrics(orgId);
  const footprintQuery = useCarbonFootprint(orgId);
  const scopeTrend = useScopeTrendData(orgId);

  const [drillDownOpen, setDrillDownOpen] = useState(false);

  const isLoading = metricsQuery.isLoading || footprintQuery.isLoading;
  const composite = metricsQuery.data?.esgScore ?? 0;
  const footprint = footprintQuery.data;
  const totalCarbon = footprint
    ? footprint.scope1Kg + footprint.scope2Kg + footprint.scope3Kg
    : (metricsQuery.data?.totalCarbonKg ?? 0);

  // Mock data for new charts until full API wiring is complete
  const mockChartData = {
    monthlyCarbon: scopeTrend.trendPoints.length ? scopeTrend.trendPoints.map(p => ({ month: p.month, totalCo2e: Number(p.scope1) + Number(p.scope2) + Number(p.scope3) })) : [
      { month: 'Jan', totalCo2e: 4000 }, { month: 'Feb', totalCo2e: 3500 }, { month: 'Mar', totalCo2e: 3200 },
      { month: 'Apr', totalCo2e: 2800 }, { month: 'May', totalCo2e: 2500 }
    ],
    energy: [{ month: 'Jan', energy: 20000 }, { month: 'Feb', energy: 18000 }, { month: 'Mar', energy: 17500 }, { month: 'Apr', energy: 16000 }, { month: 'May', energy: 15000 }],
    water: [{ month: 'Jan', water: 1000 }, { month: 'Feb', water: 950 }, { month: 'Mar', water: 900 }, { month: 'Apr', water: 850 }, { month: 'May', water: 820 }],
    waste: [{ name: 'Recycled', value: 65 }, { name: 'Compost', value: 15 }, { name: 'Landfill', value: 20 }],
    esgScore: [{ month: 'Jan', score: 65 }, { month: 'Feb', score: 68 }, { month: 'Mar', score: 72 }, { month: 'Apr', score: 75 }, { month: 'May', score: 78 }],
    dept: [{ name: 'Operations', emissions: 1200 }, { name: 'Manufacturing', emissions: 900 }, { name: 'Logistics', emissions: 600 }, { name: 'IT', emissions: 300 }, { name: 'HR', emissions: 100 }],
    sources: [{ name: 'Scope 1', value: 1500 }, { name: 'Scope 2', value: 2000 }, { name: 'Scope 3', value: 3500 }],
    compliance: [{ month: 'Jan', resolved: 10, open: 5 }, { month: 'Feb', resolved: 12, open: 4 }, { month: 'Mar', resolved: 15, open: 2 }, { month: 'Apr', resolved: 18, open: 1 }]
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.6 }}
      className="space-y-8"
      onClick={() => drillDownOpen && setDrillDownOpen(false)}
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

      {/* Enterprise BI Filter Bar */}
      <FilterBar />

      {/* Row 1: Large KPI Cards */}
      <DashboardMetricsRow
        metrics={metricsQuery.data}
        footprint={footprintQuery.data}
        isLoading={isLoading}
      />

      {/* Row 2: Advanced AI Forecasting & Heatmap */}
      <div className="grid gap-6 xl:grid-cols-2">
        <ForecastWidget historicalCarbon={mockChartData.monthlyCarbon} historicalScore={composite} />
        <EsgHeatmap />
      </div>

      {/* Row 3: 4 Enterprise Charts */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 cursor-pointer" onClick={(e) => { e.stopPropagation(); setDrillDownOpen(true); }}>
        <MonthlyCarbonChart data={mockChartData.monthlyCarbon} loading={scopeTrend.isLoading} />
        <EnergyConsumptionChart data={mockChartData.energy} />
        <WaterUsageChart data={mockChartData.water} />
        <WasteRecyclingChart data={mockChartData.waste} />
      </div>

      {/* Row 4: 4 Enterprise Charts */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 cursor-pointer" onClick={(e) => { e.stopPropagation(); setDrillDownOpen(true); }}>
        <EsgScoreTrendChart data={mockChartData.esgScore} />
        <DepartmentComparisonChart data={mockChartData.dept} />
        <CarbonSourcePie data={mockChartData.sources} />
        <ComplianceStackedBar data={mockChartData.compliance} />
      </div>

      {/* Row 5: AI Risk & Score */}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-1 h-[400px]">
          <AISustainabilityScore score={composite} />
        </div>
        <div className="xl:col-span-2 h-[400px]">
          <AIRiskAnalysis />
        </div>
      </div>

      {/* Row 5: AI Insights + Recent Activity */}
      <div className="grid gap-6 xl:grid-cols-2">
        <AIInsightsPanel metrics={metricsQuery.data} footprint={footprintQuery.data} isLoading={isLoading} />
        <RecentActivityTimeline />
      </div>

      {/* Row 6: Quick Actions + Status Overview */}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <QuickActionsPanel />
        </div>
        <div className="xl:col-span-1">
          <StatusOverviewPanel metrics={metricsQuery.data} footprint={footprintQuery.data} isLoading={isLoading} />
        </div>
      </div>

      {/* Row 7: Legacy Environment & Leaderboard */}
      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <EnvironmentalMetricForm orgId={orgId || ''} />
        <div className="space-y-6">
          <LeaderboardPanel entries={[]} isLoading={false} />
          <EmployeeDirectoryPanel orgId={orgId || ''} />
        </div>
      </div>

      {/* Drill-Down Modal */}
      <DrillDownModal 
        isOpen={drillDownOpen} 
        onClose={() => setDrillDownOpen(false)} 
        title="Environmental Analytics"
        data={{ mock: true }}
      />
    </motion.div>
  );
}

export function DashboardPage() {
  return (
    <DashboardFilterProvider>
      <InnerDashboardPage />
    </DashboardFilterProvider>
  );
}
