import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderLock, Upload, Search, Filter, Grid, List, HardDrive, FileText, CheckCircle, Clock } from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';
import { SmartUploadModal } from './components/SmartUploadModal';
import { DocumentGrid } from './components/DocumentGrid';
import { DocumentList } from './components/DocumentList';
import { FolderTree } from './components/FolderTree';
import { DocumentPreviewPanel } from './components/DocumentPreviewPanel';


export function VaultPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  // Mock dashboard stats for initial view
  const stats = [
    { label: 'Total Documents', value: '1,248', icon: FileText, color: 'text-blue-400' },
    { label: 'Pending Reviews', value: '12', icon: Clock, color: 'text-amber-400' },
    { label: 'Approved Documents', value: '984', icon: CheckCircle, color: 'text-emerald-400' },
    { label: 'Storage Used', value: '42.5 GB', icon: HardDrive, color: 'text-purple-400' },
  ];

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FolderLock className="w-6 h-6 text-brand-400" />
            Evidence Vault
          </h1>
          <p className="text-slate-400 mt-1">Enterprise Document Management and Secure Storage</p>
        </div>
        <Button onClick={() => setIsUploadOpen(true)} className="flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Upload Document
        </Button>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="p-4 flex items-center gap-4 border-white/[0.06] bg-white/[0.02]">
                <div className={`p-3 rounded-xl bg-white/[0.05] ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Main Workspace */}
      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left Sidebar - Folder Tree */}
        <div className="w-64 shrink-0 flex flex-col gap-4">
          <Card className="flex-1 p-4 border-white/[0.06] bg-white/[0.02] overflow-y-auto">
            <FolderTree 
              selectedFolder={selectedFolder} 
              onSelect={setSelectedFolder} 
            />
          </Card>
        </div>

        {/* Right Content - File Browser */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <div className="flex items-center gap-4 shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search documents, tags, or contents..."
                className="pl-9 bg-white/[0.03] border-white/[0.1]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
            <div className="flex items-center p-1 bg-white/[0.05] rounded-lg border border-white/[0.1]">
              <button
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          <Card className="flex-1 border-white/[0.06] bg-white/[0.02] overflow-y-auto p-4">
            {viewMode === 'grid' ? (
              <DocumentGrid 
                searchQuery={searchQuery} 
                folderId={selectedFolder} 
                onPreview={setPreviewDoc} 
              />
            ) : (
              <DocumentList 
                searchQuery={searchQuery} 
                folderId={selectedFolder} 
                onPreview={setPreviewDoc} 
              />
            )}
          </Card>
        </div>
      </div>

      <SmartUploadModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        targetFolderId={selectedFolder}
      />
      
      <AnimatePresence>
        {previewDoc && (
          <DocumentPreviewPanel 
            document={previewDoc} 
            onClose={() => setPreviewDoc(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
