import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { GovernanceService } from './governance.service';
import {
  CurrentUser,
  ResolvedOrgId,
  SecureAuditorRoute,
} from '../../common/decorators/auth.decorators';
import { JwtAuthGuard, PermissionsGuard } from '../../common/guards/auth.guards';
import { SecurityRolesGuard, TenantIsolationGuard } from '../../common/guards/rbac.guard';
import type { AuthenticatedUser } from '../../common/types/request.types';

/**
 * Domain-first REST routes (Step 2):
 *   GET  /api/v1/governance/audits?orgId={uuid}
 *   POST /api/v1/governance/audits  { orgId, action, entityType, ... }
 *
 * RBAC: Auditor tier minimum (Auditor | ESG_Manager | System_Admin) + manage_audits permission.
 */
@ApiTags('governance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantIsolationGuard, SecurityRolesGuard, PermissionsGuard)
@Controller('governance')
export class GovernanceRoutesController {
  constructor(private readonly governanceService: GovernanceService) {}

  @Get('audits')
  @SecureAuditorRoute('manage_audits', 'view_reports')
  listAudits(@ResolvedOrgId() orgId: string, @Query() query: unknown) {
    return this.governanceService.listAuditLogs(orgId, query);
  }

  @Post('audits')
  @SecureAuditorRoute('manage_audits')
  createAudit(
    @ResolvedOrgId() orgId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
    @Req() request: Request,
  ) {
    return this.governanceService.createAudit(orgId, user.id, body, request.ip ?? null);
  }
}
