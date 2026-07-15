import { FileText, Image, FileSpreadsheet, MoreVertical, File } from 'lucide-react';

interface DocumentListProps {
  searchQuery: string;
  folderId: string | null;
  onPreview: (doc: any) => void;
}

export function DocumentList({ searchQuery: _searchQuery, folderId: _folderId, onPreview }: DocumentListProps) {
  // Mock data for display
  const mockDocs = [
    { id: '1', title: 'Q3 Carbon Emissions Report.pdf', type: 'pdf', size: '2.4 MB', date: '2026-07-10', tags: ['#Carbon', '#Q3'], status: 'Approved' },
    { id: '2', title: 'Supplier Audit - GreenTech.xlsx', type: 'excel', size: '1.1 MB', date: '2026-07-12', tags: ['#Audit', '#SupplyChain'], status: 'Pending Review' },
    { id: '3', title: 'Water Usage Invoice May.jpg', type: 'image', size: '450 KB', date: '2026-07-14', tags: ['#Water', '#Invoice'], status: 'Draft' },
  ];

  const getIcon = (type: string) => {
    switch(type) {
      case 'pdf': return <FileText className="w-5 h-5 text-red-400" />;
      case 'excel': return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
      case 'image': return <Image className="w-5 h-5 text-blue-400" />;
      default: return <File className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Approved': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Pending Review': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/[0.08] text-xs font-medium text-slate-500 uppercase tracking-wider">
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Tags</th>
            <th className="px-4 py-3">Size</th>
            <th className="px-4 py-3">Modified</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {mockDocs.map((doc) => (
            <tr 
              key={doc.id} 
              className="border-b border-white/[0.04] hover:bg-white/[0.02] cursor-pointer transition"
              onClick={() => onPreview(doc)}
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {getIcon(doc.type)}
                  <span className="font-medium text-slate-200">{doc.title}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getStatusColor(doc.status)}`}>
                  {doc.status}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  {doc.tags.map(tag => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/5 text-slate-400">
                      {tag}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3 text-slate-400">{doc.size}</td>
              <td className="px-4 py-3 text-slate-400">{doc.date}</td>
              <td className="px-4 py-3 text-right">
                <button className="p-1 text-slate-500 hover:text-white transition" onClick={(e) => { e.stopPropagation(); }}>
                  <MoreVertical className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
