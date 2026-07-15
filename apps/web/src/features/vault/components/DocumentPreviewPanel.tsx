import { motion } from 'framer-motion';
import { X, Download, Share2, MessageSquare, History, FileText, Image as ImageIcon, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui';

interface DocumentPreviewPanelProps {
  document: any;
  onClose: () => void;
}

export function DocumentPreviewPanel({ document, onClose }: DocumentPreviewPanelProps) {
  const getIcon = (type: string) => {
    switch(type) {
      case 'pdf': return <FileText className="w-12 h-12 text-red-400" />;
      case 'excel': return <FileSpreadsheet className="w-12 h-12 text-emerald-400" />;
      case 'image': return <ImageIcon className="w-12 h-12 text-blue-400" />;
      default: return <FileText className="w-12 h-12 text-slate-400" />;
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-ink-900 border-l border-white/[0.08] shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
          <h2 className="text-lg font-semibold text-white truncate pr-4">{document.title}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.05] transition shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* File Preview Mock */}
          <div className="h-64 bg-black/40 flex flex-col items-center justify-center border-b border-white/[0.08]">
            {getIcon(document.type)}
            <p className="text-slate-400 mt-4 text-sm font-medium">Preview not available for {document.type}</p>
            <Button variant="outline" className="mt-4 flex items-center gap-2">
              <Download className="w-4 h-4" /> Download File
            </Button>
          </div>

          {/* Metadata Tab */}
          <div className="p-6">
            <h3 className="text-sm font-medium text-white mb-4">Document Details</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500 mb-1">Status</p>
                  <span className="inline-flex px-2 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                    {document.status}
                  </span>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Size</p>
                  <p className="text-slate-300 font-medium">{document.size}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Modified</p>
                  <p className="text-slate-300 font-medium">{document.date}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Owner</p>
                  <p className="text-slate-300 font-medium">Alex Chen</p>
                </div>
              </div>

              <div>
                <p className="text-slate-500 text-sm mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {document.tags.map((tag: string) => (
                    <span key={tag} className="text-xs px-2 py-1 rounded-md bg-white/5 text-slate-300 border border-white/[0.05]">
                      {tag}
                    </span>
                  ))}
                  <button className="text-xs px-2 py-1 rounded-md border border-dashed border-white/20 text-slate-400 hover:text-white hover:border-white/40 transition">
                    + Add Tag
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <h3 className="text-sm font-medium text-white mb-2">Actions</h3>
              <Button variant="outline" className="w-full justify-start text-slate-300">
                <Share2 className="w-4 h-4 mr-3" /> Share Document
              </Button>
              <Button variant="outline" className="w-full justify-start text-slate-300">
                <History className="w-4 h-4 mr-3" /> Version History
              </Button>
              <Button variant="outline" className="w-full justify-start text-slate-300">
                <MessageSquare className="w-4 h-4 mr-3" /> Comments (2)
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
