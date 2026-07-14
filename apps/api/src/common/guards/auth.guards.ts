import {

  CanActivate,

  ExecutionContext,

  ForbiddenException,

  Injectable,

  UnauthorizedException,

} from '@nestjs/common';

import { Reflector } from '@nestjs/core';

import { AuthGuard } from '@nestjs/passport';

import type { Permission, Role } from '@ecosphere/shared';

import { PERMISSIONS_KEY, ROLES_KEY } from '../decorators/auth.decorators';

import type { AuthenticatedRequest } from '../types/request.types';



@Injectable()

export class JwtAuthGuard extends AuthGuard('jwt') {

  handleRequest<TUser>(err: Error | null, user: TUser | false): TUser {

    if (err || !user) {

      throw err ?? new UnauthorizedException('Authentication required.');

    }

    return user;

  }

}



@Injectable()

export class RolesGuard implements CanActivate {

  constructor(private readonly reflector: Reflector) {}



  canActivate(context: ExecutionContext): boolean {

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [

      context.getHandler(),

      context.getClass(),

    ]);



    if (!requiredRoles || requiredRoles.length === 0) {

      return true;

    }



    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const userRoles = request.user.roles.map((assignment) => assignment.role);

    const hasRole = requiredRoles.some((role) => userRoles.includes(role));



    if (!hasRole) {

      throw new ForbiddenException('Insufficient role privileges.');

    }



    return true;

  }

}



@Injectable()

export class PermissionsGuard implements CanActivate {

  constructor(private readonly reflector: Reflector) {}



  canActivate(context: ExecutionContext): boolean {

    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(

      PERMISSIONS_KEY,

      [context.getHandler(), context.getClass()],

    );



    if (!requiredPermissions || requiredPermissions.length === 0) {

      return true;

    }



    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const hasPermission = requiredPermissions.some((permission) =>

      request.user.permissions.includes(permission),

    );



    if (!hasPermission) {

      throw new ForbiddenException('Insufficient permissions.');

    }



    return true;

  }

}



/** @deprecated Use TenantIsolationGuard from rbac.guard.ts — kept for backward compatibility. */

@Injectable()

export class TenantGuard implements CanActivate {

  canActivate(context: ExecutionContext): boolean {

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const orgId = request.params.orgId as string | undefined;



    if (!orgId) {

      return true;

    }



    const isSuperAdmin = request.user.roles.some(

      (assignment) => assignment.role === 'super_admin',

    );



    if (isSuperAdmin) {

      request.orgId = orgId;

      return true;

    }



    const belongsToOrg = request.user.roles.some(

      (assignment) => assignment.organizationId === orgId,

    );



    if (!belongsToOrg) {

      throw new ForbiddenException('Access denied for this organization.');

    }



    request.orgId = orgId;

    return true;

  }

}


