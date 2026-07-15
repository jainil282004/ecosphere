import { relations } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const roleEnum = pgEnum('role', [
  'super_admin',
  'org_admin',
  'esg_manager',
  'dept_head',
  'auditor',
  'employee',
]);

export const approvalStatusEnum = pgEnum('approval_status', [
  'draft',
  'submitted',
  'approved',
  'rejected',
  'cancelled',
]);

export const approvalEntityTypeEnum = pgEnum('approval_entity_type', [
  'csr_activity',
  'carbon_transaction',
  'challenge_participation',
  'reward_redemption',
  'resource_consumption',
  'framework_metric',
  'dei_snapshot',
]);

export const carbonScopeEnum = pgEnum('carbon_scope', ['scope_1', 'scope_2', 'scope_3']);

export const resourceTypeEnum = pgEnum('resource_type', ['energy', 'water']);

export const complianceFrameworkEnum = pgEnum('compliance_framework', ['brsr', 'gri', 'csrd']);

export const approvalStageStatusEnum = pgEnum('approval_stage_status', [
  'pending',
  'approved',
  'rejected',
  'skipped',
]);

export const reportPipelineStatusEnum = pgEnum('report_pipeline_status', [
  'queued',
  'extracting',
  'transforming',
  'validating',
  'completed',
  'failed',
]);

export const ledgerEntryTypeEnum = pgEnum('ledger_entry_type', ['credit', 'debit']);

export const complianceIssueStatusEnum = pgEnum('compliance_issue_status', [
  'open',
  'in_progress',
  'resolved',
  'closed',
  'escalated',
]);

export const challengeStatusEnum = pgEnum('challenge_status', [
  'draft',
  'active',
  'completed',
  'cancelled',
]);

export const esgDomainEnum = pgEnum('esg_domain', ['environmental', 'social', 'governance']);

export const notificationTypeEnum = pgEnum('notification_type', [
  'approval_required',
  'approval_decision',
  'badge_earned',
  'reward_redeemed',
  'compliance_overdue',
  'report_ready',
  'policy_published',
]);

export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  industry: varchar('industry', { length: 100 }).notNull(),
  country: varchar('country', { length: 100 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('refresh_tokens_user_id_idx').on(table.userId),
    uniqueIndex('refresh_tokens_token_hash_idx').on(table.tokenHash),
  ],
);

export const passwordResetTokens = pgTable(
  'password_reset_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('password_reset_tokens_user_id_idx').on(table.userId),
    uniqueIndex('password_reset_tokens_hash_idx').on(table.tokenHash),
  ],
);

export const departments = pgTable(
  'departments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 150 }).notNull(),
    code: varchar('code', { length: 50 }).notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('departments_org_code_idx').on(table.organizationId, table.code),
    index('departments_org_id_idx').on(table.organizationId),
  ],
);

export const userRoles = pgTable(
  'user_roles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: roleEnum('role').notNull(),
    organizationId: uuid('organization_id').references(() => organizations.id, {
      onDelete: 'cascade',
    }),
    departmentId: uuid('department_id').references(() => departments.id, {
      onDelete: 'cascade',
    }),
    validFrom: timestamp('valid_from', { withTimezone: true }).notNull().defaultNow(),
    validTo: timestamp('valid_to', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('user_roles_unique_assignment_idx').on(
      table.userId,
      table.role,
      table.organizationId,
      table.departmentId,
    ),
    index('user_roles_user_id_idx').on(table.userId),
    index('user_roles_org_id_idx').on(table.organizationId),
  ],
);

export const esgWeightages = pgTable(
  'esg_weightages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    environmentalWeight: numeric('environmental_weight', { precision: 5, scale: 2 }).notNull(),
    socialWeight: numeric('social_weight', { precision: 5, scale: 2 }).notNull(),
    governanceWeight: numeric('governance_weight', { precision: 5, scale: 2 }).notNull(),
    effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull(),
    effectiveTo: timestamp('effective_to', { withTimezone: true }),
    createdById: uuid('created_by_id')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('esg_weightages_org_effective_idx').on(table.organizationId, table.effectiveFrom),
    check(
      'esg_weightages_sum_100',
      sql`${table.environmentalWeight} + ${table.socialWeight} + ${table.governanceWeight} = 100`,
    ),
  ],
);

