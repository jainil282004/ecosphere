export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  organizations: {
    all: ['organizations'] as const,
    detail: (orgId: string) => ['organizations', orgId] as const,
  },
  org: (orgId: string) => ['org', orgId] as const,
  dashboard: (orgId: string) => [...queryKeys.org(orgId), 'dashboard'] as const,
  dashboardFootprint: (orgId: string) =>
    [...queryKeys.org(orgId), 'dashboard', 'footprint'] as const,
  departments: (orgId: string) => [...queryKeys.org(orgId), 'departments'] as const,
  users: {
    directory: (orgId: string) => [...queryKeys.org(orgId), 'users', 'directory'] as const,
  },
  csr: {
    all: (orgId: string) => [...queryKeys.org(orgId), 'csr'] as const,
    list: (orgId: string) => [...queryKeys.csr.all(orgId), 'list'] as const,
  },
  carbon: {
    all: (orgId: string) => [...queryKeys.org(orgId), 'carbon'] as const,
    factors: (orgId: string, scope?: string) =>
      [...queryKeys.carbon.all(orgId), 'factors', scope ?? 'all'] as const,
    transactions: (orgId: string, scope?: string) =>
      [...queryKeys.carbon.all(orgId), 'transactions', scope ?? 'all'] as const,
    resources: (orgId: string) => [...queryKeys.carbon.all(orgId), 'resources'] as const,
    scopeTotals: (orgId: string) => [...queryKeys.carbon.all(orgId), 'scope-totals'] as const,
  },
  social: {
    dei: (orgId: string) => [...queryKeys.org(orgId), 'social', 'dei'] as const,
  },
  approvals: {
    inbox: (orgId: string) => [...queryKeys.org(orgId), 'approvals', 'inbox'] as const,
  },
  gamification: {
    profile: (orgId: string) => [...queryKeys.org(orgId), 'gamification', 'profile'] as const,
    leaderboard: (orgId: string) =>
      [...queryKeys.org(orgId), 'gamification', 'leaderboard'] as const,
  },
  reports: {
    carbonTrend: (orgId: string) => [...queryKeys.org(orgId), 'reports', 'carbon-trend'] as const,
    variance: (orgId: string) => [...queryKeys.org(orgId), 'reports', 'variance'] as const,
    list: (orgId: string) => [...queryKeys.org(orgId), 'reports', 'list'] as const,
    pipeline: (orgId: string) => [...queryKeys.org(orgId), 'reports', 'pipeline'] as const,
  },
  governance: {
    issues: (orgId: string) => [...queryKeys.org(orgId), 'governance', 'issues'] as const,
    policies: (orgId: string) => [...queryKeys.org(orgId), 'governance', 'policies'] as const,
    frameworks: (orgId: string) => [...queryKeys.org(orgId), 'governance', 'frameworks'] as const,
    submissions: (orgId: string) => [...queryKeys.org(orgId), 'governance', 'submissions'] as const,
    auditLogs: (orgId: string) => [...queryKeys.org(orgId), 'governance', 'audit-logs'] as const,
  },
  rewards: (orgId: string) => [...queryKeys.org(orgId), 'rewards'] as const,
  notifications: (orgId: string) => [...queryKeys.org(orgId), 'notifications'] as const,
};
