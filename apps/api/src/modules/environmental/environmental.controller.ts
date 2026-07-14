import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { EnvironmentalMetricService } from './environmental-metric.service';
import { EnvironmentalService } from './environmental.service';
import { CurrentUser, SecureManagerRoute, SecureOrgRoute } from '../../common/decorators/auth.decorators';
import { JwtAuthGuard, PermissionsGuard } from '../../common/guards/auth.guards';
import { SecurityRolesGuard, TenantIsolationGuard } from '../../common/guards/rbac.guard';
import type { AuthenticatedUser } from '../../common/types/request.types';

@ApiTags('environmental')
@UseGuards(JwtAuthGuard, TenantIsolationGuard, SecurityRolesGuard, PermissionsGuard)
@Controller('orgs/:orgId/environmental')
export class EnvironmentalController {
  constructor(
    private readonly environmentalService: EnvironmentalService,
    private readonly environmentalMetricService: EnvironmentalMetricService,
  ) {}

  /** Step 3 — Environmental Metric Logging pipeline (Scope 1/2/3). */
  @Post('metrics/log')
  @SecureOrgRoute('submit_activities')
  logEnvironmentalMetric(
    @Param('orgId') orgId: string,
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

  @Post('carbon/calculate')
  @SecureOrgRoute('submit_activities', 'manage_emission_factors', 'view_reports')
  calculateCarbon(@Body() body: unknown) {
    return this.environmentalService.calculateCarbon(body);
  }

  @Post('carbon/verify')
  @SecureOrgRoute('submit_activities', 'manage_emission_factors')
  verifyDocument(@Param('orgId') orgId: string, @Body() body: unknown) {
    return this.environmentalService.verifyDocument(orgId, body);
  }

  @Get('carbon/footprint')
  @SecureOrgRoute('view_reports', 'submit_activities', 'approve_submissions')
  footprintSummary(@Param('orgId') orgId: string) {
    return this.environmentalService.getFootprintSummary(orgId);
  }

  @Get('emission-factors')
  @SecureOrgRoute('manage_emission_factors', 'submit_activities', 'view_reports')
  listFactors(@Param('orgId') orgId: string, @Query('scope') scope?: string) {
    return this.environmentalService.listEmissionFactors(orgId, scope);
  }

  @Post('emission-factors')
  @SecureManagerRoute('manage_emission_factors')
  createFactor(
    @Param('orgId') orgId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ) {
    return this.environmentalService.createEmissionFactor(orgId, user.id, body);
  }

  @Get('carbon-transactions')
  @SecureOrgRoute('submit_activities', 'view_reports', 'approve_submissions')
  listTransactions(@Param('orgId') orgId: string, @Query() query: unknown) {
    return this.environmentalService.listCarbonTransactions(orgId, query);
  }

  @Post('carbon-transactions')
  @SecureOrgRoute('submit_activities')
  createTransaction(
    @Param('orgId') orgId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ) {
    return this.environmentalService.createCarbonTransaction(orgId, user.id, body);
  }

  @Get('carbon-transactions/:id')
  @SecureOrgRoute('submit_activities', 'view_reports', 'approve_submissions')
  getTransaction(@Param('orgId') orgId: string, @Param('id') id: string) {
    return this.environmentalService.getCarbonTransaction(orgId, id);
  }

  @Get('scope-breakdown')
  @SecureOrgRoute('view_reports', 'submit_activities')
  scopeBreakdown(@Param('orgId') orgId: string) {
    return this.environmentalService.getScopeBreakdown(orgId);
  }

  @Get('scope-totals')
  @SecureOrgRoute('view_reports', 'submit_activities')
  scopeTotals(@Param('orgId') orgId: string) {
    return this.environmentalService.getScopeTotals(orgId);
  }

  @Get('resource-consumption')
  @SecureOrgRoute('submit_activities', 'view_reports')
  listResourceConsumption(
    @Param('orgId') orgId: string,
    @Query('resourceType') resourceType?: string,
  ) {
    return this.environmentalService.listResourceConsumption(orgId, resourceType);
  }

  @Post('resource-consumption')
  @SecureOrgRoute('submit_activities')
  createResourceConsumption(
    @Param('orgId') orgId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ) {
    return this.environmentalService.createResourceConsumption(orgId, user.id, body);
  }
}