export const emissionFactors = pgTable(
  'emission_factors',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 200 }).notNull(),
    category: varchar('category', { length: 100 }).notNull(),
    scope: carbonScopeEnum('scope').notNull().default('scope_2'),
    unit: varchar('unit', { length: 50 }).notNull(),
    factorValue: numeric('factor_value', { precision: 18, scale: 8 }).notNull(),
    effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull(),
    effectiveTo: timestamp('effective_to', { withTimezone: true }),
    source: varchar('source', { length: 200 }).notNull(),
    createdById: uuid('created_by_id')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('emission_factors_org_category_idx').on(table.organizationId, table.category),
    check('emission_factors_positive', sql`${table.factorValue} > 0`),
  ],
);

export const carbonTransactions = pgTable(
  'carbon_transactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    departmentId: uuid('department_id')
      .notNull()
      .references(() => departments.id),
    submittedById: uuid('submitted_by_id')
      .notNull()
      .references(() => users.id),
    scope: carbonScopeEnum('scope').notNull(),
    activityType: varchar('activity_type', { length: 100 }).notNull(),
    quantity: numeric('quantity', { precision: 18, scale: 4 }).notNull(),
    unit: varchar('unit', { length: 50 }).notNull(),
    emissionFactorId: uuid('emission_factor_id')
      .notNull()
      .references(() => emissionFactors.id),
    snapshotFactorValue: numeric('snapshot_factor_value', { precision: 18, scale: 8 }).notNull(),
    snapshotFactorUnit: varchar('snapshot_factor_unit', { length: 50 }).notNull(),
    co2eKg: numeric('co2e_kg', { precision: 18, scale: 4 }).notNull(),
    activityDate: timestamp('activity_date', { withTimezone: true }).notNull(),
    description: text('description'),
    evidenceFileKey: varchar('evidence_file_key', { length: 500 }),
    status: approvalStatusEnum('status').notNull().default('draft'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('carbon_transactions_org_status_idx').on(table.organizationId, table.status),
    index('carbon_transactions_dept_idx').on(table.departmentId),
    check('carbon_transactions_quantity_positive', sql`${table.quantity} > 0`),
    check('carbon_transactions_co2e_positive', sql`${table.co2eKg} >= 0`),
  ],
);

export const carbonLedger = pgTable(
  'carbon_ledger',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    departmentId: uuid('department_id').references(() => departments.id),
    userId: uuid('user_id').references(() => users.id),
    entryType: ledgerEntryTypeEnum('entry_type').notNull(),
    co2eKg: numeric('co2e_kg', { precision: 18, scale: 4 }).notNull(),
    sourceType: varchar('source_type', { length: 100 }).notNull(),
    sourceId: uuid('source_id').notNull(),
    description: text('description'),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('carbon_ledger_org_recorded_idx').on(table.organizationId, table.recordedAt),
    uniqueIndex('carbon_ledger_idempotent_idx').on(table.sourceType, table.sourceId, table.entryType),
    check('carbon_ledger_co2e_positive', sql`${table.co2eKg} > 0`),
  ],
);

export const csrActivities = pgTable(
  'csr_activities',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    departmentId: uuid('department_id')
      .notNull()
      .references(() => departments.id),
    submittedById: uuid('submitted_by_id')
      .notNull()
      .references(() => users.id),
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description').notNull(),
    activityDate: timestamp('activity_date', { withTimezone: true }).notNull(),
    hoursContributed: numeric('hours_contributed', { precision: 8, scale: 2 }).notNull(),
    beneficiariesCount: integer('beneficiaries_count'),
    evidenceFileKey: varchar('evidence_file_key', { length: 500 }),
    status: approvalStatusEnum('status').notNull().default('draft'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('csr_activities_org_status_idx').on(table.organizationId, table.status),
    index('csr_activities_submitter_idx').on(table.submittedById),
    check('csr_activities_hours_positive', sql`${table.hoursContributed} > 0`),
  ],
);

export const challenges = pgTable(
  'challenges',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    departmentId: uuid('department_id').references(() => departments.id),
    createdById: uuid('created_by_id')
      .notNull()
      .references(() => users.id),
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description').notNull(),
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    endDate: timestamp('end_date', { withTimezone: true }).notNull(),
    xpReward: integer('xp_reward').notNull(),
    pointsReward: integer('points_reward').notNull(),
    status: challengeStatusEnum('status').notNull().default('draft'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('challenges_org_status_idx').on(table.organizationId, table.status),
    check('challenges_rewards_positive', sql`${table.xpReward} > 0 AND ${table.pointsReward} > 0`),
  ],
);

