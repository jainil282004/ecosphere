import type { Role } from './roles.js';

/** Canonical security roles enforced by RBAC middleware (Step 2). */
export const SECURITY_ROLES = ['System_Admin', 'ESG_Manager', 'Auditor', 'Employee'] as const;

export type SecurityRole = (typeof SECURITY_ROLES)[number];

/** Privilege rank — higher value = more authority (vertical escalation checks). */
export const SECURITY_ROLE_RANK: Record<SecurityRole, number> = {
  Employee: 1,
  Auditor: 2,
  ESG_Manager: 3,
  System_Admin: 4,
};

/** Maps internal DB roles (user_roles.role) to security-tier roles. */
export const INTERNAL_ROLE_TO_SECURITY: Record<Role, SecurityRole> = {
  super_admin: 'System_Admin',
  org_admin: 'System_Admin',
  esg_manager: 'ESG_Manager',
  dept_head: 'ESG_Manager',
  auditor: 'Auditor',
  employee: 'Employee',
};

export function resolveSecurityRoles(internalRoles: Role[]): SecurityRole[] {
  const set = new Set<SecurityRole>();
  for (const role of internalRoles) {
    set.add(INTERNAL_ROLE_TO_SECURITY[role]);
  }
  return Array.from(set);
}

export function maxSecurityRole(internalRoles: Role[]): SecurityRole {
  const securityRoles = resolveSecurityRoles(internalRoles);
  return securityRoles.reduce(
    (highest, current) =>
      SECURITY_ROLE_RANK[current] > SECURITY_ROLE_RANK[highest] ? current : highest,
    'Employee' as SecurityRole,
  );
}

export function hasSecurityRole(internalRoles: Role[], required: SecurityRole): boolean {
  return resolveSecurityRoles(internalRoles).includes(required);
}

export function meetsMinimumSecurityRole(
  internalRoles: Role[],
  minimum: SecurityRole,
): boolean {
  const actorRank = SECURITY_ROLE_RANK[maxSecurityRole(internalRoles)];
  return actorRank >= SECURITY_ROLE_RANK[minimum];
}

/**
 * Vertical escalation prevention — actor cannot assign a role above their own tier.
 * super_admin can only be granted by an existing super_admin.
 */
export function canAssignInternalRole(actorRoles: Role[], targetRole: Role): boolean {
  if (targetRole === 'super_admin' && !actorRoles.includes('super_admin')) {
    return false;
  }

  const actorRank = SECURITY_ROLE_RANK[maxSecurityRole(actorRoles)];
  const targetRank = SECURITY_ROLE_RANK[INTERNAL_ROLE_TO_SECURITY[targetRole]];
  return targetRank <= actorRank;
}
