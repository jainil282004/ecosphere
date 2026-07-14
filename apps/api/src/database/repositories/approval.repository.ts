import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, isNull } from 'drizzle-orm';
import {
  approvals,
  carbonTransactions,
  challengeParticipations,
  csrActivities,
  rewardRedemptions,
} from '@ecosphere/db';
import type { Database, DbExecutor } from '@ecosphere/db';
import type { ApprovalEntityType } from '@ecosphere/shared';
import { DATABASE } from '../database.module';
import { BaseRepository } from './base.repository';
import { DomainRepository } from './domain.repository';

@Injectable()
export class ApprovalRepository extends BaseRepository {
  constructor(
    @Inject(DATABASE) db: Database,
    private readonly domainRepository: DomainRepository,
  ) {
    super(db);
  }
  upsertApproval(values: typeof approvals.$inferInsert) {
    return this.db
      .insert(approvals)
      .values(values)
      .onConflictDoUpdate({
        target: [approvals.entityType, approvals.entityId],
        set: {
          status: 'submitted',
          submittedById: values.submittedById,
          submittedAt: new Date(),
          decidedById: null,
          decidedAt: null,
          approverRole: null,
          decisionComment: null,
          sideEffectsAppliedAt: null,
          updatedAt: new Date(),
        },
      })
      .returning();
  }

  listPending(orgId: string) {
    return this.db.query.approvals.findMany({
      where: and(eq(approvals.organizationId, orgId), eq(approvals.status, 'submitted')),
      orderBy: [desc(approvals.submittedAt)],
    });
  }

  findById(orgId: string, approvalId: string) {
    return this.db.query.approvals.findFirst({
      where: and(eq(approvals.id, approvalId), eq(approvals.organizationId, orgId)),
    });
  }

  findByIdForUpdate(approvalId: string) {
    return this.db.query.approvals.findFirst({
      where: eq(approvals.id, approvalId),
    });
  }

  updateDecision(
    approvalId: string,
    values: {
      status: 'approved' | 'rejected';
      decidedById: string;
      decidedAt: Date;
      approverRole: typeof approvals.$inferInsert.approverRole;
      decisionComment: string | null;
    },
  ) {
    return this.db
      .update(approvals)
      .set({
        ...values,
        updatedAt: new Date(),
      })
      .where(eq(approvals.id, approvalId))
      .returning();
  }

  markSideEffectsApplied(executor: DbExecutor, approvalId: string) {
    return executor
      .update(approvals)
      .set({ sideEffectsAppliedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(approvals.id, approvalId), isNull(approvals.sideEffectsAppliedAt)));
  }

  updateEntityStatus(entityType: ApprovalEntityType, entityId: string, status: 'approved' | 'rejected') {
    switch (entityType) {
      case 'csr_activity':
        return this.db
          .update(csrActivities)
          .set({ status, updatedAt: new Date() })
          .where(eq(csrActivities.id, entityId));
      case 'carbon_transaction':
        return this.db
          .update(carbonTransactions)
          .set({ status, updatedAt: new Date() })
          .where(eq(carbonTransactions.id, entityId));
      case 'challenge_participation':
        return this.db
          .update(challengeParticipations)
          .set({ status, updatedAt: new Date() })
          .where(eq(challengeParticipations.id, entityId));
      case 'reward_redemption':
        return this.db
          .update(rewardRedemptions)
          .set({ status, updatedAt: new Date() })
          .where(eq(rewardRedemptions.id, entityId));
      case 'resource_consumption':
        return this.domainRepository.updateResourceConsumptionStatus(entityId, status);
      case 'framework_metric':
        return this.domainRepository.updateFrameworkSubmissionStatus(entityId, status);
      case 'dei_snapshot':
        return this.domainRepository.updateDeiSnapshotStatus(entityId, status);
      default:
        return Promise.resolve();
    }
  }

  findEntitySummary(entityType: ApprovalEntityType, entityId: string) {
    switch (entityType) {
      case 'csr_activity':
        return this.db.query.csrActivities.findFirst({ where: eq(csrActivities.id, entityId) });
      case 'carbon_transaction':
        return this.db.query.carbonTransactions.findFirst({
          where: eq(carbonTransactions.id, entityId),
        });
      case 'challenge_participation':
        return this.db.query.challengeParticipations.findFirst({
          where: eq(challengeParticipations.id, entityId),
        });
      case 'reward_redemption':
        return this.db.query.rewardRedemptions.findFirst({
          where: eq(rewardRedemptions.id, entityId),
        });
      case 'resource_consumption':
      case 'framework_metric':
      case 'dei_snapshot':
        return this.domainRepository.findEntityForApproval(entityType, entityId);
      default:
        return Promise.resolve(null);
    }
  }
}
