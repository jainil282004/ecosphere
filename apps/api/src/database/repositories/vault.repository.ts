import { Injectable } from '@nestjs/common';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import {
  documents,
  documentFolders,
  documentVersions,
  documentTags,
  documentShares,
  documentComments,
  documentAuditLogs,
  documentFavorites,
} from '@ecosphere/db';
import type { DbExecutor } from '@ecosphere/db';
import { BaseRepository } from './base.repository';

@Injectable()
export class VaultRepository extends BaseRepository {
  async insertFolder(values: typeof documentFolders.$inferInsert) {
    const [folder] = await this.db.insert(documentFolders).values(values).returning();
    return folder;
  }

  async listFolders(orgId: string, parentId: string | null = null) {
    return this.db.query.documentFolders.findMany({
      where: (table: any, { eq, and, isNull }: any) => and(
        eq(table.organizationId, orgId),
        parentId ? eq(table.parentId, parentId) : isNull(table.parentId)
      ),
      orderBy: (table: any, { asc }: any) => [asc(table.name)],
    });
  }

  async getFolderById(orgId: string, folderId: string) {
    return this.db.query.documentFolders.findFirst({
      where: (table: any, { eq, and }: any) => and(eq(table.organizationId, orgId), eq(table.id, folderId)),
    });
  }

  async insertDocument(executor: DbExecutor, values: typeof documents.$inferInsert) {
    const [doc] = await executor.insert(documents).values(values).returning();
    return doc;
  }

  async insertVersion(executor: DbExecutor, values: typeof documentVersions.$inferInsert) {
    const [version] = await executor.insert(documentVersions).values(values).returning();
    return version;
  }

  async insertTags(executor: DbExecutor, documentId: string, tags: string[]) {
    if (!tags.length) return;
    const values = tags.map(tag => ({ documentId, tag }));
    await executor.insert(documentTags).values(values).onConflictDoNothing();
  }

  async getDocumentById(orgId: string, documentId: string) {
    return this.db.query.documents.findFirst({
      where: (table: any, { eq, and }: any) => and(eq(table.organizationId, orgId), eq(table.id, documentId)),
      with: {
        tags: true,
        versions: {
          orderBy: (table: any, { desc }: any) => [desc(table.versionNumber)],
        },
        uploadedBy: true,
        folder: true
      },
    });
  }

  async logAudit(executor: DbExecutor, values: typeof documentAuditLogs.$inferInsert) {
    await executor.insert(documentAuditLogs).values(values);
  }

  async listDocuments(orgId: string, filters: { folderId?: string | null, search?: string }) {
    return this.db.query.documents.findMany({
      where: (table: any, { eq, and, ilike, isNull, or }: any) => {
        const conditions = [eq(table.organizationId, orgId)];
        
        if (filters.folderId !== undefined) {
          if (filters.folderId === null) {
            conditions.push(isNull(table.folderId));
          } else {
            conditions.push(eq(table.folderId, filters.folderId));
          }
        }
        
        if (filters.search) {
          conditions.push(
            or(
              ilike(table.title, `%${filters.search}%`),
              ilike(table.description, `%${filters.search}%`)
            )
          );
        }
        return and(...conditions);
      },
      with: {
        tags: true,
        versions: {
          orderBy: (table: any, { desc }: any) => [desc(table.versionNumber)],
          limit: 1,
        }
      },
      orderBy: (table: any, { desc }: any) => [desc(table.updatedAt)],
    });
  }

  async getDocumentAuditLogs(documentId: string) {
    return this.db.query.documentAuditLogs.findMany({
      where: (table: any, { eq }: any) => eq(table.documentId, documentId),
      orderBy: (table: any, { desc }: any) => [desc(table.createdAt)],
    });
  }
}
