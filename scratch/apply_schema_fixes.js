const fs = require('fs');
let content = fs.readFileSync('packages/db/src/schema/index.ts', 'utf8');

// 1. Audit Logs (Add new columns without removing the old ones!)
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
content = content.replace(
  "action: varchar('action', { length: 255 }).notNull(),",
  "action: varchar('action', { length: 255 }).notNull(),\n" + auditLogColumns
);
content = content.replace(
  "action: varchar('action', { length: 150 }).notNull(),",
  "action: varchar('action', { length: 150 }).notNull(),\n" + auditLogColumns
);

// 2. Add loginHistory, etc. (from audit-schema.ts, ignoring the auditLogs definition)
let auditSchema = '';
if (fs.existsSync('C:/Users/HP/.gemini/antigravity-ide/brain/2969f362-b8a3-4df0-92f7-f997dd319a33/scratch/audit-schema.ts')) {
    auditSchema = fs.readFileSync('C:/Users/HP/.gemini/antigravity-ide/brain/2969f362-b8a3-4df0-92f7-f997dd319a33/scratch/audit-schema.ts', 'utf8');
    auditSchema = auditSchema.split('export const auditLogs')[0];
}
content = content + '\n' + auditSchema;

// 3. Append bottom.ts (which has Vault and Workflow tables)
let bottom = '';
if (fs.existsSync('scratch/bottom.ts')) {
    bottom = fs.readFileSync('scratch/bottom.ts', 'utf8');
}
content = content + '\n' + bottom;

// 4. Append Vault Extras (Tags, Comments, Favorites, AuditLogs)
const extras = `
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
`;
content = content + '\n' + extras;

// 5. Fix documentsRelations (to include tags, comments, favorites, auditLogs)
content = content.replace(
  "export const documentsRelations = relations(documents, ({ one, many }) => ({\n    folder: one(documentFolders, { fields: [documents.folderId], references: [documentFolders.id] }),\n    versions: many(documentVersions),\n    shares: many(documentShares),\n  }));",
  "export const documentsRelations = relations(documents, ({ one, many }) => ({\n    folder: one(documentFolders, { fields: [documents.folderId], references: [documentFolders.id] }),\n    versions: many(documentVersions),\n    shares: many(documentShares),\n    tags: many(documentTags),\n    comments: many(documentComments),\n    favorites: many(documentFavorites),\n    auditLogs: many(documentAuditLogs),\n  }));"
);

// Write to index.ts
fs.writeFileSync('packages/db/src/schema/index.ts', content, 'utf8');
console.log('Fixed index.ts perfectly');
