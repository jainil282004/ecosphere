
import { Card } from '@/components/ui';
import { Activity, CheckCircle2, Clock, MapPin, Monitor, Shield, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface AuditLog {
  id: string;
  module: string;
  action: string;
  browser: string;
  os: string;
  device: string;
  location: string;
  success: boolean;
  severity: string;
  createdAt: string;
  oldValue?: any;
  newValue?: any;
}

interface ActivityTimelineProps {
  logs: AuditLog[];
}

export function ActivityTimeline({ logs }: ActivityTimelineProps) {
  if (!logs?.length) {
    return (
      <Card className="p-12 text-center bg-slate-900/50 border-slate-800 backdrop-blur-xl">
        <Activity className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-slate-300">No recent activity</h3>
        <p className="text-slate-500 mt-2">All audited actions will appear here in real-time.</p>
      </Card>
    );
  }

  const getSeverityColor = (severity: string, success: boolean) => {
    if (!success) return 'text-danger-500 bg-danger-500/10 border-danger-500/20';
    switch (severity?.toLowerCase()) {
      case 'high':
      case 'critical':
        return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'warning':
        return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      default:
        return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    }
  };

  return (
    <Card className="p-6 bg-slate-900/80 border-slate-800 backdrop-blur-xl shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 bg-brand-500/20 rounded-xl text-brand-400 ring-1 ring-brand-500/30">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Enterprise Activity Log</h2>
          <p className="text-sm text-slate-400 mt-0.5">Real-time immutable audit trail</p>
        </div>
      </div>

      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
        {logs.map((log) => {
          const colorClass = getSeverityColor(log.severity, log.success);
          
          return (
            <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              {/* Timeline Marker */}
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-900 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-xl ${log.success ? 'bg-slate-800 text-brand-400' : 'bg-danger-900 text-danger-400'}`}>
                {log.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              </div>
              
              {/* Content Box */}
              <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-800 bg-slate-800/50 hover:bg-slate-800/80 transition-colors shadow-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${colorClass}`}>
                      {log.module}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                
                <h4 className="text-base font-semibold text-white mb-1">{log.action}</h4>
                
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-3 pt-3 border-t border-slate-700/50">
                  {log.location && log.location !== 'Unknown' && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      {log.location}
                    </div>
                  )}
                  {log.device && log.device !== 'Unknown ' && (
                    <div className="flex items-center gap-1">
                      <Monitor className="w-3 h-3 text-slate-500" />
                      {log.device}
                    </div>
                  )}
                  {log.browser && log.browser !== 'Unknown ' && (
                    <div className="flex items-center gap-1">
                      <Shield className="w-3 h-3 text-slate-500" />
                      {log.browser}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
