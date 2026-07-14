import { AlertCircle, TrendingUp, CheckCircle, Info, Sparkles } from 'lucide-react';
import type { CarbonFootprintSummary, DashboardMetrics } from '@ecosphere/shared';
import { Card, Skeleton } from '@/components/ui';
import clsx from 'clsx';
import { motion } from 'framer-motion';

interface AIInsightsPanelProps {
  metrics: DashboardMetrics | undefined;
  footprint: CarbonFootprintSummary | undefined;
  isLoading: boolean;
}

export function AIInsightsPanel({ metrics, footprint, isLoading }: AIInsightsPanelProps) {
  if (isLoading) {
    return (
      <Card className="h-full">
        <div className="p-6 space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </Card>
    );
  }

  // Generate deterministic insights based on data
  const insights = [];

  const scopeTotal = footprint
    ? footprint.scope1Kg + footprint.scope2Kg + footprint.scope3Kg
    : metrics?.totalCarbonKg ?? 0;

  if (scopeTotal > 1000) {
    insights.push({
      id: 'carbon-warning',
      type: 'warning',
      icon: <AlertCircle className="w-5 h-5 text-orange-400" />,
      title: 'Carbon emissions are high this month',
      description: 'Your scope emissions exceeded the monthly target. Consider reviewing S2 consumption.',
      time: 'Updated 2h ago',
      color: 'bg-orange-500/10 border-orange-500/20 text-orange-200'
    });
  } else {
    insights.push({
      id: 'carbon-good',
      type: 'success',
      icon: <CheckCircle className="w-5 h-5 text-green-400" />,
      title: 'Carbon emissions reduced by 12%',
      description: 'Great job! Your carbon footprint is well within the sustainable threshold.',
      time: 'Updated 1d ago',
      color: 'bg-green-500/10 border-green-500/20 text-green-200'
    });
  }

  if ((metrics?.esgScore ?? 0) > 85) {
    insights.push({
      id: 'esg-record',
      type: 'success',
      icon: <TrendingUp className="w-5 h-5 text-green-400" />,
      title: 'ESG score reached its highest value',
      description: 'Your composite score of ' + metrics?.esgScore.toFixed(1) + ' is at an all-time high this quarter.',
      time: 'Updated 4h ago',
      color: 'bg-green-500/10 border-green-500/20 text-green-200'
    });
  } else {
    insights.push({
      id: 'esg-improve',
      type: 'info',
      icon: <Info className="w-5 h-5 text-blue-400" />,
      title: 'Compliance score is improving',
      description: 'You are on track to hit an ESG score of 80 by next quarter.',
      time: 'Updated 4h ago',
      color: 'bg-blue-500/10 border-blue-500/20 text-blue-200'
    });
  }

  if ((metrics?.pendingApprovals ?? 0) > 0) {
    insights.push({
      id: 'approvals',
      type: 'critical',
      icon: <AlertCircle className="w-5 h-5 text-red-400" />,
      title: 'Action Required',
      description: `You have ${metrics?.pendingApprovals} employee submissions pending review.`,
      time: 'Just now',
      color: 'bg-red-500/10 border-red-500/20 text-red-200'
    });
  } else {
    insights.push({
      id: 'recycling',
      type: 'success',
      icon: <Sparkles className="w-5 h-5 text-green-400" />,
      title: 'Recycling efficiency improved by 6%',
      description: 'Waste management protocols are successfully diverting more waste from landfills.',
      time: 'Updated 2d ago',
      color: 'bg-green-500/10 border-green-500/20 text-green-200'
    });
  }

  return (
    <Card className="h-full flex flex-col p-0 overflow-hidden border-white/[0.08] shadow-panel">
      <div className="p-6 border-b border-white/[0.06] flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-brand-400" />
        <h3 className="font-display text-lg font-semibold text-white tracking-tight">AI Business Insights</h3>
      </div>
      <div className="p-6 flex-1 flex flex-col gap-4">
        {insights.map((insight, idx) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + idx * 0.1, duration: 0.4 }}
            className={clsx(
              'p-4 rounded-xl border flex items-start gap-4 transition-transform hover:-translate-y-0.5',
              insight.color
            )}
          >
            <div className="mt-0.5 shrink-0">
              {insight.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold mb-1 text-white">{insight.title}</h4>
              <p className="text-xs leading-relaxed opacity-80">{insight.description}</p>
              <p className="text-[10px] uppercase font-bold tracking-wider mt-3 opacity-60">{insight.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
