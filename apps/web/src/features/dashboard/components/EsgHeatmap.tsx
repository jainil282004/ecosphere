
import { Card } from '@/components/ui';

const DEPARTMENTS = ['HR', 'Operations', 'Manufacturing', 'Logistics', 'IT', 'Finance'];
const PILLARS = ['Environmental', 'Social', 'Governance'];

// Mock data generator for heatmap colors based on scores
const getColor = (score: number) => {
  if (score >= 80) return 'bg-brand-500 hover:bg-brand-400';
  if (score >= 60) return 'bg-yellow-500 hover:bg-yellow-400';
  if (score >= 40) return 'bg-orange-500 hover:bg-orange-400';
  return 'bg-danger-500 hover:bg-danger-400';
};

const getTextColor = (score: number) => {
  if (score >= 60 && score < 80) return 'text-slate-900'; // dark text for yellow
  return 'text-white';
};

export function EsgHeatmap() {
  return (
    <Card className="p-6 bg-surface border-border w-full overflow-hidden">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white tracking-tight">ESG Performance Heatmap</h3>
        <p className="text-sm text-slate-400 mt-1">Cross-departmental pillar performance</p>
      </div>
      
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left min-w-[500px]">
          <thead>
            <tr>
              <th className="p-3 font-semibold text-slate-300 w-1/4">Department</th>
              {PILLARS.map(pillar => (
                <th key={pillar} className="p-3 font-semibold text-slate-300 text-center w-1/4">{pillar}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DEPARTMENTS.map(dept => (
              <tr key={dept} className="border-t border-white/5">
                <td className="p-3 font-medium text-slate-200">{dept}</td>
                {PILLARS.map(pillar => {
                  // Generate deterministic pseudo-random score
                  const hash = dept.charCodeAt(0) + pillar.charCodeAt(0);
                  const score = 30 + (hash % 70); 
                  
                  return (
                    <td key={`${dept}-${pillar}`} className="p-1">
                      <div 
                        className={`w-full h-12 rounded-md flex items-center justify-center font-bold text-sm cursor-pointer transition-colors shadow-sm ${getColor(score)} ${getTextColor(score)}`}
                        title={`${dept} - ${pillar}: ${score}/100`}
                        onClick={() => alert(`Opening DrillDown for ${dept} ${pillar}`)}
                      >
                        {score}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-6 flex items-center gap-4 text-xs font-medium text-slate-400 justify-end">
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-danger-500" /> &lt;40 (Critical)</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-orange-500" /> 40-59 (Warning)</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-yellow-500" /> 60-79 (Good)</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-brand-500" /> 80+ (Excellent)</div>
      </div>
    </Card>
  );
}
