/** Executive palette: emerald primary, violet accent, gold highlights. */
export const SCOPE_THEME = {
  scope_1: {
    label: 'Scope 1',
    subtitle: 'Direct emissions',
    hex: '#f59e0b',
    tailwind: 'text-gold-300 bg-gold-500/10 ring-gold-400/30',
  },
  scope_2: {
    label: 'Scope 2',
    subtitle: 'Indirect / electricity',
    hex: '#10b981',
    tailwind: 'text-brand-300 bg-brand-500/10 ring-brand-400/30',
  },
  scope_3: {
    label: 'Scope 3',
    subtitle: 'Supply chain & travel',
    hex: '#8b5cf6',
    tailwind: 'text-accent-300 bg-accent-500/10 ring-accent-400/30',
  },
} as const;

export const CHART_TOOLTIP_STYLE = {
  background: '#0b0f1d',
  border: '1px solid rgba(16,185,129,0.28)',
  borderRadius: 16,
  color: '#f8fafc',
};

export const SAMPLE_SCOPE_TREND = [
  { month: '2026-01', scope1: 168, scope2: 242, scope3: 386, total: 796 },
  { month: '2026-02', scope1: 154, scope2: 231, scope3: 358, total: 743 },
  { month: '2026-03', scope1: 149, scope2: 214, scope3: 332, total: 695 },
  { month: '2026-04', scope1: 138, scope2: 198, scope3: 310, total: 646 },
  { month: '2026-05', scope1: 126, scope2: 181, scope3: 292, total: 599 },
  { month: '2026-06', scope1: 119, scope2: 173, scope3: 265, total: 557 },
];

export const SAMPLE_EMPLOYEES = [
  { name: 'Emma Employee', role: 'Engineering', email: 'employee@greentech.io', hours: 16 },
  { name: 'Priya Sharma', role: 'Operations', email: 'priya@greentech.io', hours: 10.5 },
  { name: 'Rahul Mehta', role: 'Engineering', email: 'rahul@greentech.io', hours: 8 },
  { name: 'Sara Khan', role: 'Human Resources', email: 'sara@greentech.io', hours: 6 },
  { name: 'Michael Dsouza', role: 'Engineering', email: 'michael@greentech.io', hours: 12 },
];
