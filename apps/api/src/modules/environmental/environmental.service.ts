import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  createCarbonTransactionWithCalculationSchema,
  createEmissionFactorSchema,
  createResourceConsumptionSchema,
  paginationSchema,
} from '@ecosphere/shared';
import { ActivityRepository } from '../../database/repositories/activity.repository';
import { DomainRepository } from '../../database/repositories/domain.repository';
import { ApprovalsService } from '../approvals/approvals.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CarbonFootprintService } from './carbon-footprint.service';
import { CarbonVerificationService } from './carbon-verification.service';

@Injectable()
export class EnvironmentalService {
  constructor(
    private readonly activityRepository: ActivityRepository,
    private readonly domainRepository: DomainRepository,
    private readonly carbonFootprintService: CarbonFootprintService,
    private readonly carbonVerificationService: CarbonVerificationService,
    private readonly approvalsService: ApprovalsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  listEmissionFactors(orgId: string, scope?: string) {
    return this.activityRepository.listEmissionFactors(orgId, scope);
  }

  async createEmissionFactor(orgId: string, userId: string, body: unknown) {
    const input = createEmissionFactorSchema.parse(body);
    const [factor] = await this.activityRepository.createEmissionFactor({
      organizationId: orgId,
      name: input.name,
      category: input.category,
      scope: input.scope,
      unit: input.unit,
      factorValue: input.factorValue.toString(),
      effectiveFrom: new Date(input.effectiveFrom),
      effectiveTo: input.effectiveTo ? new Date(input.effectiveTo) : null,
      source: input.source,
      createdById: userId,
    });
    return factor;
  }

  async listCarbonTransactions(orgId: string, query: unknown) {
    const { page, limit } = paginationSchema.parse(query);
    const parsedQuery = query as Record<string, string | undefined>;
    const rows = await this.activityRepository.listCarbonTransactions(
      orgId,
      limit,
      (page - 1) * limit,
      parsedQuery.scope,
    );
    return { data: rows, meta: { page, limit, total: rows.length, totalPages: 1 } };
  }

  calculateCarbon(body: unknown) {
    return this.carbonFootprintService.calculate(body);
  }

  verifyDocument(orgId: string, body: unknown) {
    return this.carbonVerificationService.verifyDocument(orgId, body);
  }

  getFootprintSummary(orgId: string) {
    return this.carbonFootprintService.getFootprintSummary(orgId);
  }

  async createCarbonTransaction(orgId: string, userId: string, body: unknown) {
    const input = createCarbonTransactionWithCalculationSchema.parse(body);

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

    const { calculation, emissionFactorId, co2eKg } =
      await this.carbonFootprintService.calculateFromEmissionFactor(orgId, body);

    const factor = await this.activityRepository.findEmissionFactor(orgId, emissionFactorId);
    if (!factor) {
      throw new NotFoundException('Emission factor not found.');
    }

    const [transaction] = await this.activityRepository.createCarbonTransaction({
      organizationId: orgId,
      departmentId: input.departmentId,
      submittedById: userId,
      scope: factor.scope,
      activityType: input.activityType,
      quantity: input.quantity.toString(),
      unit: input.unit,
      emissionFactorId: factor.id,
      snapshotFactorValue: factor.factorValue,
      snapshotFactorUnit: factor.unit,
      co2eKg,
      activityDate: new Date(input.activityDate),
      description: input.description ?? null,
      evidenceFileKey: input.evidenceFileKey ?? null,
      status: 'submitted',
    });

    if (!transaction) {
      throw new BadRequestException('Failed to create carbon transaction.');
    }

    await this.approvalsService.createApprovalRecord(
      orgId,
      'carbon_transaction',
      transaction.id,
      userId,
    );

    await this.notificationsService.createNotification({
      organizationId: orgId,
      userId,
      type: 'approval_required',
      title: 'Carbon transaction submitted',
      body: `Submitted ${calculation.co2eKg} kg CO2e (${calculation.scope}) for approval.`,
      entityType: 'carbon_transaction',
      entityId: transaction.id,
    });

    return { transaction, calculation };
  }

  async getCarbonTransaction(orgId: string, id: string) {
    const transaction = await this.activityRepository.findCarbonTransaction(orgId, id);
    if (!transaction) {
      throw new NotFoundException('Carbon transaction not found.');
    }
    return transaction;
  }

  listEmissions(orgId: string, query: unknown) {
    return this.listCarbonTransactions(orgId, query);
  }

  getScopeBreakdown(orgId: string) {
    return this.domainRepository.getCarbonScopeBreakdown(orgId);
  }

  getScopeTotals(orgId: string) {
    return this.domainRepository.getScopeTotals(orgId);
  }

  listResourceConsumption(orgId: string, resourceType?: string) {
    return this.domainRepository.listResourceConsumption(
      orgId,
      resourceType as 'energy' | 'water' | undefined,
    );
  }

  async createResourceConsumption(orgId: string, userId: string, body: unknown) {
    const input = createResourceConsumptionSchema.parse(body);

    const verification = await this.carbonVerificationService.verifyDocument(orgId, {
      documentHash: input.documentHash,
      documentFileKey: input.documentFileKey,
      resourceType: input.resourceType,
    });

    if (verification.verificationStatus !== 'verified') {
      throw new BadRequestException(verification.message);
    }

    const [entry] = await this.domainRepository.createResourceConsumption({
      organizationId: orgId,
      departmentId: input.departmentId,
      submittedById: userId,
      resourceType: input.resourceType,
      quantity: input.quantity.toString(),
      unit: input.unit,
      consumptionDate: new Date(input.consumptionDate),
      documentHash: input.documentHash.toLowerCase(),
      documentFileKey: input.documentFileKey ?? null,
      description: input.description ?? null,
      status: 'submitted',
    });

    if (!entry) {
      throw new BadRequestException('Failed to create resource consumption entry.');
    }

    await this.approvalsService.createApprovalRecord(
      orgId,
      'resource_consumption',
      entry.id,
      userId,
    );

    return { entry, verification };
  }
}
