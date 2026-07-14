import { Injectable } from '@nestjs/common';
import { and, count, eq, sql } from 'drizzle-orm';
import {
  approvals,
  carbonLedger,
  carbonTransactions,
  complianceIssues,
  csrActivities,
  esgScoreSnapshots,
  esgWeightages,
  reports,
  userRoles,
} from '@ecosphere/db';
import { BaseRepository } from './base.repository';

@Injectable()
export class ReportsRepository extends BaseRepository {
  getApprovedCsrHours(orgId: string) {
    return this.db
      .select({
        total: sql<string>`COALESCE(SUM(${csrActivities.hoursContributed}), 0)`,
      })
      .from(csrActivities)
      .where(and(eq(csrActivities.organizationId, orgId), eq(csrActivities.status, 'approved')));
  }

  countOpenComplianceIssues(orgId: string) {
    return this.db
      .select({ value: count() })
      .from(complianceIssues)
      .where(
        and(
          eq(complianceIssues.organizationId, orgId),
          sql`${complianceIssues.status} IN ('open', 'in_progress', 'escalated')`,
        ),
      );
  }

  countPendingApprovals(orgId: string) {
    return this.db
      .select({ value: count() })
      .from(approvals)
      .where(and(eq(approvals.organizationId, orgId), eq(approvals.status, 'submitted')));
  }

  countEmployees(orgId: string) {
    return this.db
      .select({ value: count() })
      .from(userRoles)
      .where(and(eq(userRoles.organizationId, orgId), eq(userRoles.role, 'employee')));
  }

  countActiveCsrParticipants(orgId: string) {
    return this.db
      .select({ value: sql<number>`COUNT(DISTINCT ${csrActivities.submittedById})` })
      .from(csrActivities)
      .where(and(eq(csrActivities.organizationId, orgId), eq(csrActivities.status, 'approved')));
  }

  getLatestScoreSnapshot(orgId: string) {
    return this.db.query.esgScoreSnapshots.findFirst({
      where: eq(esgScoreSnapshots.organizationId, orgId),
      orderBy: (table, { desc }) => [desc(table.calculatedAt)],
    });
  }

  getLatestWeightage(orgId: string) {
    return this.db.query.esgWeightages.findFirst({
      where: eq(esgWeightages.organizationId, orgId),
      orderBy: (table, { desc }) => [desc(table.effectiveFrom)],
    });
  }

  countResolvedIssues(orgId: string) {
    return this.db
      .select({ value: count() })
      .from(complianceIssues)
      .where(
        and(eq(complianceIssues.organizationId, orgId), eq(complianceIssues.status, 'resolved')),
      );
  }

  getApprovedCarbonLedgerTotal(orgId: string) {
    return this.db
      .select({
        total: sql<string>`COALESCE(SUM(CASE WHEN ${carbonLedger.entryType} = 'credit' THEN ${carbonLedger.co2eKg} ELSE -${carbonLedger.co2eKg} END), 0)`,
      })
      .from(carbonLedger)
      .where(eq(carbonLedger.organizationId, orgId));
  }

  insertScoreSnapshot(values: typeof esgScoreSnapshots.$inferInsert) {
    return this.db.insert(esgScoreSnapshots).values(values).onConflictDoNothing().returning();
  }

  insertReport(values: typeof reports.$inferInsert) {
    return this.db.insert(reports).values(values).returning();
  }

  listReports(orgId: string) {
    return this.db.query.reports.findMany({
      where: eq(reports.organizationId, orgId),
      orderBy: (table, { desc }) => [desc(table.generatedAt)],
    });
  }

  async listReportsWithScores(orgId: string) {
    const rows = await this.listReports(orgId);
    const enriched = await Promise.all(
      rows.map(async (report) => {
        let scores = {
          environmentalScore: null as number | null,
          socialScore: null as number | null,
          governanceScore: null as number | null,
          compositeScore: null as number | null,
        };
        if (report.scoreSnapshotId) {
          const snapshot = await this.db.query.esgScoreSnapshots.findFirst({
            where: eq(esgScoreSnapshots.id, report.scoreSnapshotId),
          });
          if (snapshot) {
            scores = {
              environmentalScore: Number(snapshot.environmentalScore),
              socialScore: Number(snapshot.socialScore),
              governanceScore: Number(snapshot.governanceScore),
              compositeScore: Number(snapshot.compositeScore),
            };
          }
        }
        return { ...report, ...scores };
      }),
    );
    return enriched;
  }

  getReportById(orgId: string, reportId: string) {
    return this.db.query.reports.findFirst({
      where: and(eq(reports.organizationId, orgId), eq(reports.id, reportId)),
    });
  }

  updateReportFileKey(reportId: string, fileKey: string) {
    return this.db
      .update(reports)
      .set({ fileKey })
      .where(eq(reports.id, reportId))
      .returning();
  }

  getCarbonTrend(orgId: string) {
    return this.db
      .select({
        month: sql<string>`TO_CHAR(${carbonTransactions.activityDate}, 'YYYY-MM')`,
        totalCo2e: sql<string>`COALESCE(SUM(${carbonTransactions.co2eKg}), 0)`,
      })
      .from(carbonTransactions)
      .where(
        and(eq(carbonTransactions.organizationId, orgId), eq(carbonTransactions.status, 'approved')),
      )
      .groupBy(sql`TO_CHAR(${carbonTransactions.activityDate}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${carbonTransactions.activityDate}, 'YYYY-MM')`);
  }
}
