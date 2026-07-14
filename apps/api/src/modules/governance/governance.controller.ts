import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GovernanceService } from './governance.service';
import {
  CurrentUser,
  SecureAuditorRoute,
  SecureEmployeeRoute,
  SecureManagerRoute,
  SecureOrgAdminRoute,
} from '../../common/decorators/auth.decorators';
import { JwtAuthGuard, PermissionsGuard } from '../../common/guards/auth.guards';
import { SecurityRolesGuard, TenantIsolationGuard } from '../../common/guards/rbac.guard';
import type { AuthenticatedUser } from '../../common/types/request.types';

@ApiTags('governance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantIsolationGuard, SecurityRolesGuard, PermissionsGuard)
@Controller('orgs/:orgId/governance')
export class GovernanceController {
  constructor(private readonly governanceService: GovernanceService) {}

  @Get('compliance-issues')
  @SecureAuditorRoute('manage_compliance', 'view_reports')
  listIssues(@Param('orgId') orgId: string) {
    return this.governanceService.listComplianceIssues(orgId);
  }

  @Post('compliance-issues')
  @SecureManagerRoute('manage_compliance')
  createIssue(
    @Param('orgId') orgId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ) {
    return this.governanceService.createComplianceIssue(orgId, user.id, body);
  }

  @Patch('compliance-issues/:id/status')
  @SecureManagerRoute('manage_compliance')
  updateIssueStatus(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ) {
    return this.governanceService.updateComplianceIssueStatus(orgId, id, user.id, body);
  }

  @Get('policies')
  @SecureEmployeeRoute('submit_activities', 'view_own_gamification', 'view_reports')
  listPolicies(@Param('orgId') orgId: string) {
    return this.governanceService.listPolicies(orgId);
  }

  @Post('policies')
  @SecureOrgAdminRoute('manage_org')
  createPolicy(
    @Param('orgId') orgId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ) {
    return this.governanceService.createPolicy(orgId, user.id, body);
  }

  @Post('policies/acknowledge')
  @SecureEmployeeRoute('submit_activities', 'view_own_gamification')
  acknowledgePolicy(
    @Param('orgId') orgId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ) {
    return this.governanceService.acknowledgePolicy(orgId, user.id, body);
  }

  @Get('frameworks/mappings')
  @SecureAuditorRoute('manage_compliance', 'view_reports')
  listFrameworkMappings(
    @Param('orgId') orgId: string,
    @Query('framework') framework?: string,
  ) {
    return this.governanceService.listFrameworkMappings(orgId, framework);
  }

  @Post('frameworks/mappings')
  @SecureManagerRoute('manage_compliance')
  createFrameworkMapping(@Param('orgId') orgId: string, @Body() body: unknown) {
    return this.governanceService.createFrameworkMapping(orgId, body);
  }

  @Get('frameworks/submissions')
  @SecureAuditorRoute('manage_compliance', 'view_reports')
  listFrameworkSubmissions(@Param('orgId') orgId: string) {
    return this.governanceService.listFrameworkSubmissions(orgId);
  }

  @Post('frameworks/submissions')
  @SecureManagerRoute('manage_compliance')
  submitFrameworkMetric(
    @Param('orgId') orgId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ) {
    return this.governanceService.submitFrameworkMetric(orgId, user.id, body);
  }

  @Get('audit-logs')
  @SecureAuditorRoute('manage_audits')
  listAuditLogs(@Param('orgId') orgId: string, @Query() query: unknown) {
    return this.governanceService.listAuditLogs(orgId, query);
  }
}
