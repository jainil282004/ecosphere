import { z } from 'zod';
import { CARBON_SCOPES, COMPLIANCE_FRAMEWORKS, REPORT_EXPORT_FORMATS, REPORT_MODULES, REPORT_TYPES, RESOURCE_TYPES } from '../constants/domain.js';
import { APPROVAL_STATUSES, ROLES } from '../constants/roles.js';
import { flexibleDateTimeSchema, datetimeLocalInputSchema } from '../datetime.js';

export const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
});

export type RegisterUserInput = z.infer<typeof registerUserSchema>;

export const registerAccountSchema = registerUserSchema.extend({
  organizationSlug: z.string().min(2).max(100).default('greentech-industries'),
});

export type RegisterAccountInput = z.infer<typeof registerAccountSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required.'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters.'),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords don't match.",
    path: ['confirmNewPassword'],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const updateProfileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters.'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters.'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('Valid email is required'),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(32, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const awardXpSchema = z.object({
  userId: z.string().uuid(),
  xpAmount: z.number().int().min(1).max(500),
  pointsAmount: z.number().int().min(0).max(500).default(0),
  reason: z.string().min(3).max(500),
});

export type AwardXpInput = z.infer<typeof awardXpSchema>;

export const createAuditSchema = z.object({
  orgId: z.string().uuid(),
  action: z.string().min(1).max(150),
  entityType: z.string().min(1).max(100),
  entityId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateAuditInput = z.infer<typeof createAuditSchema>;

export const createOrganizationSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  industry: z.string().min(1).max(100),
  country: z.string().min(2).max(100),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

export const assignRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(ROLES),
  departmentId: z.string().uuid().nullable().optional(),
});

export type AssignRoleInput = z.infer<typeof assignRoleSchema>;

export const createEmployeeSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: z.enum(ROLES),
  departmentId: z.string().uuid().nullable().optional(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

export const createDepartmentSchema = z.object({
  name: z.string().min(1).max(150),
  code: z.string().min(1).max(50),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;

export const createEmissionFactorSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  scope: z.enum(CARBON_SCOPES),
  unit: z.string().min(1).max(50),
  factorValue: z.number().positive(),
  effectiveFrom: z.string().datetime(),
  effectiveTo: z.string().datetime().nullable().optional(),
  source: z.string().min(1).max(200),
});

export type CreateEmissionFactorInput = z.infer<typeof createEmissionFactorSchema>;

export const createCarbonTransactionSchema = z.object({
  departmentId: z.string().uuid(),
  activityType: z.string().min(1).max(100),
  quantity: z.number().positive(),
  unit: z.string().min(1).max(50),
  emissionFactorId: z.string().uuid(),
  activityDate: flexibleDateTimeSchema,
  description: z.string().max(2000).optional(),
  evidenceFileKey: z.string().max(500).optional(),
});

export type CreateCarbonTransactionInput = z.infer<typeof createCarbonTransactionSchema>;

export const createCsrActivitySchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  departmentId: z.string().uuid(),
  activityDate: flexibleDateTimeSchema,
  hoursContributed: z.number().positive().max(1000),
  beneficiariesCount: z.number().int().positive().optional(),
  evidenceFileKey: z.string().max(500).optional(),
});

export const createCsrActivityFormSchema = createCsrActivitySchema
  .omit({ activityDate: true })
  .extend({
    activityDate: datetimeLocalInputSchema,
  });

export type CreateCsrActivityInput = z.infer<typeof createCsrActivitySchema>;
export type CreateCsrActivityFormInput = z.infer<typeof createCsrActivityFormSchema>;

export const createChallengeSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  xpReward: z.number().int().positive(),
  pointsReward: z.number().int().positive(),
  departmentId: z.string().uuid().nullable().optional(),
});

export type CreateChallengeInput = z.infer<typeof createChallengeSchema>;

export const challengeParticipationSchema = z.object({
  challengeId: z.string().uuid(),
  evidenceDescription: z.string().min(10).max(5000),
  evidenceFileKey: z.string().max(500).optional(),
});

export type ChallengeParticipationInput = z.infer<typeof challengeParticipationSchema>;

export const approvalDecisionSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  comment: z.string().max(2000).optional(),
});

export type ApprovalDecisionInput = z.infer<typeof approvalDecisionSchema>;

export const createComplianceIssueSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  departmentId: z.string().uuid().nullable().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  dueDate: z.string().datetime().nullable().optional(),
});

export type CreateComplianceIssueInput = z.infer<typeof createComplianceIssueSchema>;

export const updateComplianceIssueStatusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed', 'escalated']),
  comment: z.string().max(2000).optional(),
});

export type UpdateComplianceIssueStatusInput = z.infer<typeof updateComplianceIssueStatusSchema>;

export const createPolicySchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(10),
  version: z.string().min(1).max(20),
  effectiveFrom: z.string().datetime(),
  requiresAcknowledgement: z.boolean().default(true),
});

