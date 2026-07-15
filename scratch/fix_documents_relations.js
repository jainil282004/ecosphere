const fs = require('fs');
let content = fs.readFileSync('packages/db/src/schema/index.ts', 'utf8');

const regex = /export const documentsRelations\s*=\s*relations\(documents,\s*\(\{\s*one,\s*many\s*\}\)\s*=>\s*\(\{[\s\S]*?\}\)\);/g;

content = content.replace(regex, '');

const correctRelations = `
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
`;

content += '\n' + correctRelations;

fs.writeFileSync('packages/db/src/schema/index.ts', content, 'utf8');
console.log('Fixed documentsRelations!');
