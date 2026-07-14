import { Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import {
  complianceIssueStatusHistory,
  complianceIssues,
  policies,
  policyAcknowledgements,
  auditLogs,
} from '@ecosphere/db';
import { BaseRepository } from './base.repository';

@Injectable()
export class GovernanceRepository extends BaseRepository {
  listComplianceIssues(orgId: string) {
    return this.db.query.complianceIssues.findMany({
      where: eq(complianceIssues.organizationId, orgId),
      orderBy: [desc(complianceIssues.createdAt)],
    });
  }

  findComplianceIssue(orgId: string, issueId: string) {
    return this.db.query.complianceIssues.findFirst({
      where: and(eq(complianceIssues.id, issueId), eq(complianceIssues.organizationId, orgId)),
    });
  }

  createComplianceIssue(values: typeof complianceIssues.$inferInsert) {
    return this.db.insert(complianceIssues).values(values).returning();
  }

  updateComplianceIssue(issueId: string, status: typeof complianceIssues.$inferInsert.status) {
    return this.db
      .update(complianceIssues)
      .set({ status, updatedAt: new Date() })
      .where(eq(complianceIssues.id, issueId))
      .returning();
  }

  insertStatusHistory(values: typeof complianceIssueStatusHistory.$inferInsert) {
    return this.db.insert(complianceIssueStatusHistory).values(values);
  }

  listPolicies(orgId: string) {
    return this.db.query.policies.findMany({
      where: eq(policies.organizationId, orgId),
      orderBy: [desc(policies.effectiveFrom)],
    });
  }

  findPolicy(orgId: string, policyId: string) {
    return this.db.query.policies.findFirst({
      where: and(eq(policies.id, policyId), eq(policies.organizationId, orgId)),
    });
  }

  createPolicy(values: typeof policies.$inferInsert) {
    return this.db.insert(policies).values(values).returning();
  }

  acknowledgePolicy(values: typeof policyAcknowledgements.$inferInsert) {
    return this.db.insert(policyAcknowledgements).values(values).onConflictDoNothing().returning();
  }

  listAuditLogs(orgId: string) {
    return this.db.query.auditLogs.findMany({
      where: eq(auditLogs.organizationId, orgId),
      orderBy: [desc(auditLogs.createdAt)],
      limit: 100, // Reasonable limit for now
    });
  }

  createAuditLog(values: typeof auditLogs.$inferInsert) {
    return this.db.insert(auditLogs).values(values).returning();
  }
}
