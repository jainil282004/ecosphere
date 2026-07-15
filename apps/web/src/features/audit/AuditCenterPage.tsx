
import { useQuery } from '@tanstack/react-query';
import { ActivityTimeline } from './components/ActivityTimeline';
import { AuditAnalytics } from './components/AuditAnalytics';
import { Shield, Download, Filter } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { LoadingScreen } from '@/components/ui';

export function AuditCenterPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => apiClient<{ logs: any[]; total: number }>('/audit/logs?limit=50'),
  });

  if (isLoading) return <LoadingScreen />;

  const logs = data?.logs || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-brand-500/10 rounded-xl border border-brand-500/20">
              <Shield className="w-7 h-7 text-brand-400" />
            </div>
            Audit Logs & Activity Intelligence
          </h1>
          <p className="text-slate-400 mt-2 text-lg">Complete traceability, security visibility, and compliance readiness.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg border border-slate-700 transition-colors flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-brand-500/20 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Evidence
          </button>
        </div>
      </div>

      <AuditAnalytics />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityTimeline logs={logs} />
        </div>
        
        <div className="space-y-6">
          {/* Security Alert Card */}
          <div className="p-6 bg-slate-900/80 border border-slate-800 backdrop-blur-xl rounded-2xl shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4">Real-time Intelligence</h3>
            
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider bg-emerald-400/10 px-2 py-1 rounded">System Status</span>
                  <span className="text-xs text-slate-400">Just now</span>
                </div>
                <p className="text-sm text-slate-300">All audit log ingestion pipelines are operating normally.</p>
              </div>

              <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-orange-500 uppercase tracking-wider bg-orange-500/10 px-2 py-1 rounded">Anomaly Detected</span>
                  <span className="text-xs text-orange-400/70">15m ago</span>
                </div>
                <p className="text-sm text-slate-300">Multiple failed logins from a single IP address (192.168.1.104).</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
