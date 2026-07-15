import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import { useState } from 'react';

interface FolderTreeProps {
  selectedFolder: string | null;
  onSelect: (folderId: string | null) => void;
}

export function FolderTree({ selectedFolder, onSelect }: FolderTreeProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ 'root': true, 'env': true });

  const toggle = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const folders = [
    { id: 'env', name: 'Environmental', parent: null },
    { id: 'carbon', name: 'Carbon Certificates', parent: 'env' },
    { id: 'energy', name: 'Energy Bills', parent: 'env' },
    { id: 'social', name: 'Social & HR', parent: null },
    { id: 'safety', name: 'Safety Reports', parent: 'social' },
    { id: 'gov', name: 'Governance', parent: null },
    { id: 'policies', name: 'Policy Documents', parent: 'gov' },
  ];

  const renderTree = (parentId: string | null = null, depth = 0) => {
    const children = folders.filter(f => f.parent === parentId);
    if (!children.length) return null;

    return (
      <div className="flex flex-col">
        {children.map(folder => {
          const isExpanded = expanded[folder.id];
          const isSelected = selectedFolder === folder.id;
          const hasChildren = folders.some(f => f.parent === folder.id);
          
          return (
            <div key={folder.id}>
              <div 
                className={`flex items-center gap-1.5 py-1.5 px-2 rounded-md cursor-pointer transition ${
                  isSelected ? 'bg-brand-500/20 text-brand-300' : 'text-slate-300 hover:bg-white/[0.04]'
                }`}
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
                onClick={() => onSelect(folder.id)}
              >
                <div onClick={(e) => hasChildren && toggle(e, folder.id)} className="w-4 h-4 flex items-center justify-center">
                  {hasChildren ? (
                    isExpanded ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />
                  ) : <span className="w-4" />}
                </div>
                {isExpanded && hasChildren ? (
                  <FolderOpen className={`w-4 h-4 ${isSelected ? 'text-brand-300' : 'text-slate-400'}`} />
                ) : (
                  <Folder className={`w-4 h-4 ${isSelected ? 'text-brand-300' : 'text-slate-400'}`} />
                )}
                <span className="text-sm truncate">{folder.name}</span>
              </div>
              {isExpanded && renderTree(folder.id, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">Directories</h3>
      <div 
        className={`flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition mb-1 ${
          selectedFolder === null ? 'bg-brand-500/20 text-brand-300' : 'text-slate-300 hover:bg-white/[0.04]'
        }`}
        onClick={() => onSelect(null)}
      >
        <Folder className={`w-4 h-4 ${selectedFolder === null ? 'text-brand-300' : 'text-slate-400'}`} />
        <span className="text-sm font-medium">All Documents</span>
      </div>
      <div className="flex-1 overflow-y-auto pr-2">
        {renderTree(null)}
      </div>
    </div>
  );
}
