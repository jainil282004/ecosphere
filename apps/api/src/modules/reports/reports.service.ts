import { Injectable, NotFoundException } from '@nestjs/common';
import {
  exportReportSchema,
  type ReportExportFormat,
  triggerReportPipelineSchema,
} from '@ecosphere/shared';
import { DomainRepository } from '../../database/repositories/domain.repository';
import { LedgerRepository } from '../../database/repositories/ledger.repository';
import { NotificationsRepository } from '../../database/repositories/notifications.repository';
import { ReportsRepository } from '../../database/repositories/reports.repository';
import { TenantRepository } from '../../database/repositories/tenant.repository';
import { ReportExportService } from './report-export.service';
import { EXPORT_MIME, type EsgReportDataset } from './report-export.types';
import { ReportStorageService } from './report-storage.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly reportsRepository: ReportsRepository,
    private readonly ledgerRepository: LedgerRepository,
    private readonly domainRepository: DomainRepository,
    private readonly tenantRepository: TenantRepository,
    private readonly notificationsRepository: NotificationsRepository,
    private readonly reportExportService: ReportExportService,
    private readonly reportStorageService: ReportStorageService,
  ) {}

  async getDashboardMetrics(orgId: string) {
    const carbonResult = await this.ledgerRepository.getCarbonLedgerTotal(orgId);
    const csrResult = await this.reportsRepository.getApprovedCsrHours(orgId);
    const openIssuesResult = await this.reportsRepository.countOpenComplianceIssues(orgId);
    const pendingApprovalsResult = await this.reportsRepository.countPendingApprovals(orgId);
    const employeeCountResult = await this.reportsRepository.countEmployees(orgId);
    const activeParticipantsResult =
      await this.reportsRepository.countActiveCsrParticipants(orgId);
    const latestScore = await this.reportsRepository.getLatestScoreSnapshot(orgId);
    const scopeBreakdown = await this.domainRepository.getCarbonScopeBreakdown(orgId);

    const employeeCount = Number(employeeCountResult[0]?.value ?? 0);
    const activeParticipants = Number(activeParticipantsResult[0]?.value ?? 0);

    return {
      totalCarbonKg: Number(carbonResult[0]?.total ?? 0),
      csrHours: Number(csrResult[0]?.total ?? 0),
      openComplianceIssues: Number(openIssuesResult[0]?.value ?? 0),
      activeChallenges: 0,
      pendingApprovals: Number(pendingApprovalsResult[0]?.value ?? 0),
      employeeParticipationRate:
        employeeCount > 0 ? Math.round((activeParticipants / employeeCount) * 100) : 0,
      esgScore: Number(latestScore?.compositeScore ?? 0),
      scopeBreakdown: scopeBreakdown
        ? {
            scope1Kg: Number(scopeBreakdown.scope1Kg),
            scope2Kg: Number(scopeBreakdown.scope2Kg),
            scope3Kg: Number(scopeBreakdown.scope3Kg),
          }
        : { scope1Kg: 0, scope2Kg: 0, scope3Kg: 0 },
    };
  }

  async generateEsgScore(orgId: string, userId: string, formats: ReportExportFormat[] = ['pdf']) {
    const periodEnd = new Date();
    const periodStart = new Date();
    periodStart.setMonth(periodStart.getMonth() - 3);

    const weightage = await this.reportsRepository.getLatestWeightage(orgId);
    if (!weightage) {
      throw new Error('ESG weightages not configured for organization.');
    }

    const envWeight = Number(weightage.environmentalWeight);
    const socialWeight = Number(weightage.socialWeight);
    const govWeight = Number(weightage.governanceWeight);

    const carbonTotal = await this.reportsRepository.getApprovedCarbonLedgerTotal(orgId);
    const csrHours = await this.reportsRepository.getApprovedCsrHours(orgId);
    const resolvedIssues = await this.reportsRepository.countResolvedIssues(orgId);

    const totalCarbon = Number(carbonTotal[0]?.total ?? 0);
    const totalCsrHours = Number(csrHours[0]?.total ?? 0);
    const resolvedCount = Number(resolvedIssues[0]?.value ?? 0);

    const environmentalScore = Math.max(0, 100 - Math.min(totalCarbon / 100, 100));
    const socialScore = Math.min(totalCsrHours * 2, 100);
    const governanceScore = Math.min(resolvedCount * 10, 100);
    const compositeScore =
      environmentalScore * (envWeight / 100) +
      socialScore * (socialWeight / 100) +
      governanceScore * (govWeight / 100);

    const [snapshot] = await this.reportsRepository.insertScoreSnapshot({
      organizationId: orgId,
      periodStart,
      periodEnd,
      environmentalScore: environmentalScore.toFixed(4),
      socialScore: socialScore.toFixed(4),
      governanceScore: governanceScore.toFixed(4),
      compositeScore: compositeScore.toFixed(4),
      weightageSnapshot: {
        environmentalWeight: envWeight,
        socialWeight: socialWeight,
        governanceWeight: govWeight,
        capturedAt: new Date().toISOString(),
      },
    });

    const [report] = await this.reportsRepository.insertReport({
      organizationId: orgId,
      reportType: 'esg_quarterly',
      periodStart,
      periodEnd,
      scoreSnapshotId: snapshot?.id ?? null,
      generatedById: userId,
    });

    await this.calculateVarianceSnapshots(orgId, periodStart, periodEnd, {
      carbon: totalCarbon,
      csrHours: totalCsrHours,
      composite: compositeScore,
    });

    const exportFiles = report
      ? await this.persistReportExports(orgId, report.id, userId, formats, {
          reportType: 'esg_quarterly',
          periodStart,
          periodEnd,
        })
      : [];

    return {
      snapshot,
      report,
      scores: { environmentalScore, socialScore, governanceScore, compositeScore },
      exportFiles: exportFiles.map((f) => ({ format: f.format, fileKey: f.fileKey, filename: f.filename })),
    };
  }

  listReports(orgId: string) {
    return this.reportsRepository.listReportsWithScores(orgId);
  }

  getCarbonTrend(orgId: string) {
    return this.reportsRepository.getCarbonTrend(orgId);
  }

  listVarianceSnapshots(orgId: string) {
    return this.domainRepository.listVarianceSnapshots(orgId);
  }

  listReportPipelineJobs(orgId: string) {
    return this.domainRepository.listReportPipelineJobs(orgId);
  }

  async triggerReportPipeline(orgId: string, userId: string, body: unknown) {
    const input = triggerReportPipelineSchema.parse(body);
    const periodStart = new Date(input.periodStart);
    const periodEnd = new Date(input.periodEnd);
    const formats = input.formats ?? ['pdf', 'xlsx'];

    const [job] = await this.domainRepository.createReportPipelineJob({
      organizationId: orgId,
      reportType: input.reportType,
      framework: input.framework ?? null,
      periodStart,
      periodEnd,
      status: 'queued',
      currentStep: 'queued',
      createdById: userId,
    });

    if (!job) {
      return this.domainRepository.listReportPipelineJobs(orgId);
    }

    return this.processReportPipeline(
      job.id,
      orgId,
      userId,
      periodStart,
      periodEnd,
      input.reportType,
      input.framework,
      formats,
    );
  }

  async exportOnDemand(orgId: string, userId: string, body: unknown) {
    const input = exportReportSchema.parse(body);
    const periodEnd = input.periodEnd ? new Date(input.periodEnd) : new Date();
    const periodStart = input.periodStart
      ? new Date(input.periodStart)
      : new Date(periodEnd.getTime() - 90 * 24 * 60 * 60 * 1000);

    const dataset = await this.buildReportDataset(orgId, {
      reportType: input.reportType,
      periodStart,
      periodEnd,
      module: input.module,
      departmentId: input.departmentId,
      framework: null,
    });

    const generated = await this.reportExportService.generate(dataset, input.format);
    const fileKey = await this.reportStorageService.save(orgId, generated.filename, generated.buffer);

    const [report] = await this.reportsRepository.insertReport({
      organizationId: orgId,
      reportType: input.reportType,
      periodStart,
      periodEnd,
      fileKey,
      generatedById: userId,
    });

    if (report) {
      await this.notifyReportReady(orgId, userId, report.id, generated.filename);
    }

    return { ...generated, reportId: report?.id ?? null, fileKey };
  }

  async downloadReportExport(orgId: string, reportId: string, format: string) {
    const parsedFormat = exportReportSchema.shape.format.parse(format);
    const report = await this.reportsRepository.getReportById(orgId, reportId);
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    const ext = parsedFormat === 'xlsx' ? 'xlsx' : parsedFormat;
    if (report.fileKey?.endsWith(`.${ext}`)) {
      const buffer = await this.reportStorageService.read(report.fileKey);
      const dataset = await this.buildReportDataset(orgId, {
        reportType: report.reportType,
        periodStart: report.periodStart,
        periodEnd: report.periodEnd,
      });
      return {
        buffer,
        filename: this.reportExportService.buildFilename(dataset, parsedFormat),
        mimeType: EXPORT_MIME[parsedFormat],
      };
    }

    const dataset = await this.buildReportDataset(orgId, {
      reportType: report.reportType,
      periodStart: report.periodStart,
      periodEnd: report.periodEnd,
    });
    const generated = await this.reportExportService.generate(dataset, parsedFormat);
    const fileKey = await this.reportStorageService.save(orgId, generated.filename, generated.buffer);
    await this.reportsRepository.updateReportFileKey(reportId, fileKey);
    return generated;
  }

  async downloadPipelineExport(orgId: string, jobId: string, format: string) {
    const parsedFormat = exportReportSchema.shape.format.parse(format);
    const job = await this.domainRepository.getReportPipelineJobById(orgId, jobId);
    if (!job || job.status !== 'completed') {
      throw new NotFoundException('Completed pipeline job not found');
    }

    const dataset = await this.buildReportDataset(orgId, {
      reportType: job.reportType,
      periodStart: job.periodStart,
      periodEnd: job.periodEnd,
      framework: job.framework,
      payload: job.payloadSnapshot as Record<string, unknown> | null,
    });

    return this.reportExportService.generate(dataset, parsedFormat);
  }

  private async persistReportExports(
    orgId: string,
    reportId: string,
    userId: string,
    formats: ReportExportFormat[],
    options: {
      reportType: string;
      periodStart: Date;
      periodEnd: Date;
      framework?: string | null;
      payload?: Record<string, unknown> | null;
    },
  ) {
    const dataset = await this.buildReportDataset(orgId, options);
    const results: Array<{ format: ReportExportFormat; fileKey: string; filename: string }> = [];

    for (const format of formats) {
      const generated = await this.reportExportService.generate(dataset, format);
      const fileKey = await this.reportStorageService.save(orgId, generated.filename, generated.buffer);
      results.push({ format, fileKey, filename: generated.filename });
    }

    if (results[0]) {
      await this.reportsRepository.updateReportFileKey(reportId, results[0].fileKey);
    }

    await this.notifyReportReady(orgId, userId, reportId, results[0]?.filename ?? 'report');
    return results;
  }

  private async notifyReportReady(
    orgId: string,
    userId: string,
    reportId: string,
    filename: string,
  ) {
    await this.notificationsRepository.create({
      organizationId: orgId,
      userId,
      type: 'report_ready',
      title: 'ESG report ready',
      body: `Your report "${filename}" is ready to download.`,
      entityType: 'report',
      entityId: reportId,
    });
  }

  private async buildReportDataset(
    orgId: string,
    options: {
      reportType: string;
      periodStart: Date;
      periodEnd: Date;
      module?: string;
      departmentId?: string;
      framework?: string | null;
      payload?: Record<string, unknown> | null;
    },
  ): Promise<EsgReportDataset> {
    const org = await this.tenantRepository.findOrganizationById(orgId);
    const metrics = await this.getDashboardMetrics(orgId);
    const varianceRows = await this.domainRepository.listVarianceSnapshots(orgId);
    const carbonTrendRows = await this.reportsRepository.getCarbonTrend(orgId);
    const departments = await this.tenantRepository.listDepartments(orgId);
    const latestScore = await this.reportsRepository.getLatestScoreSnapshot(orgId);
    const frameworkSubmissions = await this.domainRepository.listFrameworkSubmissions(orgId);
    const resolvedIssues = await this.reportsRepository.countResolvedIssues(orgId);

    let departmentName: string | undefined;
    if (options.departmentId) {
      const dept = departments.find((d) => d.id === options.departmentId);
      departmentName = dept?.name;
    }

    const payloadEnv = options.payload?.environmental as
      | { totalCarbonKg?: number; scopeTotals?: Array<{ scope: string; totalKg: number }> }
      | undefined;

    return {
      meta: {
        organizationId: orgId,
        organizationName: org?.name ?? 'Organization',
        reportType: options.reportType,
        periodStart: options.periodStart.toISOString(),
        periodEnd: options.periodEnd.toISOString(),
        generatedAt: new Date().toISOString(),
        module: options.module,
        departmentName,
        framework: options.framework ?? null,
      },
      scores: latestScore
        ? {
            environmental: Number(latestScore.environmentalScore),
            social: Number(latestScore.socialScore),
            governance: Number(latestScore.governanceScore),
            composite: Number(latestScore.compositeScore),
          }
        : null,
      environmental: {
        totalCarbonKg: payloadEnv?.totalCarbonKg ?? metrics.totalCarbonKg,
        scope1Kg: metrics.scopeBreakdown.scope1Kg,
        scope2Kg: metrics.scopeBreakdown.scope2Kg,
        scope3Kg: metrics.scopeBreakdown.scope3Kg,
        carbonTrend: carbonTrendRows.map((row) => ({
          month: row.month,
          totalCo2e: Number(row.totalCo2e),
        })),
      },
      social: {
        csrHours: metrics.csrHours,
        employeeParticipationRate: metrics.employeeParticipationRate,
        pendingApprovals: metrics.pendingApprovals,
      },
      governance: {
        openComplianceIssues: metrics.openComplianceIssues,
        resolvedIssues: Number(resolvedIssues[0]?.value ?? 0),
        frameworkSubmissions: frameworkSubmissions.filter((s) => s.status === 'approved').length,
      },
      variance: varianceRows.map((row) => ({
        metricKey: row.metricKey,
        metricLabel: row.metricLabel,
        currentValue: Number(row.currentValue),
        previousValue: Number(row.previousValue),
        variancePercent: Number(row.variancePercent),
      })),
      departments: departments.map((d) => ({ name: d.name, code: d.code })),
    };
  }

  private async processReportPipeline(
    jobId: string,
    orgId: string,
    userId: string,
    periodStart: Date,
    periodEnd: Date,
    reportType: string,
    framework?: string,
    formats: ReportExportFormat[] = ['pdf', 'xlsx'],
  ) {
    try {
      await this.domainRepository.updateReportPipelineJob(jobId, {
        status: 'extracting',
        currentStep: 'extract',
        startedAt: new Date(),
      });

      const carbonTotal = await this.reportsRepository.getApprovedCarbonLedgerTotal(orgId);
      const csrHours = await this.reportsRepository.getApprovedCsrHours(orgId);
      const scopeTotals = await this.domainRepository.getScopeTotals(orgId);
      const frameworkSubmissions = await this.domainRepository.listFrameworkSubmissions(orgId);

      await this.domainRepository.updateReportPipelineJob(jobId, {
        status: 'transforming',
        currentStep: 'transform',
      });

      const payload = {
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        framework: framework ?? null,
        environmental: {
          totalCarbonKg: Number(carbonTotal[0]?.total ?? 0),
          scopeTotals: scopeTotals.map((row) => ({
            scope: row.scope,
            totalKg: Number(row.total),
          })),
        },
        social: { csrHours: Number(csrHours[0]?.total ?? 0) },
        governance: {
          frameworkSubmissions: frameworkSubmissions.filter((s) => s.status === 'approved').length,
        },
      };

      await this.domainRepository.updateReportPipelineJob(jobId, {
        status: 'validating',
        currentStep: 'validate',
        payloadSnapshot: payload,
      });

      if (payload.environmental.totalCarbonKg < 0 || payload.social.csrHours < 0) {
        throw new Error('Report validation failed: negative metric values detected.');
      }

      await this.domainRepository.updateReportPipelineJob(jobId, {
        status: 'transforming',
        currentStep: 'export',
      });

      const [report] = await this.reportsRepository.insertReport({
        organizationId: orgId,
        reportType,
        periodStart,
        periodEnd,
        generatedById: userId,
      });

      if (report) {
        await this.persistReportExports(orgId, report.id, userId, formats, {
          reportType,
          periodStart,
          periodEnd,
          framework,
          payload,
        });
      }

      const [completed] = await this.domainRepository.updateReportPipelineJob(jobId, {
        status: 'completed',
        currentStep: 'complete',
        completedAt: new Date(),
        payloadSnapshot: payload,
      });

      return completed;
    } catch (error) {
      await this.domainRepository.updateReportPipelineJob(jobId, {
        status: 'failed',
        currentStep: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown pipeline error',
        completedAt: new Date(),
      });
      throw error;
    }
  }

  private async calculateVarianceSnapshots(
    orgId: string,
    periodStart: Date,
    periodEnd: Date,
    current: { carbon: number; csrHours: number; composite: number },
  ) {
    const previousSnapshots = await this.domainRepository.listVarianceSnapshots(orgId);
    const metrics = [
      { key: 'carbon_kg', label: 'Carbon Footprint (kg)', value: current.carbon },
      { key: 'csr_hours', label: 'CSR Hours', value: current.csrHours },
      { key: 'composite_score', label: 'Composite ESG Score', value: current.composite },
    ];

    for (const metric of metrics) {
      const previous = previousSnapshots.find((row) => row.metricKey === metric.key);
      const previousValue = previous ? Number(previous.currentValue) : 0;
      const variancePercent =
        previousValue === 0
          ? metric.value === 0
            ? 0
            : 100
          : ((metric.value - previousValue) / previousValue) * 100;

      await this.domainRepository.upsertVarianceSnapshot({
        organizationId: orgId,
        metricKey: metric.key,
        metricLabel: metric.label,
        currentValue: metric.value.toFixed(4),
        previousValue: previousValue.toFixed(4),
        variancePercent: variancePercent.toFixed(4),
        periodStart,
        periodEnd,
      });
    }
  }
}
