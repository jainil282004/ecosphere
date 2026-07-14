import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  calculateScope1Emissions,
  calculateScope2Emissions,
  calculateScope3Emissions,
  environmentalMetricLogResponseSchema,
  logEnvironmentalMetricSchema,
  type CarbonCalculationResponse,
  type LogEnvironmentalMetricInput,
} from '@ecosphere/shared';
import { ActivityRepository } from '../../database/repositories/activity.repository';
import { EnvironmentalRepository } from '../../database/repositories/environmental.repository';
import { ApprovalsService } from '../approvals/approvals.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CarbonVerificationService } from './carbon-verification.service';

@Injectable()
export class EnvironmentalMetricService {
  constructor(
    private readonly activityRepository: ActivityRepository,
    private readonly environmentalRepository: EnvironmentalRepository,
    private readonly carbonVerificationService: CarbonVerificationService,
    private readonly approvalsService: ApprovalsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Environmental Metric Logging pipeline (Step 3):
   * 1. Zod validation (scope-specific)
   * 2. Scientific CO2e calculation (kg → metric tonnes in response)
   * 3. Atomic persistence: carbon_transactions + audit_logs
   */
  async logMetric(
    orgId: string,
    userId: string,
    body: unknown,
    ipAddress?: string | null,
  ) {
    const input = logEnvironmentalMetricSchema.parse(body);

    if (input.evidenceDocumentHash) {
      const verification = await this.carbonVerificationService.verifyDocument(orgId, {
        documentHash: input.evidenceDocumentHash,
        documentFileKey: input.evidenceFileKey,
        resourceType: 'carbon_evidence',
      });
      if (verification.verificationStatus !== 'verified') {
        throw new BadRequestException(verification.message);
      }
    }

    const factor = await this.activityRepository.findEmissionFactor(orgId, input.emissionFactorId);
    if (!factor) {
      throw new NotFoundException('Emission factor not found for this organization.');
    }

    if (factor.scope !== input.scope) {
      throw new BadRequestException(
        `Scope mismatch: metric is ${input.scope} but emission factor is ${factor.scope}.`,
      );
    }

    const calculation = this.calculateForLogInput(input, factor);

    const { quantity, unit, activityType } = this.resolveStoredActivityFields(input);

    const persisted = await this.environmentalRepository.logEnvironmentalMetric({
      transaction: {
        organizationId: orgId,
        departmentId: input.departmentId,
        submittedById: userId,
        scope: factor.scope,
        activityType,
        quantity: quantity.toString(),
        unit,
        emissionFactorId: factor.id,
        snapshotFactorValue: factor.factorValue,
        snapshotFactorUnit: factor.unit,
        co2eKg: calculation.co2eKg.toFixed(4),
        activityDate: new Date(input.activityDate),
        description: input.description ?? null,
        evidenceFileKey: input.evidenceFileKey ?? null,
        status: 'submitted',
      },
      audit: {
        organizationId: orgId,
        actorUserId: userId,
        action: 'ENVIRONMENTAL_METRIC_LOGGED',
        entityType: 'carbon_transaction',
        metadata: {
          scope: input.scope,
          calculation,
          emissionFactor: {
            id: factor.id,
            name: factor.name,
            source: factor.source,
            factorValue: factor.factorValue,
            unit: factor.unit,
          },
          evidenceDocumentHash: input.evidenceDocumentHash ?? null,
        },
        ipAddress: ipAddress ?? null,
      },
    });

    await this.approvalsService.createApprovalRecord(
      orgId,
      'carbon_transaction',
      persisted.transaction.id,
      userId,
    );

    await this.notificationsService.createNotification({
      organizationId: orgId,
      userId,
      type: 'approval_required',
      title: 'Environmental metric submitted',
      body: `Logged ${calculation.co2eTonnes} tCO2e (${calculation.scope}) — pending approval.`,
      entityType: 'carbon_transaction',
      entityId: persisted.transaction.id,
    });

    return environmentalMetricLogResponseSchema.parse({
      transaction: {
        id: persisted.transaction.id,
        organizationId: persisted.transaction.organizationId,
        scope: persisted.transaction.scope,
        co2eKg: persisted.transaction.co2eKg,
        status: persisted.transaction.status,
      },
      calculation,
      auditLogId: persisted.auditLogId,
      integrityHash: persisted.integrityHash,
    });
  }

  private calculateForLogInput(
    input: LogEnvironmentalMetricInput,
    factor: { factorValue: string; unit: string; source: string; scope: 'scope_1' | 'scope_2' | 'scope_3' },
  ): CarbonCalculationResponse {
    const factorValue = Number(factor.factorValue);

    switch (input.scope) {
      case 'scope_1':
        this.assertScope1Units(input.unit, factor.unit);
        return calculateScope1Emissions({
          scope: 'scope_1',
          activityType: this.mapScope1ActivityType(input.activityType),
          quantity: input.quantity,
          unit: input.unit,
          emissionFactorKgPerUnit: factorValue,
          emissionFactorSource: factor.source,
          gwpTimeHorizon: input.gwpTimeHorizon,
        });

      case 'scope_2':
        return calculateScope2Emissions({
          scope: 'scope_2',
          activityType: input.activityType,
          quantityKwh: input.quantityKwh,
          gridEmissionFactorKgPerKwh: factorValue,
          calculationMethod: input.calculationMethod,
          transmissionDistributionLossRate: input.transmissionDistributionLossRate,
          renewableEnergyCertificatesMwh: input.renewableEnergyCertificatesMwh,
          emissionFactorSource: factor.source,
        });

      case 'scope_3':
        if (input.unit !== factor.unit) {
          throw new BadRequestException(
            `Unit mismatch for Scope 3: activity "${input.unit}" vs factor "${factor.unit}".`,
          );
        }
        return calculateScope3Emissions({
          scope: 'scope_3',
          activityType: input.activityType,
          quantity: input.quantity,
          unit: input.unit,
          emissionFactorKgPerUnit: factorValue,
          radiativeForcingIndex: input.radiativeForcingIndex,
          emissionFactorSource: factor.source,
        });

      default:
        throw new BadRequestException('Unsupported carbon scope.');
    }
  }

  private resolveStoredActivityFields(input: LogEnvironmentalMetricInput): {
    quantity: number;
    unit: string;
    activityType: string;
  } {
    if (input.scope === 'scope_2') {
      return {
        quantity: input.quantityKwh,
        unit: 'kWh',
        activityType: input.activityType,
      };
    }

    return {
      quantity: input.quantity,
      unit: input.unit,
      activityType: input.activityType,
    };
  }

  private assertScope1Units(activityUnit: string, factorUnit: string): void {
    const normalizedActivity = activityUnit.toLowerCase();
    const normalizedFactor = factorUnit.toLowerCase();

    if (normalizedActivity !== normalizedFactor && normalizedActivity !== 'liter' && normalizedFactor !== 'liters') {
      if (!(normalizedActivity === 'liters' && normalizedFactor === 'l')) {
        throw new BadRequestException(
          `Scope 1 unit mismatch: activity "${activityUnit}" vs emission factor "${factorUnit}".`,
        );
      }
    }
  }

  private mapScope1ActivityType(
    activityType: string,
  ): 'stationary_combustion' | 'mobile_combustion' | 'process_emissions' | 'fugitive_emissions' {
    if (activityType === 'diesel_combustion' || activityType === 'mobile_combustion') {
      return 'mobile_combustion';
    }
    if (activityType === 'natural_gas_combustion' || activityType === 'stationary_combustion') {
      return 'stationary_combustion';
    }
    if (activityType === 'process_emissions') {
      return 'process_emissions';
    }
    if (activityType === 'fugitive_emissions') {
      return 'fugitive_emissions';
    }
    return 'stationary_combustion';
  }
}
