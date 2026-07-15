import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, X, File } from 'lucide-react';
import { Button, Input } from '@/components/ui';

interface SmartUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetFolderId: string | null;
}

export function SmartUploadModal({ isOpen, onClose, targetFolderId: _targetFolderId }: SmartUploadModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      setFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    setIsUploading(true);
    // Mock upload delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsUploading(false);
    setFiles([]);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-ink-900 border border-white/[0.08] rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between p-4 border-b border-white/[0.08]">
            <h2 className="text-lg font-semibold text-white">Smart Upload</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-6">
            {!files.length ? (
              <div
                className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-colors ${
                  isDragging ? 'border-brand-400 bg-brand-500/10' : 'border-white/[0.1] bg-white/[0.02]'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <UploadCloud className={`w-12 h-12 mb-4 ${isDragging ? 'text-brand-400' : 'text-slate-500'}`} />
                <p className="text-slate-300 font-medium text-center">
                  Drag and drop your ESG evidence here
                </p>
                <p className="text-slate-500 text-sm mt-2 text-center">
                  Support for PDF, Excel, Word, CSV, Images (Max 10MB)
                </p>
                <Button 
                  variant="outline" 
                  className="mt-6"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Browse Files
                </Button>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                  {files.map((file, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                      <File className="w-8 h-8 text-brand-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{file.name}</p>
                        <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <div className="flex flex-col gap-2 w-1/3">
                        <Input placeholder="Add tags..." className="h-7 text-xs" />
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.08]">
                  <Button variant="outline" onClick={() => setFiles([])}>Cancel</Button>
                  <Button onClick={handleUpload} disabled={isUploading}>
                    {isUploading ? 'Scanning & Uploading...' : `Upload ${files.length} Files`}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
