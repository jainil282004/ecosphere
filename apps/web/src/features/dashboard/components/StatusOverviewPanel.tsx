import { Card, Skeleton } from '@/components/ui';
import { motion } from 'framer-motion';
import { ActivitySquare } from 'lucide-react';
import type { DashboardMetrics, CarbonFootprintSummary } from '@ecosphere/shared';

interface StatusOverviewPanelProps {
  metrics: DashboardMetrics | undefined;
  footprint: CarbonFootprintSummary | undefined;
  isLoading: boolean;
}

export function StatusOverviewPanel({ metrics, footprint, isLoading }: StatusOverviewPanelProps) {
  if (isLoading) {
    return (
      <Card className="h-full">
        <div className="p-6 space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </Card>
    );
  }

  const scopeTotal = footprint
    ? footprint.scope1Kg + footprint.scope2Kg + footprint.scope3Kg
    : metrics?.totalCarbonKg ?? 0;

  const statuses = [
    {
      id: 'esg',
      label: 'ESG Performance',
      value: (metrics?.esgScore ?? 0) > 70 ? 'Healthy' : 'Needs Attention',
      status: (metrics?.esgScore ?? 0) > 70 ? 'success' : 'warning',
      color: (metrics?.esgScore ?? 0) > 70 ? 'bg-green-500' : 'bg-gold-500'
    },
    {
      id: 'compliance',
      label: 'Compliance',
      value: (metrics?.openComplianceIssues ?? 0) > 0 ? `${metrics?.openComplianceIssues} Open Issues` : 'Up to Date',
      status: (metrics?.openComplianceIssues ?? 0) > 0 ? 'warning' : 'success',
      color: (metrics?.openComplianceIssues ?? 0) > 0 ? 'bg-gold-500' : 'bg-green-500'
    },
    {
      id: 'carbon',
      label: 'Carbon Emission',
      value: scopeTotal > 1000 ? 'Above Target' : 'On Track',
      status: scopeTotal > 1000 ? 'critical' : 'success',
      color: scopeTotal > 1000 ? 'bg-red-500' : 'bg-green-500'
    },
    {
      id: 'water',
      label: 'Water Usage',
      value: 'Normal',
      status: 'info',
      color: 'bg-blue-500'
    }
  ];

  return (
    <Card className="h-full flex flex-col p-0 overflow-hidden border-white/[0.08] shadow-panel">
      <div className="p-6 border-b border-white/[0.06] flex items-center gap-2">
        <ActivitySquare className="w-5 h-5 text-brand-400" />
        <h3 className="font-display text-lg font-semibold text-white tracking-tight">Status Overview</h3>
      </div>
      <div className="p-6 flex-1 flex flex-col justify-center gap-4">
        {statuses.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + idx * 0.1, duration: 0.3 }}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] ${item.color} shadow-${item.color.replace('bg-', '')}`} />
              <span className="text-sm font-medium text-slate-300">{item.label}</span>
            </div>
            <span className={`text-xs font-bold uppercase tracking-wider ${item.color.replace('bg-', 'text-')}`}>
              {item.value}
            </span>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