export const challengeParticipations = pgTable(
  'challenge_participations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    challengeId: uuid('challenge_id')
      .notNull()
      .references(() => challenges.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    evidenceDescription: text('evidence_description').notNull(),
    evidenceFileKey: varchar('evidence_file_key', { length: 500 }),
    snapshotXpReward: integer('snapshot_xp_reward').notNull(),
    snapshotPointsReward: integer('snapshot_points_reward').notNull(),
    status: approvalStatusEnum('status').notNull().default('draft'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('challenge_participations_unique_idx').on(table.challengeId, table.userId),
    index('challenge_participations_org_status_idx').on(table.organizationId, table.status),
  ],
);

export const approvals = pgTable(
  'approvals',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    entityType: approvalEntityTypeEnum('entity_type').notNull(),
    entityId: uuid('entity_id').notNull(),
    status: approvalStatusEnum('status').notNull().default('submitted'),
    submittedById: uuid('submitted_by_id')
      .notNull()
      .references(() => users.id),
    submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
    decidedById: uuid('decided_by_id').references(() => users.id),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
    approverRole: roleEnum('approver_role'),
    decisionComment: text('decision_comment'),
    sideEffectsAppliedAt: timestamp('side_effects_applied_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('approvals_entity_unique_idx').on(table.entityType, table.entityId),
    index('approvals_org_status_idx').on(table.organizationId, table.status),
  ],
);

export const xpLedger = pgTable(
  'xp_ledger',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    entryType: ledgerEntryTypeEnum('entry_type').notNull(),
    amount: integer('amount').notNull(),
    sourceType: varchar('source_type', { length: 100 }).notNull(),
    sourceId: uuid('source_id').notNull(),
    description: text('description'),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('xp_ledger_user_org_idx').on(table.organizationId, table.userId),
    uniqueIndex('xp_ledger_idempotent_idx').on(table.sourceType, table.sourceId, table.userId, table.entryType),
    check('xp_ledger_amount_positive', sql`${table.amount} > 0`),
  ],
);

export const pointsLedger = pgTable(
  'points_ledger',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    entryType: ledgerEntryTypeEnum('entry_type').notNull(),
    amount: integer('amount').notNull(),
    sourceType: varchar('source_type', { length: 100 }).notNull(),
    sourceId: uuid('source_id').notNull(),
    description: text('description'),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('points_ledger_user_org_idx').on(table.organizationId, table.userId),
    uniqueIndex('points_ledger_idempotent_idx').on(table.sourceType, table.sourceId, table.userId, table.entryType),
    check('points_ledger_amount_positive', sql`${table.amount} > 0`),
  ],
);

export const badges = pgTable(
  'badges',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 150 }).notNull(),
    description: text('description').notNull(),
    iconKey: varchar('icon_key', { length: 100 }).notNull(),
    criteriaJson: jsonb('criteria_json').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('badges_org_name_idx').on(table.organizationId, table.name)],
);

export const userBadges = pgTable(
  'user_badges',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    badgeId: uuid('badge_id')
      .notNull()
      .references(() => badges.id, { onDelete: 'cascade' }),
    earnedAt: timestamp('earned_at', { withTimezone: true }).notNull().defaultNow(),
    triggeringSourceType: varchar('triggering_source_type', { length: 100 }).notNull(),
    triggeringSourceId: uuid('triggering_source_id').notNull(),
  },
  (table) => [
    uniqueIndex('user_badges_unique_idx').on(table.userId, table.badgeId),
    uniqueIndex('user_badges_idempotent_idx').on(
      table.userId,
      table.badgeId,
      table.triggeringSourceType,
      table.triggeringSourceId,
    ),
  ],
);

export const rewards = pgTable(
  'rewards',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 200 }).notNull(),
    description: text('description').notNull(),
    pointsCost: integer('points_cost').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('rewards_org_name_idx').on(table.organizationId, table.name),
    check('rewards_points_cost_positive', sql`${table.pointsCost} > 0`),
  ],
);

