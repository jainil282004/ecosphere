import ReactECharts from 'echarts-for-react';
import { Card } from '@/components/ui';
import { SCOPE_THEME } from '../constants';
import type { ScopeTrendPoint } from '../types';

interface ScopeTrendEChartProps {
  data: ScopeTrendPoint[];
  isLoading: boolean;
}

export function ScopeTrendEChart({ data, isLoading }: ScopeTrendEChartProps) {
  const months = data.map((d) => d.month);

  const option = {
    backgroundColor: 'transparent',
    color: [SCOPE_THEME.scope_1.hex, SCOPE_THEME.scope_2.hex, SCOPE_THEME.scope_3.hex],
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: '#0b0f1d',
      borderColor: 'rgba(16,185,129,0.28)',
      textStyle: { color: '#f8fafc', fontFamily: 'Inter' },
      axisPointer: { type: 'cross' as const, lineStyle: { color: '#10b981' } },
    },
    legend: {
      data: [SCOPE_THEME.scope_1.label, SCOPE_THEME.scope_2.label, SCOPE_THEME.scope_3.label],
      textStyle: { color: '#94a3b8', fontFamily: 'Inter' },
      bottom: 0,
      itemGap: 20,
    },
    grid: { left: 48, right: 24, top: 24, bottom: 48 },
    xAxis: {
      type: 'category' as const,
      boundaryGap: false,
      data: months,
      axisLine: { lineStyle: { color: 'rgba(148,163,184,0.16)' } },
      axisLabel: { color: '#94a3b8', fontFamily: 'Inter' },
    },
    yAxis: {
      type: 'value' as const,
      name: 'kg CO₂e',
      nameTextStyle: { color: '#64748b', fontFamily: 'Inter' },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: 'rgba(148,163,184,0.08)', type: 'dashed' as const } },
      axisLabel: { color: '#94a3b8', fontFamily: 'Inter' },
    },
    series: [
      {
        name: SCOPE_THEME.scope_1.label,
        type: 'line' as const,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        areaStyle: { color: 'rgba(245,158,11,0.10)' },
        lineStyle: { width: 2 },
        data: data.map((d) => d.scope1),
      },
      {
        name: SCOPE_THEME.scope_2.label,
        type: 'line' as const,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        areaStyle: { color: 'rgba(16,185,129,0.14)' },
        lineStyle: { width: 2 },
        data: data.map((d) => d.scope2),
      },
      {
        name: SCOPE_THEME.scope_3.label,
        type: 'line' as const,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        areaStyle: { color: 'rgba(139,92,246,0.16)' },
        lineStyle: { width: 3 },
        data: data.map((d) => d.scope3),
      },
    ],
  };

  return (
    <Card aria-labelledby="scope-echart-title">
      <header>
        <p className="eyebrow">Trend Quality</p>
        <h2 id="scope-echart-title" className="mt-2 h-section">
          Scope Comparison Over Time
        </h2>
        <p className="mt-1 text-sm text-slate-400">Line style and shade depth separate each scope.</p>
      </header>
      <div className="mt-4 h-72" role="img" aria-label="Line chart comparing scope emissions trends">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            Loading chart…
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            No historical scope data available.
          </div>
        ) : (
          <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />
        )}
      </div>
    </Card>
  );
}
