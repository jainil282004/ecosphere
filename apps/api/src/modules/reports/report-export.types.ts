import type { ReportExportFormat } from '@ecosphere/shared';

export interface EsgReportDataset {
  meta: {
    organizationId: string;
    organizationName: string;
    reportType: string;
    periodStart: string;
    periodEnd: string;
    generatedAt: string;
    module?: string;
    departmentName?: string;
    framework?: string | null;
  };
  scores: {
    environmental: number;
    social: number;
    governance: number;
    composite: number;
  } | null;
  environmental: {
    totalCarbonKg: number;
    scope1Kg: number;
    scope2Kg: number;
    scope3Kg: number;
    carbonTrend: Array<{ month: string; totalCo2e: number }>;
  };
  social: {
    csrHours: number;
    employeeParticipationRate: number;
    pendingApprovals: number;
  };
  governance: {
    openComplianceIssues: number;
    resolvedIssues: number;
    frameworkSubmissions: number;
  };
  variance: Array<{
    metricKey: string;
    metricLabel: string;
    currentValue: number;
    previousValue: number;
    variancePercent: number;
  }>;
  departments: Array<{ name: string; code: string }>;
}

export interface GeneratedExportFile {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

export const EXPORT_MIME: Record<ReportExportFormat, string> = {
  csv: 'text/csv; charset=utf-8',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf: 'application/pdf',
};

export const EXPORT_EXT: Record<ReportExportFormat, string> = {
  csv: 'csv',
  xlsx: 'xlsx',
  pdf: 'pdf',
};
