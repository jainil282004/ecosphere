
import { Card } from '@/components/ui';
import { ShieldAlert, ShieldCheck, ActivitySquare, Users } from 'lucide-react';

export function AuditAnalytics() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="p-5 bg-gradient-to-br from-slate-900 to-slate-900/50 border-slate-800 relative overflow-hidden group">
        <div className="absolute inset-0 bg-brand-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400 mb-1">Total Events (24h)</p>
            <h3 className="text-3xl font-bold text-white">24,592</h3>
            <p className="text-xs text-brand-400 mt-1 flex items-center gap-1">
              <span>▲ 12.5%</span> vs yesterday
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
            <ActivitySquare className="w-6 h-6" />
          </div>
        </div>
      </Card>

      <Card className="p-5 bg-gradient-to-br from-slate-900 to-slate-900/50 border-slate-800 relative overflow-hidden group">
        <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400 mb-1">Success Rate</p>
            <h3 className="text-3xl font-bold text-white">99.8%</h3>
            <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
              <span>▲ 0.1%</span> vs yesterday
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </Card>

      <Card className="p-5 bg-gradient-to-br from-slate-900 to-slate-900/50 border-slate-800 relative overflow-hidden group">
        <div className="absolute inset-0 bg-danger-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400 mb-1">Failed Actions</p>
            <h3 className="text-3xl font-bold text-white">45</h3>
            <p className="text-xs text-danger-400 mt-1 flex items-center gap-1">
              <span>▼ 5%</span> vs yesterday
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-danger-500/10 border border-danger-500/20 flex items-center justify-center text-danger-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
      </Card>

      <Card className="p-5 bg-gradient-to-br from-slate-900 to-slate-900/50 border-slate-800 relative overflow-hidden group">
        <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400 mb-1">Active Sessions</p>
            <h3 className="text-3xl font-bold text-white">1,204</h3>
            <p className="text-xs text-blue-400 mt-1 flex items-center gap-1">
              <span>▲ 8.2%</span> vs yesterday
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </Card>
    </div>
  );
}
