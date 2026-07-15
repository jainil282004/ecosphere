import { motion } from 'framer-motion';
import { AlertTriangle, ShieldCheck, Info } from 'lucide-react';
import clsx from 'clsx';
import { Card } from '@/components/ui';

const RISKS = [
  { category: 'Carbon Target', level: 'High', description: 'Manufacturing department is projected to exceed Scope 2 target by 15%.' },
  { category: 'Compliance', level: 'Medium', description: '2 pending safety audits in Operations due this quarter.' },
  { category: 'Water Usage', level: 'Low', description: 'Usage stable, well within optimal bounds.' },
  { category: 'Waste', level: 'Low', description: 'Diversion rate is currently at 65%, meeting targets.' },
];

export function AIRiskAnalysis() {
  return (
    <Card className="h-full border-slate-800 bg-slate-900 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
        <h3 className="font-semibold text-slate-200">AI Risk Analysis</h3>
        <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded">Live Evaluation</span>
      </div>
      <div className="p-4 flex-1 space-y-4">
        {RISKS.map((risk, idx) => (
          <motion.div
            key={risk.category}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={clsx(
              "flex items-start gap-3 p-3 rounded-lg border",
              risk.level === 'High' ? "bg-rose-950/20 border-rose-900/50" :
              risk.level === 'Medium' ? "bg-amber-950/20 border-amber-900/50" :
              "bg-emerald-950/20 border-emerald-900/50"
            )}
          >
            <div className="mt-0.5">
              {risk.level === 'High' && <AlertTriangle className="w-4 h-4 text-rose-500" />}
              {risk.level === 'Medium' && <Info className="w-4 h-4 text-amber-500" />}
              {risk.level === 'Low' && <ShieldCheck className="w-4 h-4 text-emerald-500" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-200">{risk.category}</span>
                <span className={clsx(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded",
                  risk.level === 'High' ? "bg-rose-500/10 text-rose-400" :
                  risk.level === 'Medium' ? "bg-amber-500/10 text-amber-400" :
                  "bg-emerald-500/10 text-emerald-400"
                )}>
                  {risk.level} Risk
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{risk.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
