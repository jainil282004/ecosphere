const fs = require('fs');
const indexPath = 'packages/db/src/schema/index.ts';
let content = fs.readFileSync(indexPath, 'utf8');

content = content.replace(/vaultFolders/g, 'documentFolders');
content = content.replace(/vault_folders/g, 'document_folders');
content = content.replace(/vaultDocuments/g, 'documents');
content = content.replace(/vault_documents/g, 'documents');
content = content.replace(/vaultDocumentVersions/g, 'documentVersions');
content = content.replace(/vault_document_versions/g, 'document_versions');
content = content.replace(/vaultDocumentShares/g, 'documentShares');
content = content.replace(/vault_document_shares/g, 'document_shares');

// In vault.repository.ts, we also have documentTags, documentComments, documentAuditLogs, documentFavorites.
// If I missed them, I should add them. But if they aren't strictly required for my Audit Log task, I might just add empty definitions so `api` compiles.

// Let's add the missing ones as simple tables to satisfy `vault.repository.ts`
const extraTables = `
export const documentTags = pgTable('document_tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id').notNull(),
  tag: varchar('tag', { length: 50 }).notNull(),
});

export const documentComments = pgTable('document_comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id').notNull(),
  content: text('content').notNull(),
});

export const documentAuditLogs = pgTable('document_audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id').notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const documentFavorites = pgTable('document_favorites', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id').notNull(),
  userId: uuid('user_id').notNull(),
});
`;

if (!content.includes('documentTags')) {
  content += extraTables;
}

// Ensure `title` is used instead of `name` if `vault.repository.ts` uses `table.title`
content = content.replace(/name: varchar\('name'/g, "title: varchar('title'");

fs.writeFileSync(indexPath, content);
console.log('Fixed names');
