import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GitMerge } from 'lucide-react';
import { Button } from '@/components/ui';

interface CreateWorkflowDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CreateWorkflowDialog({ open, onClose }: CreateWorkflowDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulation of API call
    setTimeout(() => {
      setLoading(false);
      onClose();
    }, 1000);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-white/[0.08] bg-ink-900 px-4 pb-4 pt-5 text-left shadow-2xl sm:my-8 sm:p-6"
          >
            <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
              <button
                type="button"
                className="rounded-md bg-transparent text-slate-400 hover:text-slate-300 focus:outline-none"
                onClick={onClose}
              >
                <span className="sr-only">Close</span>
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-brand-500/10 sm:mx-0 sm:h-10 sm:w-10">
                <GitMerge className="h-5 w-5 text-brand-400" aria-hidden="true" />
              </div>
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                <h3 className="text-lg font-semibold leading-6 text-white">
                  Create New Workflow
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-slate-400">
                    Design a new approval sequence or task chain.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div>
                    <label className="label">Workflow Title</label>
                    <input type="text" className="input" placeholder="e.g. Annual CSR Review" required />
                  </div>
                  
                  <div>
                    <label className="label">Description</label>
                    <textarea className="input" rows={3} placeholder="Briefly describe the purpose of this workflow..." />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Priority</label>
                      <select className="input">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Due Date</label>
                      <input type="date" className="input" />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/[0.06] flex justify-end gap-3">
                    <Button type="button" variant="secondary" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" disabled={loading}>
                      {loading ? 'Creating...' : 'Create Workflow'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
