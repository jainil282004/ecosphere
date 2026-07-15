import { FileText, Image, FileSpreadsheet, MoreVertical, File } from 'lucide-react';

interface DocumentGridProps {
  searchQuery: string;
  folderId: string | null;
  onPreview: (doc: any) => void;
}

export function DocumentGrid({ searchQuery: _searchQuery, folderId: _folderId, onPreview }: DocumentGridProps) {
  // Mock data for display
  const mockDocs = [
    { id: '1', title: 'Q3 Carbon Emissions Report.pdf', type: 'pdf', size: '2.4 MB', date: '2026-07-10', tags: ['#Carbon', '#Q3'], status: 'Approved' },
    { id: '2', title: 'Supplier Audit - GreenTech.xlsx', type: 'excel', size: '1.1 MB', date: '2026-07-12', tags: ['#Audit', '#SupplyChain'], status: 'Pending Review' },
    { id: '3', title: 'Water Usage Invoice May.jpg', type: 'image', size: '450 KB', date: '2026-07-14', tags: ['#Water', '#Invoice'], status: 'Draft' },
    { id: '4', title: 'ISO 14001 Certificate.pdf', type: 'pdf', size: '8.2 MB', date: '2026-06-20', tags: ['#Compliance', '#ISO'], status: 'Approved' },
    { id: '5', title: 'Employee Safety Training.mp4', type: 'video', size: '45.0 MB', date: '2026-07-01', tags: ['#Safety', '#Training'], status: 'Published' },
  ];

  const getIcon = (type: string) => {
    switch(type) {
      case 'pdf': return <FileText className="w-8 h-8 text-red-400" />;
      case 'excel': return <FileSpreadsheet className="w-8 h-8 text-emerald-400" />;
      case 'image': return <Image className="w-8 h-8 text-blue-400" />;
      default: return <File className="w-8 h-8 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Approved': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Pending Review': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Published': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {mockDocs.map((doc) => (
        <div 
          key={doc.id} 
          className="group relative flex flex-col p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] transition cursor-pointer"
          onClick={() => onPreview(doc)}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-lg bg-white/[0.05]">
              {getIcon(doc.type)}
            </div>
            <button className="p-1 text-slate-500 hover:text-white transition opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); }}>
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
          
          <h3 className="text-sm font-medium text-slate-200 truncate mb-1" title={doc.title}>
            {doc.title}
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            {doc.size} • {doc.date}
          </p>
          
          <div className="mt-auto flex flex-col gap-2">
            <div className="flex flex-wrap gap-1">
              {doc.tags.map(tag => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/5 text-slate-400">
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getStatusColor(doc.status)}`}>
                {doc.status}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
