import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import { approvals, carbonScopeBreakdown, carbonTransactions } from '@ecosphere/db';
import type { DbExecutor } from '@ecosphere/db';
import type { ApprovalEntityType, Role } from '@ecosphere/shared';
import { ApprovalRepository } from '../../database/repositories/approval.repository';
import { DomainRepository, getIsoWeekString, getPreviousIsoWeek, resolveApprovalStageRoles } from '../../database/repositories/domain.repository';
import { LedgerRepository } from '../../database/repositories/ledger.repository';
import { RewardsRepository } from '../../database/repositories/rewards.repository';
import type { AuthenticatedUser } from '../../common/types/request.types';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ApprovalsService {
  constructor(
    private readonly approvalRepository: ApprovalRepository,
    private readonly domainRepository: DomainRepository,
    private readonly ledgerRepository: LedgerRepository,
    private readonly rewardsRepository: RewardsRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createApprovalRecord(
    organizationId: string,
    entityType: ApprovalEntityType,
    entityId: string,
    submittedById: string,
  ) {
    const [record] = await this.approvalRepository.upsertApproval({
      organizationId,
      entityType,
      entityId,
      status: 'submitted',
      submittedById,
      submittedAt: new Date(),
    });

    if (record) {
      const stageRoles = resolveApprovalStageRoles(entityType);
      await this.domainRepository.createApprovalStages(
        stageRoles.map((role, index) => ({
          organizationId,
          approvalId: record.id,
          stageOrder: index + 1,
          requiredRole: role,
          status: index === 0 ? 'pending' : 'pending',
        })),
      );
    }

    return record;
  }

  async listInbox(organizationId: string, user: AuthenticatedUser) {
    if (!user.permissions.includes('approve_submissions')) {
      throw new ForbiddenException('You cannot view the approvals inbox.');
    }

    const deptHeadAssignment = user.roles.find(
      (role) =>
        role.organizationId === organizationId &&
        role.role === 'dept_head' &&
        role.departmentId,
    );

    const isOrgWideApprover = user.roles.some(
      (role) =>
        role.organizationId === organizationId &&
        (role.role === 'esg_manager' || role.role === 'org_admin'),
    );

    const pendingApprovals = await this.approvalRepository.listPending(organizationId);
    const enriched = [];

    for (const approval of pendingApprovals) {
      const entity = await this.mapEntitySummary(
        approval.entityType as ApprovalEntityType,
        approval.entityId,
      );

      if (!entity) {
        continue;
      }

      if (
        deptHeadAssignment &&
        !isOrgWideApprover &&
        entity.departmentId &&
        entity.departmentId !== deptHeadAssignment.departmentId
      ) {
        continue;
      }

      if (approval.submittedById === user.id) {
        continue;
      }

      enriched.push({ ...approval, entity });
    }

    return enriched;
  }

  async decide(
    organizationId: string,
    approvalId: string,
    user: AuthenticatedUser,
    decision: 'approved' | 'rejected',
    comment?: string,
  ) {
    const approval = await this.approvalRepository.findById(organizationId, approvalId);

    if (!approval) {
      throw new NotFoundException('Approval record not found.');
    }

    if (approval.status !== 'submitted') {
      throw new BadRequestException('This approval has already been decided.');
    }

    if (approval.submittedById === user.id) {
      throw new ForbiddenException('You cannot approve your own submission.');
    }

    await this.assertCanApprove(
      organizationId,
      user,
      approval.entityType as ApprovalEntityType,
      approval.entityId,
    );

    const pendingStage = await this.domainRepository.findPendingStage(approvalId);
    if (pendingStage) {
      const orgRoles = user.roles
        .filter((role) => role.organizationId === organizationId)
        .map((role) => role.role);
      if (!orgRoles.includes(pendingStage.requiredRole)) {
        throw new ForbiddenException(
          `Stage ${pendingStage.stageOrder} requires ${pendingStage.requiredRole} approval.`,
        );
      }

      await this.domainRepository.updateApprovalStage(pendingStage.id, {
        status: decision,
        decidedById: user.id,
        decidedAt: new Date(),
        decisionComment: comment ?? null,
      });

      if (decision === 'rejected') {
        const approverRole = this.resolveApproverRole(organizationId, user);
        const [updated] = await this.approvalRepository.updateDecision(approvalId, {
          status: 'rejected',
          decidedById: user.id,
          decidedAt: new Date(),
          approverRole,
          decisionComment: comment ?? null,
        });
        await this.approvalRepository.updateEntityStatus(
          approval.entityType as ApprovalEntityType,
          approval.entityId,
          'rejected',
        );
        await this.notifyDecision(organizationId, approval, 'rejected', comment);
        return updated;
      }

      const remainingStage = await this.domainRepository.findPendingStage(approvalId);
      if (remainingStage) {
        return {
          ...approval,
          status: 'submitted' as const,
          currentStage: remainingStage.stageOrder,
          requiredRole: remainingStage.requiredRole,
        };
      }
    }

    const approverRole = this.resolveApproverRole(organizationId, user);

    const [updated] = await this.approvalRepository.updateDecision(approvalId, {
      status: decision,
      decidedById: user.id,
      decidedAt: new Date(),
      approverRole,
      decisionComment: comment ?? null,
    });

    await this.approvalRepository.updateEntityStatus(
      approval.entityType as ApprovalEntityType,
      approval.entityId,
      decision,
    );

    if (decision === 'approved' && updated) {
      await this.applySideEffects(updated);
    }

    await this.notifyDecision(organizationId, approval, decision, comment);

    return updated;
  }

  private async notifyDecision(
    organizationId: string,
    approval: { submittedById: string; entityType: string; entityId: string },
    decision: 'approved' | 'rejected',
    comment?: string,
  ) {
    await this.notificationsService.createNotification({
      organizationId,
      userId: approval.submittedById,
      type: 'approval_decision',
      title: decision === 'approved' ? 'Submission approved' : 'Submission rejected',
      body:
        decision === 'approved'
          ? 'Your submission was approved and rewards have been applied where applicable.'
          : `Your submission was rejected.${comment ? ` Reason: ${comment}` : ''}`,
      entityType: approval.entityType,
      entityId: approval.entityId,
    });
  }

  private async assertCanApprove(
    organizationId: string,
    user: AuthenticatedUser,
    entityType: ApprovalEntityType,
    entityId: string,
  ) {
    if (!user.permissions.includes('approve_submissions')) {
      throw new ForbiddenException('Insufficient permissions to approve submissions.');
    }

    const isOrgWideApprover = user.roles.some(
      (role) =>
        role.organizationId === organizationId &&
        (role.role === 'esg_manager' || role.role === 'org_admin'),
    );

    if (isOrgWideApprover) {
      return;
    }

    const deptHeadAssignment = user.roles.find(
      (role) =>
        role.organizationId === organizationId &&
        role.role === 'dept_head' &&
        role.departmentId,
    );

    if (!deptHeadAssignment) {
      throw new ForbiddenException('Department-scoped approval privileges required.');
    }

    const entity = await this.mapEntitySummary(entityType, entityId);
    if (!entity) {
      throw new NotFoundException('Approval entity not found.');
    }
    if (entity.departmentId && entity.departmentId !== deptHeadAssignment.departmentId) {
      throw new ForbiddenException('You can only approve submissions for your department.');
    }
  }

  private async mapEntitySummary(entityType: ApprovalEntityType, entityId: string) {
    const row = await this.approvalRepository.findEntitySummary(entityType, entityId);

    if (!row) {
      return null;
    }

    switch (entityType) {
      case 'csr_activity': {
        const activity = row as typeof row & {
          title: string;
          departmentId: string;
          submittedById: string;
          status: string;
        };
        return {
          id: activity.id,
          title: activity.title,
          departmentId: activity.departmentId,
          submittedById: activity.submittedById,
          status: activity.status,
        };
      }
      case 'carbon_transaction': {
        const transaction = row as typeof row & {
          activityType: string;
          departmentId: string;
          submittedById: string;
          status: string;
        };
        return {
          id: transaction.id,
          title: transaction.activityType,
          departmentId: transaction.departmentId,
          submittedById: transaction.submittedById,
          status: transaction.status,
        };
      }
      case 'challenge_participation': {
        const participation = row as typeof row & {
          userId: string;
          status: string;
        };
        return {
          id: participation.id,
          title: 'Challenge participation',
          departmentId: null,
          submittedById: participation.userId,
          status: participation.status,
        };
      }
      case 'reward_redemption': {
        const redemption = row as typeof row & {
          userId: string;
          status: string;
        };
        return {
          id: redemption.id,
          title: 'Reward redemption',
          departmentId: null,
          submittedById: redemption.userId,
          status: redemption.status,
        };
      }
      case 'resource_consumption': {
        const entry = row as typeof row & {
          resourceType: string;
          departmentId: string;
          submittedById: string;
          status: string;
        };
        return {
          id: entry.id,
          title: `${entry.resourceType} consumption`,
          departmentId: entry.departmentId,
          submittedById: entry.submittedById,
          status: entry.status,
        };
      }
      case 'framework_metric': {
        const submission = row as typeof row & {
          snapshotMetricTitle: string;
          submittedById: string;
          status: string;
        };
        return {
          id: submission.id,
          title: submission.snapshotMetricTitle,
          departmentId: null,
          submittedById: submission.submittedById,
          status: submission.status,
        };
      }
      case 'dei_snapshot': {
        const snapshot = row as typeof row & {
          recordedById: string;
          departmentId: string | null;
          status: string;
        };
        return {
          id: snapshot.id,
          title: 'DEI balance snapshot',
          departmentId: snapshot.departmentId,
          submittedById: snapshot.recordedById,
          status: snapshot.status,
        };
      }
      default:
        return null;
    }
  }

  private resolveApproverRole(organizationId: string, user: AuthenticatedUser): Role {
    const orgRoles = user.roles.filter((role) => role.organizationId === organizationId);
    if (orgRoles.some((role) => role.role === 'org_admin')) {
      return 'org_admin';
    }
    if (orgRoles.some((role) => role.role === 'esg_manager')) {
      return 'esg_manager';
    }
    if (orgRoles.some((role) => role.role === 'dept_head')) {
      return 'dept_head';
    }
    return orgRoles[0]?.role ?? 'employee';
  }

  async applySideEffects(approval: typeof approvals.$inferSelect) {
    if (approval.sideEffectsAppliedAt) {
      return;
    }

    await this.approvalRepository.transaction(async (tx) => {
      const locked = await tx.query.approvals.findFirst({
        where: eq(approvals.id, approval.id),
      });

      if (!locked || locked.sideEffectsAppliedAt) {
        return;
      }

      switch (locked.entityType) {
        case 'csr_activity':
          await this.applyCsrSideEffects(tx, locked.organizationId, locked.entityId);
          break;
        case 'carbon_transaction':
          await this.applyCarbonSideEffects(tx, locked.organizationId, locked.entityId);
          break;
        case 'challenge_participation':
          await this.applyChallengeSideEffects(tx, locked.organizationId, locked.entityId);
          break;
        case 'reward_redemption':
          await this.applyRedemptionSideEffects(tx, locked.organizationId, locked.entityId);
          break;
        case 'resource_consumption':
          await this.applyResourceConsumptionSideEffects(tx, locked.organizationId, locked.entityId);
          break;
        default:
          break;
      }

      await this.approvalRepository.markSideEffectsApplied(tx, locked.id);
    });
  }

  private async applyCsrSideEffects(tx: DbExecutor, organizationId: string, entityId: string) {
    const activity = await tx.query.csrActivities.findFirst({
      where: (table, { eq: equals }) => equals(table.id, entityId),
    });

    if (!activity) {
      return;
    }

    const xpAmount = Math.max(10, Math.round(Number(activity.hoursContributed) * 5));
    const pointsAmount = Math.max(5, Math.round(Number(activity.hoursContributed) * 2));

    await this.ledgerRepository.creditXp(tx, {
      organizationId,
      userId: activity.submittedById,
      entryType: 'credit',
      amount: xpAmount,
      sourceType: 'csr_activity',
      sourceId: activity.id,
      description: `CSR activity approved: ${activity.title}`,
    });

    await this.ledgerRepository.creditPoints(tx, {
      organizationId,
      userId: activity.submittedById,
      entryType: 'credit',
      amount: pointsAmount,
      sourceType: 'csr_activity',
      sourceId: activity.id,
      description: `CSR activity approved: ${activity.title}`,
    });

    await this.evaluateBadges(tx, organizationId, activity.submittedById, activity.id);

    const activityWeek = getIsoWeekString(activity.activityDate);
    const existingStreak = await tx.query.participationStreaks.findFirst({
      where: (table, { and: andOp, eq: equals }) =>
        andOp(
          equals(table.organizationId, organizationId),
          equals(table.userId, activity.submittedById),
        ),
    });

    let currentStreak = 1;
    let longestStreak = 1;

    if (existingStreak) {
      if (existingStreak.lastActivityWeek === activityWeek) {
        currentStreak = existingStreak.currentStreakWeeks;
        longestStreak = existingStreak.longestStreakWeeks;
      } else if (getPreviousIsoWeek(activityWeek) === existingStreak.lastActivityWeek) {
        currentStreak = existingStreak.currentStreakWeeks + 1;
        longestStreak = Math.max(existingStreak.longestStreakWeeks, currentStreak);
      } else {
        currentStreak = 1;
        longestStreak = Math.max(existingStreak.longestStreakWeeks, 1);
      }
    }

    await this.domainRepository.upsertParticipationStreak(
      tx,
      organizationId,
      activity.submittedById,
      activityWeek,
      currentStreak,
      longestStreak,
    );
  }

  private async applyCarbonSideEffects(tx: DbExecutor, organizationId: string, entityId: string) {
    const transaction = await tx.query.carbonTransactions.findFirst({
      where: (table, { eq: equals }) => equals(table.id, entityId),
    });

    if (!transaction) {
      return;
    }

    await this.ledgerRepository.creditCarbon(tx, {
      organizationId,
      departmentId: transaction.departmentId,
      userId: transaction.submittedById,
      entryType: 'credit',
      co2eKg: transaction.co2eKg,
      sourceType: 'activity_submission',
      sourceId: transaction.id,
      description: `Carbon activity approved: ${transaction.activityType}`,
    });

    await this.ledgerRepository.creditXp(tx, {
      organizationId,
      userId: transaction.submittedById,
      entryType: 'credit',
      amount: 15,
      sourceType: 'carbon_transaction',
      sourceId: transaction.id,
      description: `Carbon activity approved: ${transaction.activityType}`,
    });

    await this.recalculateScopeBreakdown(tx, organizationId);
  }

  private async recalculateScopeBreakdown(tx: DbExecutor, organizationId: string) {
    const periodEnd = new Date();
    const periodStart = new Date();
    periodStart.setMonth(periodStart.getMonth() - 3);

    const rows = await tx
      .select({
        scope: carbonTransactions.scope,
        total: sql<string>`COALESCE(SUM(${carbonTransactions.co2eKg}), 0)`,
      })
      .from(carbonTransactions)
      .where(
        and(
          eq(carbonTransactions.organizationId, organizationId),
          eq(carbonTransactions.status, 'approved'),
        ),
      )
      .groupBy(carbonTransactions.scope);

    let scope1 = '0';
    let scope2 = '0';
    let scope3 = '0';
    for (const row of rows) {
      if (row.scope === 'scope_1') scope1 = row.total;
      if (row.scope === 'scope_2') scope2 = row.total;
      if (row.scope === 'scope_3') scope3 = row.total;
    }

    await tx
      .insert(carbonScopeBreakdown)
      .values({
        organizationId,
        periodStart,
        periodEnd,
        scope1Kg: scope1,
        scope2Kg: scope2,
        scope3Kg: scope3,
      })
      .onConflictDoUpdate({
        target: [
          carbonScopeBreakdown.organizationId,
          carbonScopeBreakdown.periodStart,
          carbonScopeBreakdown.periodEnd,
        ],
        set: {
          scope1Kg: scope1,
          scope2Kg: scope2,
          scope3Kg: scope3,
          calculatedAt: new Date(),
        },
      });
  }

  private async applyResourceConsumptionSideEffects(
    tx: DbExecutor,
    organizationId: string,
    entityId: string,
  ) {
    const entry = await tx.query.resourceConsumptionLedger.findFirst({
      where: (table, { eq: equals }) => equals(table.id, entityId),
    });

    if (!entry) {
      return;
    }

    await this.ledgerRepository.creditXp(tx, {
      organizationId,
      userId: entry.submittedById,
      entryType: 'credit',
      amount: 10,
      sourceType: 'manual_adjustment',
      sourceId: entry.id,
      description: `Resource consumption verified: ${entry.resourceType}`,
    });
  }

  private async applyChallengeSideEffects(
    tx: DbExecutor,
    organizationId: string,
    entityId: string,
  ) {
    const participation = await tx.query.challengeParticipations.findFirst({
      where: (table, { eq: equals }) => equals(table.id, entityId),
    });

    if (!participation) {
      return;
    }

    await this.ledgerRepository.creditXp(tx, {
      organizationId,
      userId: participation.userId,
      entryType: 'credit',
      amount: participation.snapshotXpReward,
      sourceType: 'challenge_participation',
      sourceId: participation.id,
      description: 'Challenge participation approved',
    });

    await this.ledgerRepository.creditPoints(tx, {
      organizationId,
      userId: participation.userId,
      entryType: 'credit',
      amount: participation.snapshotPointsReward,
      sourceType: 'challenge_participation',
      sourceId: participation.id,
      description: 'Challenge participation approved',
    });

    await this.evaluateBadges(tx, organizationId, participation.userId, participation.id);
  }

  private async applyRedemptionSideEffects(
    tx: DbExecutor,
    organizationId: string,
    entityId: string,
  ) {
    const redemption = await this.rewardsRepository.findRedemption(entityId);

    if (!redemption) {
      return;
    }

    const balanceResult = await this.ledgerRepository.getPointsBalance(
      tx,
      organizationId,
      redemption.userId,
    );

    const balance = Number(balanceResult[0]?.balance ?? 0);
    if (balance < redemption.snapshotPointsCost) {
      throw new BadRequestException('Insufficient points balance for redemption.');
    }

    await this.ledgerRepository.creditPoints(tx, {
      organizationId,
      userId: redemption.userId,
      entryType: 'debit',
      amount: redemption.snapshotPointsCost,
      sourceType: 'reward_redemption',
      sourceId: redemption.id,
      description: 'Reward redemption approved',
    });
  }

  private async evaluateBadges(
    tx: DbExecutor,
    organizationId: string,
    userId: string,
    sourceId: string,
  ) {
    const orgBadges = await this.ledgerRepository.listActiveBadges(organizationId);

    for (const badge of orgBadges) {
      const criteria = badge.criteriaJson as { type: string; threshold: number };

      if (criteria.type === 'csr_count') {
        const countResult = await this.ledgerRepository.countApprovedCsr(tx, organizationId, userId);
        const count = Number(countResult[0]?.count ?? 0);
        if (count >= criteria.threshold) {
          await this.ledgerRepository.awardBadge(tx, {
            organizationId,
            userId,
            badgeId: badge.id,
            triggeringSourceType: 'csr_activity',
            triggeringSourceId: sourceId,
          });
        }
      }

      if (criteria.type === 'carbon_count') {
        const countResult = await this.ledgerRepository.countApprovedCarbon(
          tx,
          organizationId,
          userId,
        );
        const count = Number(countResult[0]?.count ?? 0);
        if (count >= criteria.threshold) {
          await this.ledgerRepository.awardBadge(tx, {
            organizationId,
            userId,
            badgeId: badge.id,
            triggeringSourceType: 'carbon_transaction',
            triggeringSourceId: sourceId,
          });
        }
      }
    }
  }
}
