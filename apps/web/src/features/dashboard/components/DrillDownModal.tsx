import { motion, AnimatePresence } from 'framer-motion';

interface DrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data?: any;
}

export function DrillDownModal({ isOpen, onClose, title, data }: DrillDownModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex justify-end bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="bg-surface border-l border-border w-full max-w-xl h-full shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white">{title}</h2>
              <p className="text-sm text-slate-400 mt-1">Deep-dive Analytics</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto">
            {data ? (
              <div className="space-y-6">
                <div className="p-4 rounded-lg bg-black/20 border border-white/5">
                  <h4 className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">Historical Trend</h4>
                  <div className="h-40 flex items-center justify-center border border-dashed border-slate-700 rounded text-slate-500">
                    [Detailed Chart Placeholder]
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-black/20 border border-white/5">
                  <h4 className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">Department Breakdown</h4>
                  <ul className="space-y-3">
                    <li className="flex justify-between text-sm">
                      <span className="text-slate-400">Operations</span>
                      <span className="font-medium text-white">45%</span>
                    </li>
                    <li className="flex justify-between text-sm">
                      <span className="text-slate-400">Manufacturing</span>
                      <span className="font-medium text-white">35%</span>
                    </li>
                    <li className="flex justify-between text-sm">
                      <span className="text-slate-400">Logistics</span>
                      <span className="font-medium text-white">20%</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-brand-500/10 border border-brand-500/20">
                  <h4 className="text-sm font-bold text-brand-300 mb-2 uppercase tracking-wider flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    AI Recommendations
                  </h4>
                  <p className="text-sm text-brand-200/80 leading-relaxed">
                    Based on this data slice, we recommend auditing the Operations department cooling systems. Historical data shows a 15% inefficiency during summer months.
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
                <p>Select a data point to drill down.</p>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-white/10 bg-black/20 flex justify-between">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Back
            </button>
            <button 
              className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-md hover:bg-primary/90 transition-colors shadow-sm"
              onClick={() => alert('Exporting detailed CSV...')}
            >
              Export CSV
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
