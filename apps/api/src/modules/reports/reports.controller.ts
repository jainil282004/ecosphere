import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Query,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { CurrentUser, RequirePermissions } from '../../common/decorators/auth.decorators';
import {
  JwtAuthGuard,
  PermissionsGuard,
  TenantGuard,
} from '../../common/guards/auth.guards';
import type { AuthenticatedUser } from '../../common/types/request.types';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('orgs/:orgId/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @RequirePermissions('view_reports')
  dashboard(
    @Param('orgId') orgId: string,
    @Query('range') range?: string,
    @Query('department') department?: string,
    @Query('facility') facility?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
  ) {
    return this.reportsService.getDashboardMetrics(orgId, { range, department, facility, category, status } as any);
  }

  @Get('carbon-trend')
  @RequirePermissions('view_reports')
  carbonTrend(
    @Param('orgId') orgId: string,
    @Query('range') range?: string,
    @Query('department') department?: string,
  ) {
    return this.reportsService.getCarbonTrend(orgId, { range, department } as any);
  }

  @Get('variance')
  @RequirePermissions('view_reports')
  variance(@Param('orgId') orgId: string) {
    return this.reportsService.listVarianceSnapshots(orgId);
  }

  @Get('pipeline')
  @RequirePermissions('view_reports')
  pipeline(@Param('orgId') orgId: string) {
    return this.reportsService.listReportPipelineJobs(orgId);
  }

  @Post('pipeline')
  @RequirePermissions('view_reports')
  triggerPipeline(
    @Param('orgId') orgId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ) {
    return this.reportsService.triggerReportPipeline(orgId, user.id, body);
  }

  @Post('generate')
  @RequirePermissions('view_reports')
  generate(
    @Param('orgId') orgId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { formats?: string[] } = {},
  ) {
    const formats = (body.formats ?? ['pdf', 'xlsx', 'csv']) as ('csv' | 'xlsx' | 'pdf')[];
    return this.reportsService.generateEsgScore(orgId, user.id, formats);
  }

  @Post('export')
  @RequirePermissions('view_reports')
  async exportOnDemand(
    @Param('orgId') orgId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.reportsService.exportOnDemand(orgId, user.id, body);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    return new StreamableFile(file.buffer);
  }

  @Get('pipeline/:jobId/export')
  @RequirePermissions('view_reports')
  @Header('Cache-Control', 'no-store')
  async downloadPipelineExport(
    @Param('orgId') orgId: string,
    @Param('jobId') jobId: string,
    @Query('format') format: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.reportsService.downloadPipelineExport(orgId, jobId, format ?? 'pdf');
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    return new StreamableFile(file.buffer);
  }

  @Get(':reportId/export')
  @RequirePermissions('view_reports')
  @Header('Cache-Control', 'no-store')
  async downloadReport(
    @Param('orgId') orgId: string,
    @Param('reportId') reportId: string,
    @Query('format') format: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.reportsService.downloadReportExport(orgId, reportId, format ?? 'pdf');
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    return new StreamableFile(file.buffer);
  }

  @Get()
  @RequirePermissions('view_reports')
  list(@Param('orgId') orgId: string) {
    return this.reportsService.listReports(orgId);
  }
}
