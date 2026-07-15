import { useState } from 'react';
import { PageHeader, Card, Button } from '@/components/ui';
import { LayoutGrid, List as ListIcon, Plus, Filter, Activity, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorkflowsKanban } from './WorkflowsKanban';
import { WorkflowsList } from './WorkflowsList';
import { CreateWorkflowDialog } from './CreateWorkflowDialog';

const tabs = [
  { id: 'kanban', label: 'Kanban Board', icon: LayoutGrid },
  { id: 'list', label: 'All Workflows', icon: ListIcon },
] as const;

export function WorkflowsPage() {
  const [activeTab, setActiveTab] = useState<'kanban' | 'list'>('kanban');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enterprise Workflows"
        description="Design, track, and manage ESG approval chains and tasks."
        action={
          <div className="flex items-center gap-3">
            <Button variant="secondary">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button variant="primary" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Workflow
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Workflows" value="12" trend="+2" icon={Activity} color="blue" />
        <StatCard title="Pending Review" value="5" trend="-1" icon={Clock} color="amber" />
        <StatCard title="Completed (30d)" value="24" trend="+12%" icon={CheckCircle2} color="emerald" />
        <StatCard title="Blocked / At Risk" value="1" trend="-2" icon={AlertCircle} color="rose" />
      </div>

      <div className="flex border-b border-white/[0.06]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                isActive ? 'text-brand-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-400"
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="relative min-h-[500px]">
        <AnimatePresence mode="wait">
          {activeTab === 'kanban' ? (
            <motion.div
              key="kanban"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <WorkflowsKanban />
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <WorkflowsList />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <CreateWorkflowDialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} />
    </div>
  );
}

function StatCard({ title, value, trend, icon: Icon, color }: any) {
  const colorStyles = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  }[color as string];

  return (
    <Card className="relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <div className={`p-2 rounded-xl border ${colorStyles}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <p className="text-3xl font-bold font-display text-white">{value}</p>
          <span className={`text-xs font-semibold ${trend.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend}
          </span>
        </div>
      </div>
    </Card>
  );
}
