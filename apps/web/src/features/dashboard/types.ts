export interface CarbonTransactionRow {
  id: string;
  activityType: string;
  co2eKg: string;
  status: string;
  quantity: string;
  unit: string;
  scope: 'scope_1' | 'scope_2' | 'scope_3';
  activityDate?: string;
  createdAt?: string;
}

export interface ScopeTrendPoint {
  month: string;
  scope1: number;
  scope2: number;
  scope3: number;
  total: number;
}

export interface LeaderboardEntry {
  userId: string;
  firstName: string;
  lastName: string;
  totalXp: number;
  rank: number;
}

export interface EmissionFactorOption {
  id: string;
  name: string;
  category: string;
  scope: 'scope_1' | 'scope_2' | 'scope_3';
  unit: string;
  factorValue: string;
}

export interface DepartmentOption {
  id: string;
  name: string;
}
