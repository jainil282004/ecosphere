import { Card } from '@/components/ui';
import { motion } from 'framer-motion';
import { Clock, FileText, CheckCircle, UploadCloud, Activity } from 'lucide-react';

const ACTIVITIES = [
  {
    id: 1,
    time: '10:15 AM',
    title: 'Employee Rahul submitted Carbon Report',
    icon: <UploadCloud className="w-4 h-4 text-brand-400" />,
    color: 'bg-brand-500/10 border-brand-500/20'
  },
  {
    id: 2,
    time: '9:42 AM',
    title: 'Compliance report approved',
    icon: <CheckCircle className="w-4 h-4 text-green-400" />,
    color: 'bg-green-500/10 border-green-500/20'
  },
  {
    id: 3,
    time: 'Yesterday',
    title: 'Waste audit completed',
    icon: <Activity className="w-4 h-4 text-gold-400" />,
    color: 'bg-gold-500/10 border-gold-500/20'
  },
  {
    id: 4,
    time: 'Yesterday',
    title: 'New ESG report generated',
    icon: <FileText className="w-4 h-4 text-blue-400" />,
    color: 'bg-blue-500/10 border-blue-500/20'
  }
];

export function RecentActivityTimeline() {
  return (
    <Card className="h-full flex flex-col p-0 overflow-hidden border-white/[0.08] shadow-panel">
      <div className="p-6 border-b border-white/[0.06] flex items-center gap-2">
        <Clock className="w-5 h-5 text-slate-400" />
        <h3 className="font-display text-lg font-semibold text-white tracking-tight">Recent Activity</h3>
      </div>
      
      <div className="p-6 flex-1">
        <div className="relative border-l border-white/[0.08] ml-3 space-y-8 py-2">
          {ACTIVITIES.map((activity, idx) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + idx * 0.1, duration: 0.4 }}
              className="relative pl-6"
            >
              <div className={`absolute -left-3.5 top-0 w-7 h-7 rounded-full flex items-center justify-center border ${activity.color}`}>
                {activity.icon}
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">{activity.time}</p>
                <p className="text-sm text-slate-200">{activity.title}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Card>
  );
}
