import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import {
  CurrentUser,
  RequireRoles,
  RequireSecurityRoles,
} from '../../common/decorators/auth.decorators';
import { JwtAuthGuard, RolesGuard } from '../../common/guards/auth.guards';
import { SecurityRolesGuard, TenantIsolationGuard } from '../../common/guards/rbac.guard';
import type { AuthenticatedUser } from '../../common/types/request.types';

@ApiTags('organizations')
@UseGuards(JwtAuthGuard, RolesGuard, SecurityRolesGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    const isSystemAdmin = user.roles.some((role) => role.role === 'super_admin');
    if (isSystemAdmin) {
      return this.organizationsService.listAll();
    }
    return this.organizationsService.listForUser(user.id, user.roles);
  }

  @Post()
  @RequireSecurityRoles('System_Admin')
  @RequireRoles('super_admin')
  create(@Body() body: unknown) {
    return this.organizationsService.create(body);
  }

  @Get(':orgId')
  @UseGuards(TenantIsolationGuard)
  getOne(@Param('orgId') orgId: string) {
    return this.organizationsService.getById(orgId);
  }
}
