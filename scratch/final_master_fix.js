const fs = require('fs');

// 1. Read clean index.ts
let content = fs.readFileSync('packages/db/src/schema/index.ts', 'utf8');

// 2. Fix auditLogs in base file
const auditLogColumns = `
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
`;
let actionStr = "action: varchar('action', { length: 150 }).notNull(),";
content = content.replace(actionStr, "action: varchar('action', { length: 255 }).notNull(),\n" + auditLogColumns);

// 3. Append missing Audit tables
let auditSchema = fs.readFileSync('C:/Users/HP/.gemini/antigravity-ide/brain/2969f362-b8a3-4df0-92f7-f997dd319a33/scratch/audit-schema.ts', 'utf8');
auditSchema = auditSchema.split('export const auditLogs')[0];
content += '\n' + auditSchema;

// 4. Append Vault schema
const vaultSchema = `
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

export const documentsRelations = relations(documents, ({ one, many }) => ({
  folder: one(documentFolders, { fields: [documents.folderId], references: [documentFolders.id] }),
  versions: many(documentVersions),
  shares: many(documentShares),
  tags: many(documentTags),
  comments: many(documentComments),
  favorites: many(documentFavorites),
  auditLogs: many(documentAuditLogs),
}));
`;
content += '\n' + vaultSchema;

// 5. Append Workflow schema
const workflowSchema = fs.readFileSync('scratch/workflow_schema.ts', 'utf8');
content += '\n' + workflowSchema;

// 6. Write final file
fs.writeFileSync('packages/db/src/schema/index.ts', content, 'utf8');
console.log('FINAL MASTER FIX COMPLETED!');
