import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { auditLogs, loginHistory, securityEvents, sessionHistory, retentionPolicies, auditExports, DbExecutor } from '@ecosphere/db';
import { desc, eq, and, sql } from 'drizzle-orm';

@Injectable()
export class AuditRepository extends BaseRepository {
  async createAuditLog(data: typeof auditLogs.$inferInsert, tx?: DbExecutor) {
    const db = tx ?? this.executor;
    const [result] = await db.insert(auditLogs).values(data).returning();
    return result;
  }

  async getAuditLogs(
    organizationId: string,
    options: {
      userId?: string;
      actorUserId?: string;
      module?: string;
      action?: string;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    const conditions = [eq(auditLogs.organizationId, organizationId)];
    
    if (options.userId) {
      conditions.push(eq(auditLogs.actorUserId, options.userId));
    }
    if (options.module) {
      conditions.push(eq(auditLogs.module, options.module));
    }
    if (options.action) {
      conditions.push(eq(auditLogs.action, options.action));
    }

    const logs = await this.executor
      .select()
      .from(auditLogs)
      .where(and(...conditions))
      .orderBy(desc(auditLogs.createdAt))
      .limit(options.limit ?? 50)
      .offset(options.offset ?? 0);
      
    // Count total
    const [countResult] = await this.executor
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(and(...conditions));

    return { logs, total: Number(countResult?.count || 0) };
  }

  async createSecurityEvent(data: typeof securityEvents.$inferInsert, tx?: DbExecutor) {
    const db = tx ?? this.executor;
    const [result] = await db.insert(securityEvents).values(data).returning();
    return result;
  }

  async getSecurityEvents(organizationId: string, limit = 50, offset = 0) {
    return this.executor
      .select()
      .from(securityEvents)
      .where(eq(securityEvents.organizationId, organizationId))
      .orderBy(desc(securityEvents.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async createLoginHistory(data: typeof loginHistory.$inferInsert, tx?: DbExecutor) {
    const db = tx ?? this.executor;
    const [result] = await db.insert(loginHistory).values(data).returning();
    return result;
  }
}
