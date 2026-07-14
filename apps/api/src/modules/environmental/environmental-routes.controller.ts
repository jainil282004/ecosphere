import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { EnvironmentalMetricService } from './environmental-metric.service';
import { EnvironmentalService } from './environmental.service';
import { CurrentUser, ResolvedOrgId, SecureOrgRoute } from '../../common/decorators/auth.decorators';
import { JwtAuthGuard, PermissionsGuard } from '../../common/guards/auth.guards';
import { SecurityRolesGuard, TenantIsolationGuard } from '../../common/guards/rbac.guard';
import type { AuthenticatedUser } from '../../common/types/request.types';

/**
 * Domain-first REST routes (Step 2):
 *   GET /api/v1/environmental/emissions?orgId={uuid}
 *
 * Organization context via ?orgId= or X-Org-Id header.
 * RBAC: TenantIsolationGuard + SecurityRolesGuard (System_Admin | ESG_Manager | Auditor | Employee).
 */
@ApiTags('environmental')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantIsolationGuard, SecurityRolesGuard, PermissionsGuard)
@Controller('environmental')
export class EnvironmentalRoutesController {
  constructor(
    private readonly environmentalService: EnvironmentalService,
    private readonly environmentalMetricService: EnvironmentalMetricService,
  ) {}

  @Post('metrics')
  @SecureOrgRoute('submit_activities')
  logMetric(
    @ResolvedOrgId() orgId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
    @Req() request: Request,
  ) {
    return this.environmentalMetricService.logMetric(
      orgId,
      user.id,
      body,
      request.ip ?? null,
    );
  }

  @Get('emissions')
  @SecureOrgRoute('view_reports', 'submit_activities', 'approve_submissions', 'manage_audits')
  listEmissions(@ResolvedOrgId() orgId: string, @Query() query: unknown) {
    return this.environmentalService.listEmissions(orgId, query);
  }
}
