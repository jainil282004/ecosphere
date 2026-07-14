import { Activity, Award, Leaf, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { CarbonFootprintSummary, DashboardMetrics } from '@ecosphere/shared';
import { MetricCard, Skeleton } from '@/components/ui';
import { useOrgContext, usePermissions } from '@/hooks/useAuth';

interface DashboardMetricsRowProps {
  metrics: DashboardMetrics | undefined;
  footprint: CarbonFootprintSummary | undefined;
  isLoading: boolean;
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

  return (
    <section
      aria-label="Key sustainability metrics"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      <MetricCard
        label="Composite ESG Score"
        value={metrics?.esgScore ? metrics.esgScore.toFixed(1) : '0.0'}
        hint="Weighted E · S · G composite"
        icon={<Award className="h-5 w-5 text-brand-300" aria-hidden />}
        tone="brand"
      />
      <MetricCard
        label="Carbon Footprint"
        value={`${scopeTotal.toFixed(1)} kg`}
        hint={`S1 ${footprint?.scope1Kg.toFixed(0) ?? 0} · S2 ${footprint?.scope2Kg.toFixed(0) ?? 0} · S3 ${footprint?.scope3Kg.toFixed(0) ?? 0}`}
        icon={<Leaf className="h-5 w-5 text-brand-300" aria-hidden />}
        tone="brand"
        onClick={() => orgId && navigate(`/orgs/${orgId}/carbon`)}
      />
      <MetricCard
        label="CSR Volunteer Hours"
        value={metrics?.csrHours ? metrics.csrHours.toFixed(1) : '0.0'}
        hint="Approved social contributions"
        icon={<Users className="h-5 w-5 text-accent-300" aria-hidden />}
        tone="accent"
        onClick={() => orgId && navigate(`/orgs/${orgId}/csr`)}
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
        tone={pendingCount > 0 ? 'gold' : 'brand'}
        onClick={
          can('approve_submissions') && orgId
            ? () => navigate(`/orgs/${orgId}/approvals`)
            : undefined
        }
      />
    </section>
  );
}