export type CreatePolicyInput = z.infer<typeof createPolicySchema>;

export const policyAcknowledgementSchema = z.object({
  policyId: z.string().uuid(),
});

export type PolicyAcknowledgementInput = z.infer<typeof policyAcknowledgementSchema>;

export const createRewardSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  pointsCost: z.number().int().positive(),
  stockQuantity: z.number().int().nonnegative(),
});

export type CreateRewardInput = z.infer<typeof createRewardSchema>;

export const redeemRewardSchema = z.object({
  rewardId: z.string().uuid(),
});

export type RedeemRewardInput = z.infer<typeof redeemRewardSchema>;

export const createEsgWeightageSchema = z.object({
  environmentalWeight: z.number().min(0).max(100),
  socialWeight: z.number().min(0).max(100),
  governanceWeight: z.number().min(0).max(100),
  effectiveFrom: z.string().datetime(),
}).refine(
  (data) =>
    Math.abs(
      data.environmentalWeight + data.socialWeight + data.governanceWeight - 100,
    ) < 0.001,
  { message: 'ESG weightages must sum to 100' },
);

export type CreateEsgWeightageInput = z.infer<typeof createEsgWeightageSchema>;

export const createGoalSchema = z.object({
  title: z.string().min(3).max(200),
  domain: z.enum(['environmental', 'social', 'governance']),
  targetValue: z.number().positive(),
  unit: z.string().min(1).max(50),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  departmentId: z.string().uuid().nullable().optional(),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const orgParamSchema = z.object({
  orgId: z.string().uuid(),
});

export const approvalStatusSchema = z.enum(APPROVAL_STATUSES);

export * from './carbon.js';

export const createResourceConsumptionSchema = z.object({
  departmentId: z.string().uuid(),
  resourceType: z.enum(RESOURCE_TYPES),
  quantity: z.number().positive(),
  unit: z.string().min(1).max(50),
  consumptionDate: flexibleDateTimeSchema,
  documentHash: z
    .string()
    .min(64)
    .max(128)
    .regex(/^[a-f0-9]+$/i, 'Document hash must be a hexadecimal SHA-256 digest'),
  documentFileKey: z.string().max(500).optional(),
  description: z.string().max(2000).optional(),
});

export type CreateResourceConsumptionInput = z.infer<typeof createResourceConsumptionSchema>;

export const createDeiSnapshotSchema = z.object({
  departmentId: z.string().uuid().nullable().optional(),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  femalePercentage: z.number().min(0).max(100),
  underrepresentedPercentage: z.number().min(0).max(100),
  leadershipDiversityPercentage: z.number().min(0).max(100),
  totalHeadcount: z.number().int().positive(),
  notes: z.string().max(2000).optional(),
});

export type CreateDeiSnapshotInput = z.infer<typeof createDeiSnapshotSchema>;

export const createFrameworkMappingSchema = z.object({
  framework: z.enum(COMPLIANCE_FRAMEWORKS),
  metricCode: z.string().min(1).max(100),
  metricTitle: z.string().min(1).max(300),
  domain: z.enum(['environmental', 'social', 'governance']),
  description: z.string().min(1).max(5000),
  unit: z.string().min(1).max(50),
  isMandatory: z.boolean().default(true),
});

export type CreateFrameworkMappingInput = z.infer<typeof createFrameworkMappingSchema>;

export const createFrameworkMetricSubmissionSchema = z.object({
  frameworkMappingId: z.string().uuid(),
  reportingPeriodStart: z.string().datetime(),
  reportingPeriodEnd: z.string().datetime(),
  reportedValue: z.number(),
  evidenceDocumentHash: z
    .string()
    .min(64)
    .max(128)
    .regex(/^[a-f0-9]+$/i)
    .or(z.literal(''))
    .optional()
    .transform(v => v === '' ? undefined : v),
});

export type CreateFrameworkMetricSubmissionInput = z.infer<
  typeof createFrameworkMetricSubmissionSchema
>;

export const triggerReportPipelineSchema = z.object({
  reportType: z.string().min(1).max(100),
  framework: z.enum(COMPLIANCE_FRAMEWORKS).optional(),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  formats: z.array(z.enum(REPORT_EXPORT_FORMATS)).min(1).optional(),
});

export type TriggerReportPipelineInput = z.infer<typeof triggerReportPipelineSchema>;

export const exportReportSchema = z.object({
  format: z.enum(REPORT_EXPORT_FORMATS),
  reportType: z.enum(REPORT_TYPES).default('esg_summary'),
  periodStart: z.string().datetime().optional(),
  periodEnd: z.string().datetime().optional(),
  departmentId: z.string().uuid().optional(),
  module: z.enum(REPORT_MODULES).optional(),
});

export type ExportReportInput = z.infer<typeof exportReportSchema>;
