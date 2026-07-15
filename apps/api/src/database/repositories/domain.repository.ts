import { Injectable } from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';
import {
  approvalStages,
  auditLogs,
  carbonScopeBreakdown,
  carbonTransactions,
  deiSnapshots,
  frameworkMappings,
  frameworkMetricSubmissions,
  participationStreaks,
  reportPipelineJobs,
  reportVarianceSnapshots,
  resourceConsumptionLedger,
} from '@ecosphere/db';
import type { DbExecutor } from '@ecosphere/db';
import type { ComplianceFramework, ResourceType, Role } from '@ecosphere/shared';
import { BaseRepository } from './base.repository';

@Injectable()
export class DomainRepository extends BaseRepository {
  listResourceConsumption(orgId: string, resourceType?: ResourceType) {
    return this.db.query.resourceConsumptionLedger.findMany({
      where: resourceType
        ? and(
            eq(resourceConsumptionLedger.organizationId, orgId),
            eq(resourceConsumptionLedger.resourceType, resourceType),
          )
        : eq(resourceConsumptionLedger.organizationId, orgId),
      orderBy: [desc(resourceConsumptionLedger.consumptionDate)],
    });
  }

  findResourceConsumption(orgId: string, id: string) {
    return this.db.query.resourceConsumptionLedger.findFirst({
      where: and(
        eq(resourceConsumptionLedger.id, id),
        eq(resourceConsumptionLedger.organizationId, orgId),
      ),
    });
  }

  createResourceConsumption(values: typeof resourceConsumptionLedger.$inferInsert) {
    return this.db.insert(resourceConsumptionLedger).values(values).returning();
  }

  listDeiSnapshots(orgId: string) {
    return this.db.query.deiSnapshots.findMany({
      where: eq(deiSnapshots.organizationId, orgId),
      orderBy: [desc(deiSnapshots.periodStart)],
    });
  }

  findDeiSnapshot(orgId: string, id: string) {
    return this.db.query.deiSnapshots.findFirst({
      where: and(eq(deiSnapshots.id, id), eq(deiSnapshots.organizationId, orgId)),
    });
  }

  createDeiSnapshot(values: typeof deiSnapshots.$inferInsert) {
    return this.db.insert(deiSnapshots).values(values).returning();
  }

  listFrameworkMappings(orgId: string, framework?: ComplianceFramework) {
    return this.db.query.frameworkMappings.findMany({
      where: framework
        ? and(
            eq(frameworkMappings.organizationId, orgId),
            eq(frameworkMappings.framework, framework),
          )
        : eq(frameworkMappings.organizationId, orgId),
      orderBy: [frameworkMappings.framework, frameworkMappings.metricCode],
    });
  }

  createFrameworkMapping(values: typeof frameworkMappings.$inferInsert) {
    return this.db.insert(frameworkMappings).values(values).returning();
  }

  findFrameworkMapping(orgId: string, id: string) {
    return this.db.query.frameworkMappings.findFirst({
      where: and(eq(frameworkMappings.id, id), eq(frameworkMappings.organizationId, orgId)),
    });
  }

  listFrameworkSubmissions(orgId: string) {
    return this.db.query.frameworkMetricSubmissions.findMany({
      where: eq(frameworkMetricSubmissions.organizationId, orgId),
      orderBy: [desc(frameworkMetricSubmissions.createdAt)],
    });
  }

  createFrameworkSubmission(values: typeof frameworkMetricSubmissions.$inferInsert) {
    return this.db.insert(frameworkMetricSubmissions).values(values).returning();
  }

  findFrameworkSubmission(orgId: string, id: string) {
    return this.db.query.frameworkMetricSubmissions.findFirst({
      where: and(
        eq(frameworkMetricSubmissions.id, id),
        eq(frameworkMetricSubmissions.organizationId, orgId),
      ),
    });
  }

  createApprovalStages(
    stages: Array<typeof approvalStages.$inferInsert>,
  ) {
    return this.db.insert(approvalStages).values(stages).returning();
  }

  listApprovalStages(approvalId: string) {
    return this.db.query.approvalStages.findMany({
      where: eq(approvalStages.approvalId, approvalId),
      orderBy: [approvalStages.stageOrder],
    });
  }

