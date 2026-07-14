import type { ApprovalStatus, Permission, Role } from '../constants/roles.js';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface UserRoleAssignment {
  id: string;
  role: Role;
  organizationId: string | null;
  departmentId: string | null;
}

export interface AuthSession {
  user: AuthUser;
  roles: UserRoleAssignment[];
  permissions: Permission[];
  accessToken: string;
}

export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  industry: string;
  country: string;
  isActive: boolean;
  createdAt: string;
}

export interface DepartmentSummary {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  isActive: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiErrorBody {
  type: string;
  title: string;
  detail: string;
  status: number;
  errors?: Record<string, string[]>;
}

export interface ApprovalRecord {
  id: string;
  organizationId: string;
  entityType: string;
  entityId: string;
  status: ApprovalStatus;
  submittedById: string;
  submittedAt: string | null;
  decidedById: string | null;
  decidedAt: string | null;
  decisionComment: string | null;
  sideEffectsAppliedAt: string | null;
}

export interface DashboardMetrics {
  totalCarbonKg: number;
  csrHours: number;
  openComplianceIssues: number;
  activeChallenges: number;
  pendingApprovals: number;
  employeeParticipationRate: number;
  esgScore: number;
  scopeBreakdown?: {
    scope1Kg: number;
    scope2Kg: number;
    scope3Kg: number;
  };
}

export interface VarianceSnapshot {
  id: string;
  metricKey: string;
  metricLabel: string;
  currentValue: string;
  previousValue: string;
  variancePercent: string;
  periodStart: string;
  periodEnd: string;
}

export interface GamificationProfile {
  userId: string;
  totalXp: number;
  totalPoints: number;
  level: number;
  currentStreakWeeks: number;
  longestStreakWeeks: number;
  badges: Array<{
    id: string;
    name: string;
    description: string;
    earnedAt: string;
  }>;
}

export interface ReportSummary {
  id: string;
  organizationId: string;
  reportType: string;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  fileKey: string | null;
  environmentalScore: number | null;
  socialScore: number | null;
  governanceScore: number | null;
  compositeScore: number | null;
}
