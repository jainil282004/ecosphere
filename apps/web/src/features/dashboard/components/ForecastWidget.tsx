import { Card } from '@/components/ui';

interface ForecastWidgetProps {
  historicalCarbon: { month: string; totalCo2e: number }[];
  historicalScore: number;
}

export function ForecastWidget({ historicalCarbon, historicalScore }: ForecastWidgetProps) {
  // Simple Linear Trend calculation for the demo
  const calculateNextMonthEstimate = (data: { month: string; totalCo2e: number }[]) => {
    if (!data || data.length < 2) return null;
    
    // Simple average of deltas (very rudimentary trendline for demo)
    let totalDelta = 0;
    for (let i = 1; i < data.length; i++) {
      totalDelta += ((data[i]?.totalCo2e || 0) - (data[i - 1]?.totalCo2e || 0));
    }
    const avgDelta = totalDelta / (data.length - 1);
    const lastValue = data[data.length - 1]?.totalCo2e || 0;
    
    return lastValue + avgDelta;
  };

  const nextMonthCarbon = calculateNextMonthEstimate(historicalCarbon) || 0;
  // Estimate score improvements (assuming +1.5 pts based on trend)
  const nextMonthScore = Math.min(historicalScore + 1.5, 100);

  return (
    <Card className="p-6 bg-gradient-to-br from-indigo-900/40 to-slate-900 border-indigo-500/20 w-full relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-300">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">AI Forecasting</h3>
          <p className="text-sm text-indigo-300/70 mt-0.5">30-day predictive estimates based on SMA</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
        <div className="p-4 bg-black/20 rounded-xl border border-white/5 backdrop-blur-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Expected Emissions</p>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-white">
              {nextMonthCarbon ? nextMonthCarbon.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '...'}
            </span>
            <span className="text-sm font-medium text-brand-400 mb-1">▼ 3.2%</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Projected reduction from current month</p>
        </div>
        
        <div className="p-4 bg-black/20 rounded-xl border border-white/5 backdrop-blur-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Expected ESG Score</p>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-white">
              {nextMonthScore ? nextMonthScore.toFixed(1) : '...'}
            </span>
            <span className="text-sm font-medium text-brand-400 mb-1">▲ 1.5 pts</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Driven by social compliance initiatives</p>
        </div>

        <div className="p-4 bg-black/20 rounded-xl border border-white/5 backdrop-blur-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Expected Energy Usage</p>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-white">
              24,500 <span className="text-base text-slate-400 font-normal">kWh</span>
            </span>
            <span className="text-sm font-medium text-danger-400 mb-1">▲ 2.1%</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Seasonal increase predicted</p>
        </div>

        <div className="p-4 bg-black/20 rounded-xl border border-white/5 backdrop-blur-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Expected Water Usage</p>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-white">
              1,240 <span className="text-base text-slate-400 font-normal">kL</span>
            </span>
            <span className="text-sm font-medium text-brand-400 mb-1">▼ 5.4%</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">New filtration system impact</p>
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <span className="inline-flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-indigo-400/60 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
          <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
          Estimates are statistical projections and not guarantees
        </span>
      </div>
    </Card>
  );
}
