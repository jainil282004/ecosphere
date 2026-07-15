import ReactECharts from 'echarts-for-react';
import { Card } from '@/components/ui';
import { motion } from 'framer-motion';

export function AISustainabilityScore({ score = 76.2 }: { score?: number }) {
  const options = {
    tooltip: {
      trigger: 'item',
      backgroundColor: '#1e293b',
      borderColor: '#334155',
      textStyle: { color: '#f8fafc' }
    },
    radar: {
      indicator: [
        { name: 'Emissions', max: 100 },
        { name: 'Energy Eff', max: 100 },
        { name: 'Water', max: 100 },
        { name: 'Governance', max: 100 },
        { name: 'Social', max: 100 },
        { name: 'Waste', max: 100 }
      ],
      splitArea: {
        areaStyle: { color: ['transparent'] }
      },
      axisLine: { lineStyle: { color: '#334155' } },
      splitLine: { lineStyle: { color: '#334155' } },
      name: { textStyle: { color: '#94a3b8', fontSize: 10 } }
    },
    series: [
      {
        name: 'ESG Performance',
        type: 'radar',
        data: [
          {
            value: [65, 80, 90, 85, 95, 75],
            name: 'Current Score',
            itemStyle: { color: '#10b981' },
            areaStyle: { color: 'rgba(16, 185, 129, 0.3)' }
          }
        ]
      }
    ]
  };

  return (
    <Card className="h-full border-slate-800 bg-slate-900 flex flex-col items-center justify-center relative p-6">
      <h3 className="absolute top-4 left-4 font-semibold text-slate-200">AI Sustainability Rating</h3>
      
      <div className="flex flex-col items-center mt-6">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-4xl font-bold text-emerald-400 mb-1"
        >
          {score.toFixed(1)}
        </motion.div>
        <span className="text-xs text-slate-400 uppercase tracking-wider">Composite Score</span>
      </div>

      <div className="w-full h-[250px] mt-4">
        <ReactECharts option={options} style={{ height: '100%', width: '100%' }} />
      </div>
      
      <div className="absolute bottom-4 left-4 right-4 text-xs text-slate-400 text-center bg-slate-800/50 p-2 rounded-lg border border-slate-700">
        <strong>AI Insight:</strong> Strong Social & Governance metrics. Energy Efficiency needs improvement to boost overall score.
      </div>
    </Card>
  );
}
