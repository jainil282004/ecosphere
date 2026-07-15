import { useDashboardFilters } from './DashboardFilterContext';
import { Card } from '@/components/ui';
import { motion } from 'framer-motion';

export function FilterBar() {
  const { filters, setFilter } = useDashboardFilters();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-30 pt-2 pb-4 bg-background/80 backdrop-blur-md"
    >
      <Card className="p-4 flex flex-wrap gap-4 items-center bg-surface/90 shadow-sm border border-border rounded-xl">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-text-secondary font-bold uppercase tracking-widest pl-1">Date Range</label>
          <select 
            className="bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer hover:border-text-secondary"
            value={filters.range || '30days'}
            onChange={(e) => setFilter('range', e.target.value)}
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="12months">Last 12 Months</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-text-secondary font-bold uppercase tracking-widest pl-1">Department</label>
          <select 
            className="bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer hover:border-text-secondary"
            value={filters.department || 'All Departments'}
            onChange={(e) => setFilter('department', e.target.value)}
          >
            <option value="All Departments">All Departments</option>
            <option value="HR">HR</option>
            <option value="Operations">Operations</option>
            <option value="Manufacturing">Manufacturing</option>
            <option value="Logistics">Logistics</option>
            <option value="IT">IT</option>
            <option value="Finance">Finance</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-text-secondary font-bold uppercase tracking-widest pl-1">Facility / Branch</label>
          <select 
            className="bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer hover:border-text-secondary"
            value={filters.facility || 'All Facilities'}
            onChange={(e) => setFilter('facility', e.target.value)}
          >
            <option value="All Facilities">All Facilities</option>
            <option value="HQ">Headquarters</option>
            <option value="Plant A">Plant A</option>
            <option value="Plant B">Plant B</option>
            <option value="EU Branch">EU Branch</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-text-secondary font-bold uppercase tracking-widest pl-1">ESG Category</label>
          <select 
            className="bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer hover:border-text-secondary"
            value={filters.category || 'All Categories'}
            onChange={(e) => setFilter('category', e.target.value)}
          >
            <option value="All Categories">All Categories</option>
            <option value="Environmental">Environmental</option>
            <option value="Social">Social</option>
            <option value="Governance">Governance</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-text-secondary font-bold uppercase tracking-widest pl-1">Status</label>
          <select 
            className="bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer hover:border-text-secondary"
            value={filters.status || 'All Statuses'}
            onChange={(e) => setFilter('status', e.target.value)}
          >
            <option value="All Statuses">All Statuses</option>
            <option value="Healthy">Healthy</option>
            <option value="Warning">Warning</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
        
        <div className="ml-auto flex items-center gap-3">
          <button 
            onClick={() => alert('Export Options')}
            className="text-text-secondary hover:text-text px-3 py-2 rounded-md text-sm font-medium transition-colors border border-transparent hover:border-border"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Export
          </button>
          <button 
            onClick={() => alert('Comparison Mode: This will overlay previous period data on charts.')}
            className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline mr-2"><path d="M16 3h5v5"></path><path d="M8 3H3v5"></path><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.828L3 3"></path><path d="m15.172 10.828 5.828-5.828"></path></svg>
            Compare Mode
          </button>
        </div>
      </Card>
    </motion.div>
  );
}