export const rewardInventory = pgTable(
  'reward_inventory',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    rewardId: uuid('reward_id')
      .notNull()
      .references(() => rewards.id, { onDelete: 'cascade' }),
    stockRemaining: integer('stock_remaining').notNull(),
    version: integer('version').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('reward_inventory_reward_idx').on(table.rewardId),
    check('reward_inventory_stock_nonnegative', sql`${table.stockRemaining} >= 0`),
  ],
);

export const rewardRedemptions = pgTable(
  'reward_redemptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    rewardId: uuid('reward_id')
      .notNull()
      .references(() => rewards.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    snapshotPointsCost: integer('snapshot_points_cost').notNull(),
    status: approvalStatusEnum('status').notNull().default('submitted'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('reward_redemptions_user_idx').on(table.userId, table.status)],
);

export const complianceIssues = pgTable(
  'compliance_issues',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    departmentId: uuid('department_id').references(() => departments.id),
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description').notNull(),
    severity: varchar('severity', { length: 20 }).notNull(),
    status: complianceIssueStatusEnum('status').notNull().default('open'),
    dueDate: timestamp('due_date', { withTimezone: true }),
    createdById: uuid('created_by_id')
      .notNull()
      .references(() => users.id),
    assignedToId: uuid('assigned_to_id').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('compliance_issues_org_status_idx').on(table.organizationId, table.status)],
);

export const complianceIssueStatusHistory = pgTable(
  'compliance_issue_status_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    issueId: uuid('issue_id')
      .notNull()
      .references(() => complianceIssues.id, { onDelete: 'cascade' }),
    fromStatus: complianceIssueStatusEnum('from_status'),
    toStatus: complianceIssueStatusEnum('to_status').notNull(),
    changedById: uuid('changed_by_id')
      .notNull()
      .references(() => users.id),
    comment: text('comment'),
    changedAt: timestamp('changed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('compliance_issue_status_history_issue_idx').on(table.issueId)],
);

export const policies = pgTable(
  'policies',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 200 }).notNull(),
    content: text('content').notNull(),
    version: varchar('version', { length: 20 }).notNull(),
    effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull(),
    requiresAcknowledgement: boolean('requires_acknowledgement').notNull().default(true),
    createdById: uuid('created_by_id')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('policies_org_title_version_idx').on(table.organizationId, table.title, table.version)],
);

export const policyAcknowledgements = pgTable(
  'policy_acknowledgements',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    policyId: uuid('policy_id')
      .notNull()
      .references(() => policies.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }).notNull().defaultNow(),
    snapshotPolicyVersion: varchar('snapshot_policy_version', { length: 20 }).notNull(),
  },
  (table) => [uniqueIndex('policy_ack_unique_idx').on(table.policyId, table.userId)],
);

export const goals = pgTable(
  'goals',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    departmentId: uuid('department_id').references(() => departments.id),
    title: varchar('title', { length: 200 }).notNull(),
    domain: esgDomainEnum('domain').notNull(),
    targetValue: numeric('target_value', { precision: 18, scale: 4 }).notNull(),
    currentValue: numeric('current_value', { precision: 18, scale: 4 }).notNull().default('0'),
    unit: varchar('unit', { length: 50 }).notNull(),
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    endDate: timestamp('end_date', { withTimezone: true }).notNull(),
    createdById: uuid('created_by_id')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('goals_org_domain_idx').on(table.organizationId, table.domain),
    check('goals_target_positive', sql`${table.targetValue} > 0`),
  ],
);

export const esgScoreSnapshots = pgTable(
  'esg_score_snapshots',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
    periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
    environmentalScore: numeric('environmental_score', { precision: 8, scale: 4 }).notNull(),
    socialScore: numeric('social_score', { precision: 8, scale: 4 }).notNull(),
    governanceScore: numeric('governance_score', { precision: 8, scale: 4 }).notNull(),
    compositeScore: numeric('composite_score', { precision: 8, scale: 4 }).notNull(),
    weightageSnapshot: jsonb('weightage_snapshot').notNull(),
    calculatedAt: timestamp('calculated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('esg_score_snapshots_period_idx').on(
      table.organizationId,
      table.periodStart,
      table.periodEnd,
    ),
  ],
);

