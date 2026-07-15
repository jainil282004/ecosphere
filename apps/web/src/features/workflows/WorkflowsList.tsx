import { Card } from '@/components/ui';
import { Badge } from '@/components/ui/Badge';
import { MoreHorizontal } from 'lucide-react';

const mockWorkflows = [
  { id: 'w1', title: 'Q3 Carbon Emissions Report', status: 'in_review', priority: 'high', date: 'Oct 15, 2026', owner: 'Sarah Jenkins', department: 'Operations' },
  { id: 'w2', title: 'New Vendor Compliance Check', status: 'pending', priority: 'medium', date: 'Oct 20, 2026', owner: 'Mike Chen', department: 'Logistics' },
  { id: 'w3', title: 'Annual CSR Audit', status: 'approved', priority: 'high', date: 'Oct 01, 2026', owner: 'Jessica Alby', department: 'HR' },
];

export function WorkflowsList() {
  return (
    <Card className="mt-4 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-white/[0.02] border-b border-white/[0.06] text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Workflow Title</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 font-medium">Department</th>
              <th className="px-4 py-3 font-medium">Due Date</th>
              <th className="px-4 py-3 font-medium w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {mockWorkflows.map((workflow) => (
              <tr key={workflow.id} className="hover:bg-white/[0.02] cursor-pointer transition-colors">
                <td className="px-4 py-3 font-medium text-slate-200">
                  {workflow.title}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={workflow.status === 'approved' ? 'success' : workflow.status === 'in_review' ? 'warning' : 'secondary'}>
                    {workflow.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={workflow.priority === 'high' ? 'danger' : 'outline'}>
                    {workflow.priority.toUpperCase()}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-slate-400">{workflow.owner}</td>
                <td className="px-4 py-3 text-slate-400">{workflow.department}</td>
                <td className="px-4 py-3 text-slate-400">{workflow.date}</td>
                <td className="px-4 py-3 text-right">
                  <button className="text-slate-500 hover:text-slate-300">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
