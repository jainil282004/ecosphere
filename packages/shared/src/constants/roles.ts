export const ROLES = [
  'super_admin',
  'org_admin',
  'esg_manager',
  'dept_head',
  'auditor',
  'employee',
] as const;

export type Role = (typeof ROLES)[number];

export const APPROVAL_STATUSES = [
  'draft',
  'submitted',
  'approved',
  'rejected',
  'cancelled',
] as const;

export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export const APPROVAL_ENTITY_TYPES = [
  'csr_activity',
  'carbon_transaction',
  'challenge_participation',
  'reward_redemption',
  'resource_consumption',
  'framework_metric',
  'dei_snapshot',
] as const;

export type ApprovalEntityType = (typeof APPROVAL_ENTITY_TYPES)[number];

export const LEDGER_ENTRY_TYPES = ['credit', 'debit'] as const;
export type LedgerEntryType = (typeof LEDGER_ENTRY_TYPES)[number];

export const XP_SOURCE_TYPES = [
  'csr_activity',
  'challenge_participation',
  'policy_acknowledgement',
  'carbon_transaction',
  'manual_adjustment',
] as const;

export type XpSourceType = (typeof XP_SOURCE_TYPES)[number];

export const POINTS_SOURCE_TYPES = [
  'csr_activity',
  'challenge_participation',
  'reward_redemption',
  'manual_adjustment',
] as const;

export type PointsSourceType = (typeof POINTS_SOURCE_TYPES)[number];

export const CARBON_SOURCE_TYPES = [
  'activity_submission',
  'manual_adjustment',
  'offset_purchase',
] as const;

export type CarbonSourceType = (typeof CARBON_SOURCE_TYPES)[number];

export const COMPLIANCE_ISSUE_STATUSES = [
  'open',
  'in_progress',
  'resolved',
  'closed',
  'escalated',
] as const;

export type ComplianceIssueStatus = (typeof COMPLIANCE_ISSUE_STATUSES)[number];

export const CHALLENGE_STATUSES = [
  'draft',
  'active',
  'completed',
  'cancelled',
] as const;

export type ChallengeStatus = (typeof CHALLENGE_STATUSES)[number];

export const NOTIFICATION_TYPES = [
  'approval_required',
  'approval_decision',
  'badge_earned',
  'reward_redeemed',
  'compliance_overdue',
  'report_ready',
  'policy_published',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const PERMISSIONS = {
  MANAGE_PLATFORM: 'manage_platform',
  MANAGE_ORG: 'manage_org',
  MANAGE_DEPARTMENTS: 'manage_departments',
  MANAGE_USERS: 'manage_users',
  MANAGE_CONFIG: 'manage_config',
  MANAGE_EMISSION_FACTORS: 'manage_emission_factors',
  MANAGE_WEIGHTAGES: 'manage_weightages',
  MANAGE_BADGES: 'manage_badges',
  MANAGE_REWARDS: 'manage_rewards',
  MANAGE_GOALS: 'manage_goals',
  APPROVE_SUBMISSIONS: 'approve_submissions',
  VIEW_REPORTS: 'view_reports',
  MANAGE_AUDITS: 'manage_audits',
  MANAGE_COMPLIANCE: 'manage_compliance',
  SUBMIT_ACTIVITIES: 'submit_activities',
  REDEEM_REWARDS: 'redeem_rewards',
  VIEW_OWN_GAMIFICATION: 'view_own_gamification',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: [
    PERMISSIONS.MANAGE_PLATFORM,
    PERMISSIONS.MANAGE_ORG,
    PERMISSIONS.MANAGE_DEPARTMENTS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_CONFIG,
    PERMISSIONS.MANAGE_EMISSION_FACTORS,
    PERMISSIONS.MANAGE_WEIGHTAGES,
    PERMISSIONS.MANAGE_BADGES,
    PERMISSIONS.MANAGE_REWARDS,
    PERMISSIONS.MANAGE_GOALS,
    PERMISSIONS.APPROVE_SUBMISSIONS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.MANAGE_AUDITS,
    PERMISSIONS.MANAGE_COMPLIANCE,
    PERMISSIONS.SUBMIT_ACTIVITIES,
    PERMISSIONS.REDEEM_REWARDS,
    PERMISSIONS.VIEW_OWN_GAMIFICATION,
  ],
  org_admin: [
    PERMISSIONS.MANAGE_ORG,
    PERMISSIONS.MANAGE_DEPARTMENTS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_CONFIG,
    PERMISSIONS.MANAGE_EMISSION_FACTORS,
    PERMISSIONS.MANAGE_WEIGHTAGES,
    PERMISSIONS.MANAGE_BADGES,
    PERMISSIONS.MANAGE_REWARDS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.MANAGE_AUDITS,
    PERMISSIONS.MANAGE_COMPLIANCE,
    PERMISSIONS.VIEW_OWN_GAMIFICATION,
  ],
  esg_manager: [
    PERMISSIONS.MANAGE_GOALS,
    PERMISSIONS.MANAGE_EMISSION_FACTORS,
    PERMISSIONS.APPROVE_SUBMISSIONS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.MANAGE_COMPLIANCE,
    PERMISSIONS.SUBMIT_ACTIVITIES,
    PERMISSIONS.VIEW_OWN_GAMIFICATION,
  ],
  dept_head: [
    PERMISSIONS.APPROVE_SUBMISSIONS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.SUBMIT_ACTIVITIES,
    PERMISSIONS.VIEW_OWN_GAMIFICATION,
  ],
  auditor: [
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.MANAGE_AUDITS,
    PERMISSIONS.MANAGE_COMPLIANCE,
    PERMISSIONS.VIEW_OWN_GAMIFICATION,
  ],
  employee: [
    PERMISSIONS.SUBMIT_ACTIVITIES,
    PERMISSIONS.REDEEM_REWARDS,
    PERMISSIONS.VIEW_OWN_GAMIFICATION,
  ],
};

export function roleHasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function resolvePermissions(roles: Role[]): Permission[] {
  const set = new Set<Permission>();
  for (const role of roles) {
    for (const permission of ROLE_PERMISSIONS[role]) {
      set.add(permission);
    }
  }
  return Array.from(set);
}