export const reports = pgTable(
  'reports',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    reportType: varchar('report_type', { length: 100 }).notNull(),
    periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
    periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
    scoreSnapshotId: uuid('score_snapshot_id').references(() => esgScoreSnapshots.id),
    fileKey: varchar('file_key', { length: 500 }),
    generatedById: uuid('generated_by_id').references(() => users.id),
    generatedAt: timestamp('generated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('reports_org_generated_idx').on(table.organizationId, table.generatedAt)],
);

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: notificationTypeEnum('type').notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    body: text('body').notNull(),
    entityType: varchar('entity_type', { length: 100 }),
    entityId: uuid('entity_id'),
    isRead: boolean('is_read').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('notifications_user_read_idx').on(table.userId, table.isRead),
    uniqueIndex('notifications_idempotent_idx').on(table.type, table.entityId, table.userId),
  ],
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id').references(() => organizations.id, {
      onDelete: 'set null',
    }),
    actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
    action: varchar('action', { length: 255 }).notNull(),

  module: varchar('module', { length: 100 }),
  browser: varchar('browser', { length: 100 }),
  os: varchar('os', { length: 100 }),
  device: varchar('device', { length: 100 }),
  location: varchar('location', { length: 255 }),
  sessionId: varchar('session_id', { length: 100 }),
  requestId: varchar('request_id', { length: 100 }),
  oldValue: jsonb('old_value'),
  newValue: jsonb('new_value'),
  success: boolean('success').notNull().default(true),
  severity: varchar('severity', { length: 20 }).notNull().default('info'),
  executionTime: integer('execution_time'),

    entityType: varchar('entity_type', { length: 100 }).notNull(),
    entityId: uuid('entity_id'),
    metadata: jsonb('metadata'),
    ipAddress: varchar('ip_address', { length: 45 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('audit_logs_org_created_idx').on(table.organizationId, table.createdAt)],
);

export const resourceConsumptionLedger = pgTable(
  'resource_consumption_ledger',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    departmentId: uuid('department_id')
      .notNull()
      .references(() => departments.id),
    submittedById: uuid('submitted_by_id')
      .notNull()
      .references(() => users.id),
    resourceType: resourceTypeEnum('resource_type').notNull(),
    quantity: numeric('quantity', { precision: 18, scale: 4 }).notNull(),
    unit: varchar('unit', { length: 50 }).notNull(),
    consumptionDate: timestamp('consumption_date', { withTimezone: true }).notNull(),
    documentHash: varchar('document_hash', { length: 128 }).notNull(),
    documentFileKey: varchar('document_file_key', { length: 500 }),
    description: text('description'),
    status: approvalStatusEnum('status').notNull().default('submitted'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('resource_consumption_org_type_idx').on(table.organizationId, table.resourceType),
    uniqueIndex('resource_consumption_document_hash_idx').on(
      table.organizationId,
      table.documentHash,
    ),
    check('resource_consumption_quantity_positive', sql`${table.quantity} > 0`),
  ],
);

export const deiSnapshots = pgTable(
  'dei_snapshots',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    departmentId: uuid('department_id').references(() => departments.id),
    recordedById: uuid('recorded_by_id')
      .notNull()
      .references(() => users.id),
    periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
    periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
    femalePercentage: numeric('female_percentage', { precision: 5, scale: 2 }).notNull(),
    underrepresentedPercentage: numeric('underrepresented_percentage', {
      precision: 5,
      scale: 2,
    }).notNull(),
    leadershipDiversityPercentage: numeric('leadership_diversity_percentage', {
      precision: 5,
      scale: 2,
    }).notNull(),
    totalHeadcount: integer('total_headcount').notNull(),
    notes: text('notes'),
    status: approvalStatusEnum('status').notNull().default('submitted'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('dei_snapshots_org_period_idx').on(table.organizationId, table.periodStart),
    check(
      'dei_female_pct_range',
      sql`${table.femalePercentage} >= 0 AND ${table.femalePercentage} <= 100`,
    ),
  ],
);

export const participationStreaks = pgTable(
  'participation_streaks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    currentStreakWeeks: integer('current_streak_weeks').notNull().default(0),
    longestStreakWeeks: integer('longest_streak_weeks').notNull().default(0),
    lastActivityWeek: varchar('last_activity_week', { length: 10 }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('participation_streaks_user_org_idx').on(table.organizationId, table.userId),
  ],
);

