const fs = require('fs');

const indexPath = 'packages/db/src/schema/index.ts';
let indexContent = fs.readFileSync(indexPath, 'utf8');
let bottomContent = fs.readFileSync('scratch/bottom.ts', 'utf8');

// 1. Add audit log fields to audit_logs table in index.ts
const auditLogColumns = `
    module: varchar('module', { length: 100 }),
    browser: varchar('browser', { length: 100 }),
    os: varchar('os', { length: 100 }),
    device: varchar('device', { length: 100 }),
    location: varchar('location', { length: 100 }),
    sessionId: varchar('session_id', { length: 100 }),
    requestId: varchar('request_id', { length: 100 }),
    oldValue: jsonb('old_value'),
    newValue: jsonb('new_value'),
    success: boolean('success').notNull().default(true),
    severity: varchar('severity', { length: 20 }).notNull().default('info'),
    executionTime: integer('execution_time'),
`;

// Insert after action: varchar('action', { length: 255 }).notNull(),
indexContent = indexContent.replace(
  "action: varchar('action', { length: 255 }).notNull(),",
  "action: varchar('action', { length: 255 }).notNull(),\n" + auditLogColumns
);

// 2. Add login_history, security_events, session_history, retention_policies, audit_exports to index.ts
const newAuditTables = `
export const loginHistory = pgTable('login_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id').references(() => organizations.id),
  status: varchar('status', { length: 50 }).notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  failureReason: text('failure_reason'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const securityEvents = pgTable('security_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  severity: varchar('severity', { length: 20 }).notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  details: jsonb('details'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const sessionHistory = pgTable('session_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionId: varchar('session_id', { length: 100 }).notNull(),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  endedAt: timestamp('ended_at'),
  endReason: varchar('end_reason', { length: 50 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  deviceInfo: jsonb('device_info'),
});

export const retentionPolicies = pgTable('retention_policies', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  module: varchar('module', { length: 100 }).notNull(),
  retentionDays: integer('retention_days').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const auditExports = pgTable('audit_exports', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  requestedById: uuid('requested_by_id').notNull().references(() => users.id),
  status: varchar('status', { length: 50 }).notNull(),
  fileUrl: text('file_url'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
`;

// Append everything
fs.writeFileSync(indexPath, indexContent + '\n' + newAuditTables + '\n' + bottomContent);
console.log('Finalized schema');
