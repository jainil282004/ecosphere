import { gte, type SQL } from 'drizzle-orm';
import type { DashboardFilters } from '@ecosphere/shared';

export function applyDateFilter(column: any, filters?: DashboardFilters): SQL | undefined {
  if (!filters || !filters.range) return undefined;
  
  const now = new Date();
  let targetDate = new Date(now);

  if (filters.range === '7days') {
    targetDate.setDate(now.getDate() - 7);
  } else if (filters.range === '30days') {
    targetDate.setDate(now.getDate() - 30);
  } else if (filters.range === '90days') {
    targetDate.setDate(now.getDate() - 90);
  } else if (filters.range === '12months') {
    targetDate.setFullYear(now.getFullYear() - 1);
  } else {
    return undefined; // custom dates could be handled here
  }

  return gte(column, targetDate);
}
