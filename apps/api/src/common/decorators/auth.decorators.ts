import { applyDecorators, createParamDecorator, ExecutionContext, ForbiddenException, SetMetadata, UseGuards } from '@nestjs/common';

import type { Permission, Role, SecurityRole } from '@ecosphere/shared';

import type { AuthenticatedRequest } from '../types/request.types';

import { JwtAuthGuard, PermissionsGuard } from '../guards/auth.guards';

import {

  RoleAssignmentGuard,

  SecurityRolesGuard,

  TenantIsolationGuard,

} from '../guards/rbac.guard';



export const ROLES_KEY = 'roles';

export const PERMISSIONS_KEY = 'permissions';

export const SECURITY_ROLES_KEY = 'security_roles';



export const RequireRoles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

export const RequirePermissions = (...permissions: Permission[]) =>

  SetMetadata(PERMISSIONS_KEY, permissions);



export const RequireSecurityRoles = (...roles: SecurityRole[]) =>

  SetMetadata(SECURITY_ROLES_KEY, roles);



export const CurrentUser = createParamDecorator(

  (_data: unknown, ctx: ExecutionContext) => {

    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();

    return request.user;

  },

);



export const OrgIdParam = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.params.orgId as string;
  },
);

/** Resolved tenant from TenantIsolationGuard (param, query, or header). */
export const ResolvedOrgId = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  if (!request.orgId) {
    throw new ForbiddenException('Organization context is not available on this request.');
  }
  return request.orgId;
});



/** JWT cookie → tenant isolation → RBAC tier → permissions. */

export function SecureOrgRoute(...permissions: Permission[]) {

  return applyDecorators(

    UseGuards(JwtAuthGuard, TenantIsolationGuard, SecurityRolesGuard, PermissionsGuard),

    RequirePermissions(...permissions),

  );

}



export function SecureOrgAdminRoute(...permissions: Permission[]) {

  return applyDecorators(

    UseGuards(JwtAuthGuard, TenantIsolationGuard, SecurityRolesGuard, PermissionsGuard),

    RequireSecurityRoles('System_Admin'),

    RequirePermissions(...permissions),

  );

}



export function SecureManagerRoute(...permissions: Permission[]) {
  return applyDecorators(
    UseGuards(JwtAuthGuard, TenantIsolationGuard, SecurityRolesGuard, PermissionsGuard),
    RequireSecurityRoles('System_Admin', 'ESG_Manager'),
    RequirePermissions(...permissions),
  );
}

export function SecureAuditorRoute(...permissions: Permission[]) {
  return applyDecorators(
    UseGuards(JwtAuthGuard, TenantIsolationGuard, SecurityRolesGuard, PermissionsGuard),
    RequireSecurityRoles('System_Admin', 'ESG_Manager', 'Auditor'),
    RequirePermissions(...permissions),
  );
}

export function SecureEmployeeRoute(...permissions: Permission[]) {
  return applyDecorators(
    UseGuards(JwtAuthGuard, TenantIsolationGuard, SecurityRolesGuard, PermissionsGuard),
    RequireSecurityRoles('System_Admin', 'ESG_Manager', 'Auditor', 'Employee'),
    RequirePermissions(...permissions),
  );
}



export function SecureRoleAssignmentRoute() {

  return applyDecorators(

    UseGuards(

      JwtAuthGuard,

      TenantIsolationGuard,

      SecurityRolesGuard,

      PermissionsGuard,

      RoleAssignmentGuard,

    ),

    RequireSecurityRoles('System_Admin'),

    RequirePermissions('manage_users'),

  );

}


