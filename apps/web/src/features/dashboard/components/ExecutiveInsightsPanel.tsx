import { ArrowDownRight, ArrowUpRight, ClipboardCheck, Target } from 'lucide-react';
import type { CarbonFootprintSummary, DashboardMetrics } from '@ecosphere/shared';
import type { ScopeTrendPoint } from '../types';

interface ExecutiveInsightsPanelProps {
  metrics: DashboardMetrics | undefined;
  footprint: CarbonFootprintSummary | undefined;
  trendPoints: ScopeTrendPoint[];
  isSampleData: boolean;
}

function formatKg(value: number) {
  return `${Math.round(value).toLocaleString()} kg`;
}

interface InsightProps {
  eyebrow: string;
  headline: string;
  body: string;
  icon: React.ReactNode;
  tone: 'brand' | 'accent' | 'gold';
  chip?: string;
}

const TONE = {
  brand: { bar: 'bg-brand-gradient', ring: 'ring-brand-400/25', text: 'text-brand-300' },
  accent: { bar: 'bg-accent-gradient', ring: 'ring-accent-400/25', text: 'text-accent-300' },
  gold: {
    bar: 'bg-gradient-to-r from-gold-500 to-gold-300',
    ring: 'ring-gold-400/25',
    text: 'text-gold-300',
  },
} as const;

function InsightCard({ eyebrow, headline, body, icon, tone, chip }: InsightProps) {
  const t = TONE[tone];
  return (
    <div className="card relative overflow-hidden">
      <div className={`absolute inset-x-0 top-0 h-[3px] ${t.bar}`} />
      <div className="flex items-start gap-4">
        <div className={`shrink-0 rounded-2xl bg-white/5 p-3 ring-1 ${t.ring} ${t.text}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="eyebrow">{eyebrow}</p>
          <p className="mt-3 font-display text-3xl font-bold tracking-tight text-white">
            <span className="num">{headline}</span>
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-400">{body}</p>
          {chip ? (
            <span className="chip-brand mt-3 inline-flex">
              {chip}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function ExecutiveInsightsPanel({
  metrics,
  footprint,
  trendPoints,
  isSampleData,
}: ExecutiveInsightsPanelProps) {
  const first = trendPoints[0];
  const latest = trendPoints[trendPoints.length - 1];
  const changePercent =
    first && latest && first.total > 0 ? ((latest.total - first.total) / first.total) * 100 : 0;

  const totalCarbon =
    footprint !== undefined
      ? footprint.scope1Kg + footprint.scope2Kg + footprint.scope3Kg
      : metrics?.totalCarbonKg ?? latest?.total ?? 0;

  const openIssues = metrics?.openComplianceIssues ?? 0;
  const pendingApprovals = metrics?.pendingApprovals ?? 0;
  const improving = changePercent <= 0;

  return (
    <section className="grid gap-4 lg:grid-cols-3" aria-label="Executive ESG insights">
      <InsightCard
        eyebrow="Emission Momentum"
        headline={`${improving ? '' : '+'}${changePercent.toFixed(1)}%`}
        body={`Trajectory from ${first?.month ?? 'baseline'} to ${latest?.month ?? 'current'} — footprint at ${formatKg(totalCarbon)}.`}
        icon={improving ? <ArrowDownRight className="h-6 w-6" /> : <ArrowUpRight className="h-6 w-6" />}
        tone={improving ? 'brand' : 'gold'}
        chip={isSampleData ? 'Demo data — log metrics to activate' : undefined}
      />
      <InsightCard
        eyebrow="Priority Focus"
        headline="Scope 3"
        body="Value-chain emissions remain the largest opportunity — prioritize vendor data, business travel, and procurement controls."
        icon={<Target className="h-6 w-6" />}
        tone="accent"
      />
      <InsightCard
        eyebrow="Governance Readiness"
        headline={`${pendingApprovals + openIssues}`}
        body={`${pendingApprovals} approvals and ${openIssues} compliance issues need attention before the next reporting cycle.`}
        icon={<ClipboardCheck className="h-6 w-6" />}
        tone={pendingApprovals + openIssues > 0 ? 'gold' : 'brand'}
      />
    </section>
  );
}
