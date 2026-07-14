export const CARBON_SCOPES = ['scope_1', 'scope_2', 'scope_3'] as const;
export type CarbonScope = (typeof CARBON_SCOPES)[number];

export const RESOURCE_TYPES = ['energy', 'water'] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

export const COMPLIANCE_FRAMEWORKS = ['brsr', 'gri', 'csrd'] as const;
export type ComplianceFramework = (typeof COMPLIANCE_FRAMEWORKS)[number];

export const REPORT_PIPELINE_STATUSES = [
  'queued',
  'extracting',
  'transforming',
  'validating',
  'completed',
  'failed',
] as const;
export type ReportPipelineStatus = (typeof REPORT_PIPELINE_STATUSES)[number];

export const REPORT_EXPORT_FORMATS = ['csv', 'xlsx', 'pdf'] as const;
export type ReportExportFormat = (typeof REPORT_EXPORT_FORMATS)[number];

export const REPORT_TYPES = [
  'environmental',
  'social',
  'governance',
  'esg_summary',
  'custom',
] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export const REPORT_MODULES = ['environmental', 'social', 'governance', 'summary'] as const;
export type ReportModule = (typeof REPORT_MODULES)[number];

export const APPROVAL_STAGE_ROLES = {
  csr_activity: ['dept_head', 'esg_manager'],
  carbon_transaction: ['dept_head', 'esg_manager'],
  challenge_participation: ['dept_head', 'esg_manager'],
  reward_redemption: ['esg_manager'],
  resource_consumption: ['dept_head', 'esg_manager'],
  framework_metric: ['dept_head', 'esg_manager', 'org_admin'],
  dei_snapshot: ['dept_head', 'esg_manager', 'org_admin'],
} as const;
