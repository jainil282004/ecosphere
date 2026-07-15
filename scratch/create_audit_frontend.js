const fs = require('fs');
const path = require('path');

const componentsDir = path.join(process.cwd(), 'apps/web/src/features/audit/components');
const auditDir = path.join(process.cwd(), 'apps/web/src/features/audit');

const ActivityTimeline = `
import { Card } from '@/components/ui';
import { Activity, ArrowRight, CheckCircle2, Clock, MapPin, Monitor, Shield, XCircle } from 'lucide-react';
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
        {logs.map((log, i) => {
          const colorClass = getSeverityColor(log.severity, log.success);
          
          return (
            <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              {/* Timeline Marker */}
              <div className={\`flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-900 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-xl \${log.success ? 'bg-slate-800 text-brand-400' : 'bg-danger-900 text-danger-400'}\`}>
                {log.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              </div>
              
              {/* Content Box */}
              <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-800 bg-slate-800/50 hover:bg-slate-800/80 transition-colors shadow-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={\`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border \${colorClass}\`}>
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
`;

const AuditAnalytics = `
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
`;

const AuditCenterPage = `
import { useEffect, useState } from 'react';
import { ActivityTimeline, AuditLog } from './components/ActivityTimeline';
import { AuditAnalytics } from './components/AuditAnalytics';
import { Shield, Download, Filter, Search } from 'lucide-react';
import { api } from '@/lib/api';

export function AuditCenterPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would fetch from the actual audit endpoint
    // and subscribe to WebSockets for real-time updates
    const fetchLogs = async () => {
      try {
        // Fallback mock data if API is not fully wired to frontend yet
        const mockLogs = [
          {
            id: '1',
            module: 'vault',
            action: 'Document Uploaded: "Q3_Emissions_Report.pdf"',
            browser: 'Chrome 115',
            os: 'Windows 11',
            device: 'Desktop',
            location: 'New York, US',
            success: true,
            severity: 'info',
            createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          },
          {
            id: '2',
            module: 'auth',
            action: 'Failed Login Attempt',
            browser: 'Firefox 110',
            os: 'Mac OS',
            device: 'Desktop',
            location: 'Unknown IP',
            success: false,
            severity: 'high',
            createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          },
          {
            id: '3',
            module: 'compliance',
            action: 'Policy Approved: ISO 14001',
            browser: 'Safari 16',
            os: 'iOS',
            device: 'Mobile',
            location: 'London, UK',
            success: true,
            severity: 'info',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          }
        ];
        
        setLogs(mockLogs);
      } catch (err) {
        console.error('Failed to fetch audit logs', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLogs();
  }, []);

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
`;

fs.writeFileSync(path.join(componentsDir, 'ActivityTimeline.tsx'), ActivityTimeline);
fs.writeFileSync(path.join(componentsDir, 'AuditAnalytics.tsx'), AuditAnalytics);
fs.writeFileSync(path.join(auditDir, 'AuditCenterPage.tsx'), AuditCenterPage);

console.log('Frontend components created successfully.');
