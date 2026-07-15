import { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui';
import { Download, Sparkles } from 'lucide-react';
import { useAICopilot } from '@/features/ai/AICopilotContext';

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  loading?: boolean;
  dataForAI?: any;
}

export function ChartContainer({ title, subtitle, children, loading, dataForAI }: ChartContainerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { askAI } = useAICopilot();

  const handleAskAI = () => {
    askAI(`Please explain the trends in the "${title}" chart.`, {
      title,
      data: dataForAI || 'Chart data snapshot not provided.'
    });
  };

  const innerContent = (
    <>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
          {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className="flex gap-2">
          <button 
            className="p-1.5 text-emerald-400/70 hover:text-emerald-400 hover:bg-emerald-900/30 rounded-md transition-colors"
            title="Ask AI to Explain"
            onClick={handleAskAI}
          >
            <Sparkles size={16} />
          </button>
          <button 
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
            title="Download PNG"
            onClick={() => alert('Downloading PNG...')}
          >
            <Download size={16} />
          </button>
          <button 
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
            title={isFullscreen ? "Close Fullscreen" : "Fullscreen"}
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
          </button>
        </div>
      </div>
      
      <div className={`relative w-full ${isFullscreen ? 'h-[75vh]' : 'h-72'}`}>
        {loading ? (
          <div className="absolute inset-0 bg-slate-800/40 animate-pulse rounded-lg flex items-center justify-center border border-white/5">
            <span className="text-slate-500 font-bold tracking-widest text-xs uppercase flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Loading Chart Data
            </span>
          </div>
        ) : (
          children
        )}
      </div>
    </>
  );

  return (
    <>
      <Card className="p-5 flex flex-col justify-between h-full group bg-surface border-border shadow-md">
        {innerContent}
      </Card>
      
      <AnimatePresence>
        {isFullscreen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-md p-8"
            onClick={() => setIsFullscreen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="bg-surface border border-border rounded-2xl p-8 w-full max-w-6xl shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              {innerContent}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