export const frameworkMappings = pgTable(
  'framework_mappings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    framework: complianceFrameworkEnum('framework').notNull(),
    metricCode: varchar('metric_code', { length: 100 }).notNull(),
    metricTitle: varchar('metric_title', { length: 300 }).notNull(),
    domain: varchar('domain', { length: 50 }).notNull(),
    description: text('description').notNull(),
    unit: varchar('unit', { length: 50 }).notNull(),
    isMandatory: boolean('is_mandatory').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('framework_mappings_unique_idx').on(
      table.organizationId,
      table.framework,
      table.metricCode,
    ),
  ],
);

export const frameworkMetricSubmissions = pgTable(
  'framework_metric_submissions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    frameworkMappingId: uuid('framework_mapping_id')
      .notNull()
      .references(() => frameworkMappings.id, { onDelete: 'cascade' }),
    submittedById: uuid('submitted_by_id')
      .notNull()
      .references(() => users.id),
    reportingPeriodStart: timestamp('reporting_period_start', { withTimezone: true }).notNull(),
    reportingPeriodEnd: timestamp('reporting_period_end', { withTimezone: true }).notNull(),
    reportedValue: numeric('reported_value', { precision: 18, scale: 4 }).notNull(),
    snapshotMetricTitle: varchar('snapshot_metric_title', { length: 300 }).notNull(),
    snapshotFramework: complianceFrameworkEnum('snapshot_framework').notNull(),
    evidenceDocumentHash: varchar('evidence_document_hash', { length: 128 }),
    status: approvalStatusEnum('status').notNull().default('submitted'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('framework_submissions_org_status_idx').on(table.organizationId, table.status),
    uniqueIndex('framework_submissions_period_idx').on(
      table.frameworkMappingId,
      table.reportingPeriodStart,
      table.reportingPeriodEnd,
    ),
  ],
);

export const approvalStages = pgTable(
  'approval_stages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    approvalId: uuid('approval_id').notNull(),
    stageOrder: integer('stage_order').notNull(),
    requiredRole: roleEnum('required_role').notNull(),
    status: approvalStageStatusEnum('status').notNull().default('pending'),
    decidedById: uuid('decided_by_id').references(() => users.id),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
    decisionComment: text('decision_comment'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('approval_stages_unique_idx').on(table.approvalId, table.stageOrder),
    index('approval_stages_approval_idx').on(table.approvalId),
  ],
);

export const reportPipelineJobs = pgTable(
  'report_pipeline_jobs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    reportType: varchar('report_type', { length: 100 }).notNull(),
    framework: complianceFrameworkEnum('framework'),
    periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
    periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
    status: reportPipelineStatusEnum('status').notNull().default('queued'),
    currentStep: varchar('current_step', { length: 100 }).notNull().default('queued'),
    payloadSnapshot: jsonb('payload_snapshot'),
    errorMessage: text('error_message'),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdById: uuid('created_by_id').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('report_pipeline_jobs_org_status_idx').on(table.organizationId, table.status),
    uniqueIndex('report_pipeline_jobs_idempotent_idx').on(
      table.organizationId,
      table.reportType,
      table.periodStart,
      table.periodEnd,
    ),
  ],
);

export const reportVarianceSnapshots = pgTable(
  'report_variance_snapshots',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    metricKey: varchar('metric_key', { length: 100 }).notNull(),
    metricLabel: varchar('metric_label', { length: 200 }).notNull(),
    currentValue: numeric('current_value', { precision: 18, scale: 4 }).notNull(),
    previousValue: numeric('previous_value', { precision: 18, scale: 4 }).notNull(),
    variancePercent: numeric('variance_percent', { precision: 10, scale: 4 }).notNull(),
    periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
    periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
    calculatedAt: timestamp('calculated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('report_variance_snapshots_unique_idx').on(
      table.organizationId,
      table.metricKey,
      table.periodStart,
      table.periodEnd,
    ),
  ],
);

export const carbonScopeBreakdown = pgTable(
  'carbon_scope_breakdown',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
    periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
    scope1Kg: numeric('scope_1_kg', { precision: 18, scale: 4 }).notNull().default('0'),
    scope2Kg: numeric('scope_2_kg', { precision: 18, scale: 4 }).notNull().default('0'),
    scope3Kg: numeric('scope_3_kg', { precision: 18, scale: 4 }).notNull().default('0'),
    calculatedAt: timestamp('calculated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('carbon_scope_breakdown_period_idx').on(
      table.organizationId,
      table.periodStart,
      table.periodEnd,
    ),
  ],
);

