import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { ApiTags } from '@nestjs/swagger';

import { UsersService } from './users.service';

import {

  CurrentUser,

  SecureRoleAssignmentRoute,

  RequirePermissions,

} from '../../common/decorators/auth.decorators';

import { JwtAuthGuard, PermissionsGuard } from '../../common/guards/auth.guards';

import { SecurityRolesGuard, TenantIsolationGuard } from '../../common/guards/rbac.guard';

import type { AuthenticatedUser } from '../../common/types/request.types';



@ApiTags('users')

@UseGuards(JwtAuthGuard, TenantIsolationGuard, SecurityRolesGuard, PermissionsGuard)

@Controller('orgs/:orgId/users')

export class UsersController {

  constructor(private readonly usersService: UsersService) {}



  /** Vertical guard: manage_users permission + System_Admin tier only. */

  @Get()

  @RequirePermissions('manage_users')

  list(@Param('orgId') orgId: string) {

    return this.usersService.listOrgUsers(orgId);

  }



  @Get('directory')

  @RequirePermissions('submit_activities', 'view_reports', 'manage_users')

  directory(@Param('orgId') orgId: string) {

    return this.usersService.listOrgDirectory(orgId);

  }



  /** Horizontal guard: always resolves to authenticated user — no :userId param. */

  @Get('me')

  me(@Param('orgId') orgId: string, @CurrentUser() user: AuthenticatedUser) {

    return this.usersService.getMeInOrg(orgId, user.id);

  }



  /**

   * Vertical + horizontal guard stack:

   * - TenantIsolationGuard → actor must belong to :orgId

   * - RoleAssignmentGuard → cannot assign role above own tier

   * - RequireSecurityRoles('System_Admin') → only admins assign roles

   */

  @Post('roles')

  @SecureRoleAssignmentRoute()

  assignRole(

    @Param('orgId') orgId: string,

    @CurrentUser() user: AuthenticatedUser,

    @Body() body: unknown,

  ) {

    return this.usersService.assignRole(orgId, user, body);

  }

}