  findPendingStage(approvalId: string) {
    return this.db.query.approvalStages.findFirst({
      where: and(
        eq(approvalStages.approvalId, approvalId),
        eq(approvalStages.status, 'pending'),
      ),
      orderBy: [approvalStages.stageOrder],
    });
  }

  updateApprovalStage(
    stageId: string,
    values: {
      status: 'approved' | 'rejected' | 'skipped';
      decidedById: string;
      decidedAt: Date;
      decisionComment: string | null;
    },
  ) {
    return this.db
      .update(approvalStages)
      .set(values)
      .where(eq(approvalStages.id, stageId))
      .returning();
  }

  insertAuditLog(values: typeof auditLogs.$inferInsert) {
    return this.db.insert(auditLogs).values(values).returning();
  }

  listAuditLogs(orgId: string, limit: number, offset: number) {
    return this.db.query.auditLogs.findMany({
      where: eq(auditLogs.organizationId, orgId),
      orderBy: [desc(auditLogs.createdAt)],
      limit,
      offset,
      with: {
        user: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  upsertParticipationStreak(
    executor: DbExecutor,
    organizationId: string,
    userId: string,
    activityWeek: string,
    currentStreakWeeks: number,
    longestStreakWeeks: number,
  ) {
    return executor
      .insert(participationStreaks)
      .values({
        organizationId,
        userId,
        currentStreakWeeks,
        longestStreakWeeks,
        lastActivityWeek: activityWeek,
      })
      .onConflictDoUpdate({
        target: [participationStreaks.organizationId, participationStreaks.userId],
        set: {
          currentStreakWeeks,
          longestStreakWeeks,
          lastActivityWeek: activityWeek,
          updatedAt: new Date(),
        },
      });
  }

  getParticipationStreak(orgId: string, userId: string) {
    return this.db.query.participationStreaks.findFirst({
      where: and(
        eq(participationStreaks.organizationId, orgId),
        eq(participationStreaks.userId, userId),
      ),
    });
  }

  listParticipationStreaks(orgId: string) {
    return this.db.query.participationStreaks.findMany({
      where: eq(participationStreaks.organizationId, orgId),
      orderBy: [desc(participationStreaks.currentStreakWeeks)],
    });
  }

  upsertCarbonScopeBreakdown(
    orgId: string,
    periodStart: Date,
    periodEnd: Date,
    scope1Kg: string,
    scope2Kg: string,
    scope3Kg: string,
  ) {
    return this.db
      .insert(carbonScopeBreakdown)
      .values({
        organizationId: orgId,
        periodStart,
        periodEnd,
        scope1Kg,
        scope2Kg,
        scope3Kg,
      })
      .onConflictDoUpdate({
        target: [
          carbonScopeBreakdown.organizationId,
          carbonScopeBreakdown.periodStart,
          carbonScopeBreakdown.periodEnd,
        ],
        set: {
          scope1Kg,
          scope2Kg,
          scope3Kg,
          calculatedAt: new Date(),
        },
      })
      .returning();
  }

  getCarbonScopeBreakdown(orgId: string, filters?: any) {
    // Note: carbonScopeBreakdown is a materialized snapshot table.
    // For real-time filtering, this should be queried from raw carbonTransactions.
    // For demo purposes, we return the latest snapshot.
    return this.db.query.carbonScopeBreakdown.findFirst({
      where: eq(carbonScopeBreakdown.organizationId, orgId),
      orderBy: [desc(carbonScopeBreakdown.calculatedAt)],
    });
  }

  getScopeTotals(orgId: string) {
    return this.db
      .select({
        scope: carbonTransactions.scope,
        total: sql<string>`COALESCE(SUM(${carbonTransactions.co2eKg}), 0)`,
      })
      .from(carbonTransactions)
      .where(
        and(eq(carbonTransactions.organizationId, orgId), eq(carbonTransactions.status, 'approved')),
      )
      .groupBy(carbonTransactions.scope);
  }

  createReportPipelineJob(values: typeof reportPipelineJobs.$inferInsert) {
    return this.db
      .insert(reportPipelineJobs)
      .values(values)
      .onConflictDoNothing()
      .returning();
  }

  updateReportPipelineJob(
    jobId: string,
    values: Partial<typeof reportPipelineJobs.$inferInsert>,
  ) {
    return this.db
      .update(reportPipelineJobs)
      .set(values)
      .where(eq(reportPipelineJobs.id, jobId))
      .returning();
  }

  listReportPipelineJobs(orgId: string) {
    return this.db.query.reportPipelineJobs.findMany({
      where: eq(reportPipelineJobs.organizationId, orgId),
      orderBy: [desc(reportPipelineJobs.createdAt)],
    });
  }

  getReportPipelineJobById(orgId: string, jobId: string) {
    return this.db.query.reportPipelineJobs.findFirst({
      where: and(eq(reportPipelineJobs.organizationId, orgId), eq(reportPipelineJobs.id, jobId)),
    });
  }

  upsertVarianceSnapshot(values: typeof reportVarianceSnapshots.$inferInsert) {
    return this.db
      .insert(reportVarianceSnapshots)
      .values(values)
      .onConflictDoUpdate({
        target: [
          reportVarianceSnapshots.organizationId,
          reportVarianceSnapshots.metricKey,
          reportVarianceSnapshots.periodStart,
          reportVarianceSnapshots.periodEnd,
        ],
        set: {
          currentValue: values.currentValue,
          previousValue: values.previousValue,
          variancePercent: values.variancePercent,
          metricLabel: values.metricLabel,
          calculatedAt: new Date(),
        },
      })
      .returning();
  }

  listVarianceSnapshots(orgId: string) {
    return this.db.query.reportVarianceSnapshots.findMany({
      where: eq(reportVarianceSnapshots.organizationId, orgId),
      orderBy: [desc(reportVarianceSnapshots.calculatedAt)],
    });
  }

  updateResourceConsumptionStatus(id: string, status: 'approved' | 'rejected') {
    return this.db
      .update(resourceConsumptionLedger)
      .set({ status, updatedAt: new Date() })
      .where(eq(resourceConsumptionLedger.id, id));
  }

  updateDeiSnapshotStatus(id: string, status: 'approved' | 'rejected') {
    return this.db
      .update(deiSnapshots)
      .set({ status })
      .where(eq(deiSnapshots.id, id));
  }

  updateFrameworkSubmissionStatus(id: string, status: 'approved' | 'rejected') {
    return this.db
      .update(frameworkMetricSubmissions)
      .set({ status, updatedAt: new Date() })
      .where(eq(frameworkMetricSubmissions.id, id));
  }

  findEntityForApproval(entityType: string, entityId: string) {
    switch (entityType) {
      case 'resource_consumption':
        return this.db.query.resourceConsumptionLedger.findFirst({
          where: eq(resourceConsumptionLedger.id, entityId),
        });
      case 'framework_metric':
        return this.db.query.frameworkMetricSubmissions.findFirst({
          where: eq(frameworkMetricSubmissions.id, entityId),
        });
      case 'dei_snapshot':
        return this.db.query.deiSnapshots.findFirst({
          where: eq(deiSnapshots.id, entityId),
        });
      default:
        return Promise.resolve(null);
    }
  }
}

export function resolveApprovalStageRoles(entityType: string): Role[] {
  const pipeline: Record<string, Role[]> = {
    csr_activity: ['dept_head', 'esg_manager'],
    carbon_transaction: ['dept_head', 'esg_manager'],
    challenge_participation: ['dept_head', 'esg_manager'],
    reward_redemption: ['esg_manager'],
    resource_consumption: ['dept_head', 'esg_manager'],
    framework_metric: ['dept_head', 'esg_manager', 'org_admin'],
    dei_snapshot: ['dept_head', 'esg_manager', 'org_admin'],
  };
  return pipeline[entityType] ?? ['esg_manager'];
}

export function getIsoWeekString(date: Date): string {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${target.getUTCFullYear()}-${String(week).padStart(2, '0')}`;
}

export function getPreviousIsoWeek(weekString: string): string {
  const [yearPart, weekPart] = weekString.split('-');
  const year = Number(yearPart);
  const week = Number(weekPart);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const day = jan4.getUTCDay() || 7;
  const weekStart = new Date(jan4);
  weekStart.setUTCDate(jan4.getUTCDate() - day + 1 + (week - 1) * 7);
  weekStart.setUTCDate(weekStart.getUTCDate() - 7);
  return getIsoWeekString(weekStart);
}