export const organizationsRelations = relations(organizations, ({ many }) => ({
  departments: many(departments),
  userRoles: many(userRoles),
}));

export const usersRelations = relations(users, ({ many }) => ({
  roles: many(userRoles),
  refreshTokens: many(refreshTokens),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, { fields: [userRoles.userId], references: [users.id] }),
  organization: one(organizations, {
    fields: [userRoles.organizationId],
    references: [organizations.id],
  }),
  department: one(departments, {
    fields: [userRoles.departmentId],
    references: [departments.id],
  }),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [departments.organizationId],
    references: [organizations.id],
  }),
  csrActivities: many(csrActivities),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  organization: one(organizations, {
    fields: [auditLogs.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [auditLogs.actorUserId],
    references: [users.id],
  }),
}));


export const auditExports = pgTable('audit_exports', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  requestedById: uuid('requested_by_id').notNull().references(() => users.id),
  status: varchar('status', { length: 50 }).notNull(),
  fileUrl: text('file_url'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const loginHistory = pgTable('login_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id').references(() => organizations.id),
  status: varchar('status', { length: 50 }).notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  failureReason: text('failure_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const retentionPolicies = pgTable('retention_policies', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  module: varchar('module', { length: 100 }).notNull(),
  retentionDays: integer('retention_days').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const securityEvents = pgTable('security_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  severity: varchar('severity', { length: 20 }).notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  details: jsonb('details'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const sessionHistory = pgTable('session_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionId: varchar('session_id', { length: 100 }).notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  endReason: varchar('end_reason', { length: 50 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  deviceInfo: jsonb('device_info'),
});



// -----------------
// VAULT
// -----------------
export const vaultDocumentStatusEnum = pgEnum('document_status', ['draft', 'pending_review', 'approved', 'rejected', 'archived', 'published']);

export const documentFolders = pgTable('document_folders', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  parentId: uuid('parent_id'),
  createdById: uuid('created_by_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }),
  departmentId: uuid('department_id').references(() => departments.id, { onDelete: 'set null' }),
  facility: varchar('facility', { length: 200 }),
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
  folderId: uuid('folder_id').references(() => documentFolders.id, { onDelete: 'set null' }),
  status: vaultDocumentStatusEnum('status').notNull().default('draft'),
  retentionPeriodDays: integer('retention_period_days'),
  expiryDate: timestamp('expiry_date', { withTimezone: true }),
  isArchived: boolean('is_archived').notNull().default(false),
  uploadedById: uuid('uploaded_by_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const documentVersions = pgTable('document_versions', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  versionNumber: integer('version_number').notNull(),
  fileKey: text('file_key').notNull(),
  originalFilename: varchar('original_filename', { length: 255 }).notNull(),
  fileSize: integer('file_size').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  ocrText: text('ocr_text'),
  changesSummary: text('changes_summary'),
  uploadedById: uuid('uploaded_by_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
});

export const documentShares = pgTable('document_shares', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  sharedByUserId: uuid('shared_by_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sharedWithUserId: uuid('shared_with_user_id').references(() => users.id, { onDelete: 'cascade' }),
  sharedWithDeptId: uuid('shared_with_dept_id').references(() => departments.id, { onDelete: 'cascade' }),
  sharedWithRole: varchar('shared_with_role', { length: 50 }),
  shareType: varchar('share_type', { length: 20 }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  passwordHash: text('password_hash'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const documentTags = pgTable('document_tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  tag: varchar('tag', { length: 50 }).notNull(),
});

export const documentComments = pgTable('document_comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  parentId: uuid('parent_id'),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const documentAuditLogs = pgTable('document_audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  action: varchar('action', { length: 100 }).notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  details: text('details'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const documentFavorites = pgTable('document_favorites', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});



// WORKFLOWS
// -----------------
export const workflowPriorityEnum = pgEnum('workflow_priority', ['low', 'medium', 'high', 'urgent']);
export const workflowStatusEnum = pgEnum('workflow_status', ['draft', 'pending', 'in_review', 'approved', 'rejected', 'completed', 'cancelled']);

export const workflowTemplates = pgTable('workflow_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  createdById: uuid('created_by_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const workflows = pgTable('workflows', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  templateId: uuid('template_id').references(() => workflowTemplates.id),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  status: workflowStatusEnum('status').notNull().default('draft'),
  priority: workflowPriorityEnum('priority').notNull().default('medium'),
  departmentId: uuid('department_id').references(() => departments.id),
  ownerId: uuid('owner_id').notNull().references(() => users.id),
  dueDate: timestamp('due_date', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
}, (table) => [
  index('workflows_org_status_idx').on(table.organizationId, table.status),
  index('workflows_owner_idx').on(table.ownerId),
]);

export const workflowSteps = pgTable('workflow_steps', {
  id: uuid('id').defaultRandom().primaryKey(),
  workflowId: uuid('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
  stepOrder: integer('step_order').notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  status: approvalStageStatusEnum('status').notNull().default('pending'),
  requiredRole: roleEnum('required_role'),
  decidedById: uuid('decided_by_id').references(() => users.id),
  decisionComment: text('decision_comment'),
  decidedAt: timestamp('decided_at', { withTimezone: true }),
  dueDate: timestamp('due_date', { withTimezone: true }),
}, (table) => [
  uniqueIndex('workflow_steps_order_idx').on(table.workflowId, table.stepOrder),
]);

export const workflowAssignments = pgTable('workflow_assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  workflowId: uuid('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
  stepId: uuid('step_id').notNull().references(() => workflowSteps.id, { onDelete: 'cascade' }),
  assignedUserId: uuid('assigned_user_id').references(() => users.id),
  assignedDepartmentId: uuid('assigned_department_id').references(() => departments.id),
  assignedRole: roleEnum('assigned_role'),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
});

export const workflowComments = pgTable('workflow_comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  workflowId: uuid('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('workflow_comments_workflow_idx').on(table.workflowId),
]);

export const workflowHistory = pgTable('workflow_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  workflowId: uuid('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
  actorId: uuid('actor_id').notNull().references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  details: jsonb('details'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Relations


export const workflowRelations = relations(workflows, ({ one, many }) => ({
  template: one(workflowTemplates, { fields: [workflows.templateId], references: [workflowTemplates.id] }),
  owner: one(users, { fields: [workflows.ownerId], references: [users.id] }),
  department: one(departments, { fields: [workflows.departmentId], references: [departments.id] }),
  steps: many(workflowSteps),
  comments: many(workflowComments),
  history: many(workflowHistory),
  assignments: many(workflowAssignments),
}));

export const workflowStepsRelations = relations(workflowSteps, ({ one, many }) => ({
  workflow: one(workflows, { fields: [workflowSteps.workflowId], references: [workflows.id] }),
  decidedBy: one(users, { fields: [workflowSteps.decidedById], references: [users.id] }),
  assignments: many(workflowAssignments),
}));

export const workflowAssignmentsRelations = relations(workflowAssignments, ({ one }) => ({
  workflow: one(workflows, { fields: [workflowAssignments.workflowId], references: [workflows.id] }),
  step: one(workflowSteps, { fields: [workflowAssignments.stepId], references: [workflowSteps.id] }),
  assignedUser: one(users, { fields: [workflowAssignments.assignedUserId], references: [users.id] }),
  assignedDepartment: one(departments, { fields: [workflowAssignments.assignedDepartmentId], references: [departments.id] }),
}));

export const workflowCommentsRelations = relations(workflowComments, ({ one }) => ({
  workflow: one(workflows, { fields: [workflowComments.workflowId], references: [workflows.id] }),
  author: one(users, { fields: [workflowComments.authorId], references: [users.id] }),
}));

export const workflowHistoryRelations = relations(workflowHistory, ({ one }) => ({
  workflow: one(workflows, { fields: [workflowHistory.workflowId], references: [workflows.id] }),
  actor: one(users, { fields: [workflowHistory.actorId], references: [users.id] }),
}));





export const documentsRelations = relations(documents, ({ one, many }) => ({
  folder: one(documentFolders, { fields: [documents.folderId], references: [documentFolders.id] }),
  uploadedBy: one(users, { fields: [documents.uploadedById], references: [users.id] }),
  versions: many(documentVersions),
  shares: many(documentShares),
  tags: many(documentTags),
  comments: many(documentComments),
  favorites: many(documentFavorites),
  auditLogs: many(documentAuditLogs),
}));
