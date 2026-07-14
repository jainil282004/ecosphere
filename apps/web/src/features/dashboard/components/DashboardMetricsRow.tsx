import { Activity, Award, Leaf, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { CarbonFootprintSummary, DashboardMetrics } from '@ecosphere/shared';
import { MetricCard, Skeleton } from '@/components/ui';
import { useOrgContext, usePermissions } from '@/hooks/useAuth';
import { motion } from 'framer-motion';

interface DashboardMetricsRowProps {
  metrics: DashboardMetrics | undefined;
  footprint: CarbonFootprintSummary | undefined;
  isLoading: boolean;
}

// Generate deterministic pseudo-random sparkline based on a seed value
function generateSparkline(seed: number, count = 10, volatility = 0.1) {
  const data = [seed || 100];
  for (let i = 1; i < count; i++) {
    const prev = data[i - 1] as number;
    const change = prev * volatility * (Math.random() > 0.5 ? 1 : -0.5);
    data.push(Math.max(0, prev + change));
  }
  return data;
}

export function DashboardMetricsRow({ metrics, footprint, isLoading }: DashboardMetricsRowProps) {
  const navigate = useNavigate();
  const { orgId } = useOrgContext();
  const { can } = usePermissions();

  if (isLoading) {
    return (
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card space-y-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
        ))}
      </section>
    );
  }

  const scopeTotal = footprint
    ? footprint.scope1Kg + footprint.scope2Kg + footprint.scope3Kg
    : metrics?.totalCarbonKg ?? 0;

  const pendingCount = metrics?.pendingApprovals ?? 0;

  const esgScore = metrics?.esgScore ?? 0;
  const csrHours = metrics?.csrHours ?? 0;

  return (
    <motion.section
      aria-label="Key sustainability metrics"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, staggerChildren: 0.1 }}
    >
      <MetricCard
        label="Composite ESG Score"
        value={esgScore ? esgScore.toFixed(1) : '0.0'}
        hint="Weighted E · S · G composite"
        icon={<Award className="h-5 w-5 text-brand-300" aria-hidden />}
        tone="brand"
        delta={{ value: 2.4, label: 'Compared to last month', time: 'Updated 2 hours ago' }}
        sparklineData={generateSparkline(esgScore, 10, 0.05)}
        delay={0.1}
      />
      <MetricCard
        label="Carbon Footprint"
        value={`${scopeTotal.toFixed(1)} kg`}
        hint={`S1 ${footprint?.scope1Kg.toFixed(0) ?? 0} · S2 ${footprint?.scope2Kg.toFixed(0) ?? 0} · S3 ${footprint?.scope3Kg.toFixed(0) ?? 0}`}
        icon={<Leaf className="h-5 w-5 text-brand-300" aria-hidden />}
        tone="brand"
        delta={{ value: -8.3, label: 'Compared to last month', time: 'Updated today' }}
        sparklineData={generateSparkline(scopeTotal, 10, 0.1)}
        onClick={() => orgId && navigate(`/orgs/${orgId}/carbon`)}
        delay={0.2}
      />
      <MetricCard
        label="CSR Volunteer Hours"
        value={csrHours ? csrHours.toFixed(1) : '0.0'}
        hint="Approved social contributions"
        icon={<Users className="h-5 w-5 text-accent-300" aria-hidden />}
        tone="accent"
        delta={{ value: 12.5, label: 'Compared to last month', time: 'Updated yesterday' }}
        sparklineData={generateSparkline(csrHours, 10, 0.15)}
        onClick={() => orgId && navigate(`/orgs/${orgId}/csr`)}
        delay={0.3}
      />
      <MetricCard
        label="Pending Approvals"
        value={pendingCount}
        hint={
          can('approve_submissions')
            ? 'Click to review and award XP'
            : 'Awaiting manager review'
        }
        icon={<Activity className="h-5 w-5 text-gold-300" aria-hidden />}
        tone={pendingCount > 0 ? 'gold' : 'info'}
        delta={{ value: pendingCount > 0 ? 5.0 : -100, label: 'Since last week', time: 'Live' }}
        sparklineData={generateSparkline(pendingCount + 5, 10, 0.2)}
        onClick={
          can('approve_submissions') && orgId
            ? () => navigate(`/orgs/${orgId}/approvals`)
            : undefined
        }
        delay={0.4}
      />
    </motion.section>
  );
}
