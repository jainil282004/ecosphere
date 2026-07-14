import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role, SecurityRole } from '@ecosphere/shared';
import { canAssignInternalRole, meetsMinimumSecurityRole } from '@ecosphere/shared';
import { SECURITY_ROLES_KEY } from '../decorators/auth.decorators';
import type { AuthenticatedRequest } from '../types/request.types';

/**
 * RBAC middleware guard — enforces canonical security roles:
 * System_Admin | ESG_Manager | Auditor | Employee
 *
 * Prevents vertical privilege escalation by requiring the actor's highest
 * security tier to meet or exceed the route's minimum declared role.
 */
@Injectable()
export class SecurityRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<SecurityRole[]>(
      SECURITY_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const internalRoles = request.user.roles.map((assignment) => assignment.role);

    const allowed = requiredRoles.some((required) =>
      meetsMinimumSecurityRole(internalRoles, required),
    );

    if (!allowed) {
      throw new ForbiddenException(
        `RBAC denied: requires one of [${requiredRoles.join(', ')}].`,
      );
    }

    return true;
  }
}

/**
 * Prevents vertical privilege escalation on role-assignment endpoints.
 * Validates the target role in the request body against the actor's tier.
 */
@Injectable()
export class RoleAssignmentGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const body = request.body as { role?: Role } | undefined;

    if (!body?.role) {
      return true;
    }

    const actorRoles = request.user.roles.map((assignment) => assignment.role);

    if (!canAssignInternalRole(actorRoles, body.role)) {
      throw new ForbiddenException(
        'Vertical privilege escalation blocked: you cannot assign a role above your own tier.',
      );
    }

    return true;
  }
}

/**
 * Prevents horizontal privilege escalation — blocks cross-tenant org access.
 * System_Admin (super_admin) may access any org; all others must hold an
 * active role assignment scoped to the resolved organization context.
 *
 * Organization context is resolved from (in order):
 *   1. Route param :orgId
 *   2. Query ?orgId=
 *   3. Header X-Org-Id
 */
@Injectable()
export class TenantIsolationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const orgId = this.resolveOrgId(request);

    if (!orgId) {
      throw new ForbiddenException(
        'Organization context required. Provide orgId as a route param, ?orgId= query, or X-Org-Id header.',
      );
    }

    const isSystemAdmin = request.user.roles.some(
      (assignment) => assignment.role === 'super_admin',
    );

    if (isSystemAdmin) {
      request.orgId = orgId;
      return true;
    }

    const belongsToOrg = request.user.roles.some(
      (assignment) => assignment.organizationId === orgId,
    );

    if (!belongsToOrg) {
      throw new ForbiddenException(
        'Horizontal privilege escalation blocked: you are not a member of this organization.',
      );
    }

    request.orgId = orgId;
    return true;
  }

  private resolveOrgId(request: AuthenticatedRequest): string | undefined {
    const paramOrgId = request.params?.orgId;
    if (typeof paramOrgId === 'string' && paramOrgId.length > 0) {
      return paramOrgId;
    }

    const queryOrgId = request.query?.orgId;
    if (typeof queryOrgId === 'string' && queryOrgId.length > 0) {
      return queryOrgId;
    }

    const headerOrgId = request.headers['x-org-id'];
    if (typeof headerOrgId === 'string' && headerOrgId.length > 0) {
      return headerOrgId;
    }

    const bodyOrgId = (request.body as { orgId?: string } | undefined)?.orgId;
    if (typeof bodyOrgId === 'string' && bodyOrgId.length > 0) {
      return bodyOrgId;
    }

    return request.orgId;
  }
}

/**
 * Prevents horizontal user impersonation when a route exposes :targetUserId.
 * Only System_Admin and ESG_Manager may access other users' records.
 */
@Injectable()
export class SelfOrManagerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const targetUserId = request.params.targetUserId as string | undefined;

    if (!targetUserId || targetUserId === request.user.id) {
      return true;
    }

    const internalRoles = request.user.roles.map((assignment) => assignment.role);
    const elevated =
      meetsMinimumSecurityRole(internalRoles, 'ESG_Manager') ||
      meetsMinimumSecurityRole(internalRoles, 'System_Admin');

    if (!elevated) {
      throw new ForbiddenException(
        'Horizontal privilege escalation blocked: you may only access your own user record.',
      );
    }

    return true;
  }
}
