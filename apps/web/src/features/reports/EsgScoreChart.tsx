import ReactECharts from 'echarts-for-react';
import type { DashboardMetrics } from '@ecosphere/shared';
import { Card } from '@/components/ui';

interface EsgScoreChartProps {
  metrics: DashboardMetrics | undefined;
}

export function EsgScoreChart({ metrics }: EsgScoreChartProps) {
  const environmental = Math.max(0, 100 - Math.min((metrics?.totalCarbonKg ?? 0) / 10, 100));
  const social = Math.min((metrics?.csrHours ?? 0) * 2, 100);
  const governance = Math.max(0, 100 - (metrics?.openComplianceIssues ?? 0) * 5);
  const composite = metrics?.esgScore ?? 0;

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item' as const,
      backgroundColor: '#0b0f1d',
      borderColor: 'rgba(16,185,129,0.28)',
      textStyle: { color: '#f8fafc', fontFamily: 'Inter' },
    },
    radar: {
      indicator: [
        { name: 'Environmental', max: 100 },
        { name: 'Social', max: 100 },
        { name: 'Governance', max: 100 },
      ],
      splitLine: { lineStyle: { color: 'rgba(148,163,184,0.14)' } },
      axisLine: { lineStyle: { color: 'rgba(148,163,184,0.22)' } },
      splitArea: {
        areaStyle: { color: ['rgba(11,15,29,0.35)', 'rgba(16,185,129,0.04)'] },
      },
      axisName: { color: '#cbd5e1', fontFamily: 'Inter', fontWeight: 500 },
    },
    series: [
      {
        type: 'radar' as const,
        data: [
          {
            value: [environmental, social, governance],
            name: 'ESG Domain Scores',
            areaStyle: { color: 'rgba(16,185,129,0.22)' },
            lineStyle: { color: '#10b981', width: 2 },
            itemStyle: { color: '#34d399' },
          },
        ],
      },
    ],
  };

  return (
    <Card>
      <p className="eyebrow">Balanced Score</p>
      <h2 className="mt-2 h-section">ESG Domain Radar</h2>
      <p className="mt-1 text-sm text-slate-400">
        Composite score:{' '}
        <span className="num font-semibold text-brand-300">{composite.toFixed(1)}</span>
      </p>
      <div className="mt-4 h-72">
        <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />
      </div>
    </Card>
  );
}
