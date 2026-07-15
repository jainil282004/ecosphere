import { createContext, useContext, useState, ReactNode } from 'react';
import type { DashboardFilters } from '@ecosphere/shared';

interface FilterContextType {
  filters: DashboardFilters;
  setFilter: (key: keyof DashboardFilters, value: any) => void;
  resetFilters: () => void;
}

const defaultFilters: DashboardFilters = {
  range: '30days',
};

const DashboardFilterContext = createContext<FilterContextType | undefined>(undefined);

export function DashboardFilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);

  const setFilter = (key: keyof DashboardFilters, value: any) => {
    setFilters((prev: DashboardFilters) => {
      const updated = { ...prev, [key]: value };
      if (!value || value === 'All') {
        delete updated[key];
      }
      return updated;
    });
  };

  const resetFilters = () => setFilters(defaultFilters);

  return (
    <DashboardFilterContext.Provider value={{ filters, setFilter, resetFilters }}>
      {children}
    </DashboardFilterContext.Provider>
  );
}

export function useDashboardFilters() {
  const context = useContext(DashboardFilterContext);
  if (!context) {
    throw new Error('useDashboardFilters must be used within a DashboardFilterProvider');
  }
  return context;
}
