import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { auditLogs, carbonTransactions } from '@ecosphere/db';
import type { DbExecutor } from '@ecosphere/db';
import { BaseRepository } from './base.repository';

export interface LogEnvironmentalMetricPersistenceInput {
  transaction: typeof carbonTransactions.$inferInsert;
  audit: {
    organizationId: string;
    actorUserId: string;
    action: string;
    entityType: string;
    metadata: Record<string, unknown>;
    ipAddress: string | null;
  };
}

export interface LogEnvironmentalMetricPersistenceResult {
  transaction: typeof carbonTransactions.$inferSelect;
  auditLogId: string;
  integrityHash: string;
}

@Injectable()
export class EnvironmentalRepository extends BaseRepository {
  /**
   * Atomically persists the carbon metric row and an append-only audit_logs entry.
   * Both writes succeed or both roll back — compliance trail cannot exist without the metric.
   */
  logEnvironmentalMetric(
    input: LogEnvironmentalMetricPersistenceInput,
  ): Promise<LogEnvironmentalMetricPersistenceResult> {
    const integrityHash = createHash('sha256')
      .update(
        JSON.stringify({
          transaction: {
            organizationId: input.transaction.organizationId,
            departmentId: input.transaction.departmentId,
            submittedById: input.transaction.submittedById,
            scope: input.transaction.scope,
            activityType: input.transaction.activityType,
            quantity: input.transaction.quantity,
            unit: input.transaction.unit,
            co2eKg: input.transaction.co2eKg,
            emissionFactorId: input.transaction.emissionFactorId,
            snapshotFactorValue: input.transaction.snapshotFactorValue,
            activityDate: input.transaction.activityDate,
          },
          calculation: input.audit.metadata.calculation,
        }),
      )
      .digest('hex');

    return this.transaction(async (tx: DbExecutor) => {
      const [transaction] = await tx
        .insert(carbonTransactions)
        .values(input.transaction)
        .returning();

      if (!transaction) {
        throw new Error('Failed to insert carbon transaction.');
      }

      const [auditRow] = await tx
        .insert(auditLogs)
        .values({
          organizationId: input.audit.organizationId,
          actorUserId: input.audit.actorUserId,
          action: input.audit.action,
          entityType: input.audit.entityType,
          entityId: transaction.id,
          metadata: {
            ...input.audit.metadata,
            integrityHash,
            pipeline: 'environmental_metric_logging',
          },
          ipAddress: input.audit.ipAddress,
        })
        .returning({ id: auditLogs.id });

      if (!auditRow) {
        throw new Error('Failed to insert compliance audit log.');
      }

      return {
        transaction,
        auditLogId: auditRow.id,
        integrityHash,
      };
    });
  }
}
