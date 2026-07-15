import { useState } from 'react';
import { Card } from '@/components/ui';
import { Badge } from '@/components/ui/Badge';
import { MoreHorizontal, Clock, MessageSquare } from 'lucide-react';

const KANBAN_COLUMNS = [
  { id: 'pending', label: 'Pending / Draft', color: 'slate' },
  { id: 'in_review', label: 'In Review', color: 'amber' },
  { id: 'approved', label: 'Approved', color: 'emerald' },
  { id: 'rejected', label: 'Rejected', color: 'rose' },
] as const;

// Mock data for visual demonstration
const mockWorkflows = [
  { id: 'w1', title: 'Q3 Carbon Emissions Report', status: 'in_review', priority: 'high', comments: 3, dueDate: 'Oct 15, 2026', owner: 'Sarah Jenkins' },
  { id: 'w2', title: 'New Vendor Compliance Check', status: 'pending', priority: 'medium', comments: 0, dueDate: 'Oct 20, 2026', owner: 'Mike Chen' },
  { id: 'w3', title: 'Annual CSR Audit', status: 'approved', priority: 'high', comments: 12, dueDate: 'Oct 01, 2026', owner: 'Jessica Alby' },
];

export function WorkflowsKanban() {
  const [workflows] = useState(mockWorkflows);

  return (
    <div className="flex gap-6 overflow-x-auto pb-4 pt-2">
      {KANBAN_COLUMNS.map((column) => (
        <div key={column.id} className="min-w-[320px] max-w-[320px] flex-shrink-0 flex flex-col gap-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              {column.label}
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/[0.04] text-[10px] text-slate-400">
                {workflows.filter(w => w.status === column.id).length}
              </span>
            </h3>
            <button className="text-slate-500 hover:text-slate-300">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>

          {workflows
            .filter((w) => w.status === column.id)
            .map((workflow) => (
              <KanbanCard key={workflow.id} workflow={workflow} />
            ))}
            
          {workflows.filter((w) => w.status === column.id).length === 0 && (
            <div className="rounded-xl border border-dashed border-white/[0.1] bg-white/[0.02] p-6 text-center text-sm text-slate-500">
              No workflows here
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function KanbanCard({ workflow }: any) {
  return (
    <Card className="p-4 hover:border-brand-500/30 transition-colors cursor-pointer group">
      <div className="flex items-start justify-between gap-2 mb-3">
        <Badge variant={workflow.priority === 'high' ? 'danger' : 'secondary'} className="text-[10px]">
          {workflow.priority.toUpperCase()}
        </Badge>
        <button className="text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
      
      <h4 className="text-sm font-medium text-slate-200 mb-2">{workflow.title}</h4>
      <p className="text-xs text-slate-500 mb-4">Owner: {workflow.owner}</p>

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/[0.06] text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5" title="Comments">
            <MessageSquare className="h-3.5 w-3.5" /> {workflow.comments}
          </span>
        </div>
        <span className={`flex items-center gap-1.5 ${workflow.priority === 'high' ? 'text-rose-400' : ''}`}>
          <Clock className="h-3.5 w-3.5" /> {workflow.dueDate}
        </span>
      </div>
    </Card>
  );
}
