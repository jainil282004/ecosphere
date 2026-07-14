import { Card } from '@/components/ui';
import { motion } from 'framer-motion';
import { PlusCircle, FileText, ShieldCheck, Users, Download, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useOrgContext } from '@/hooks/useAuth';

export function QuickActionsPanel() {
  const navigate = useNavigate();
  const { orgId } = useOrgContext();

  const actions = [
    {
      label: 'Add Carbon Data',
      icon: <PlusCircle className="w-5 h-5" />,
      color: 'bg-brand-500/10 text-brand-300 ring-brand-500/20 hover:bg-brand-500/20',
      onClick: () => orgId && navigate(`/orgs/${orgId}/carbon`)
    },
    {
      label: 'Generate ESG Report',
      icon: <FileText className="w-5 h-5" />,
      color: 'bg-accent-500/10 text-accent-300 ring-accent-500/20 hover:bg-accent-500/20',
      onClick: () => orgId && navigate(`/orgs/${orgId}/reports`)
    },
    {
      label: 'View Compliance',
      icon: <ShieldCheck className="w-5 h-5" />,
      color: 'bg-info-500/10 text-info-300 ring-info-500/20 hover:bg-info-500/20',
      onClick: () => orgId && navigate(`/orgs/${orgId}/compliance`)
    },
    {
      label: 'Manage Employees',
      icon: <Users className="w-5 h-5" />,
      color: 'bg-gold-500/10 text-gold-300 ring-gold-500/20 hover:bg-gold-500/20',
      onClick: () => orgId && navigate(`/orgs/${orgId}/admin`)
    },
    {
      label: 'Export Dashboard',
      icon: <Download className="w-5 h-5" />,
      color: 'bg-slate-500/10 text-slate-300 ring-slate-500/20 hover:bg-slate-500/20',
      onClick: () => alert('Exporting Dashboard...')
    }
  ];

  return (
    <Card className="h-full flex flex-col p-0 overflow-hidden border-white/[0.08] shadow-panel">
      <div className="p-6 border-b border-white/[0.06] flex items-center gap-2">
        <Zap className="w-5 h-5 text-gold-400" />
        <h3 className="font-display text-lg font-semibold text-white tracking-tight">Quick Actions</h3>
      </div>
      <div className="p-6 grid grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action, idx) => (
          <motion.button
            key={action.label}
            onClick={action.onClick}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ delay: 0.4 + idx * 0.05, duration: 0.2 }}
            className={`flex flex-col items-center justify-center p-4 rounded-2xl ring-1 transition-colors ${action.color} gap-3`}
          >
            {action.icon}
            <span className="text-xs font-semibold text-center">{action.label}</span>
          </motion.button>
        ))}
      </div>
    </Card>
  );
}
