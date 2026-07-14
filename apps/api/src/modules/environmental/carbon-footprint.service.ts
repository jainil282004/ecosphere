import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  calculateCarbonRequestSchema,
  calculateFromStoredFactor,
  calculateScope1Emissions,
  calculateScope2Emissions,
  calculateScope3Emissions,
  carbonFootprintSummarySchema,
  createCarbonTransactionWithCalculationSchema,
  type CarbonCalculationResponse,
  type CarbonFootprintSummary,
} from '@ecosphere/shared';
import { ActivityRepository } from '../../database/repositories/activity.repository';
import { DomainRepository } from '../../database/repositories/domain.repository';

@Injectable()
export class CarbonFootprintService {
  constructor(
    private readonly activityRepository: ActivityRepository,
    private readonly domainRepository: DomainRepository,
  ) {}

  calculate(input: unknown): CarbonCalculationResponse {
    const parsed = calculateCarbonRequestSchema.parse(input);

    switch (parsed.scope) {
      case 'scope_1':
        return calculateScope1Emissions(parsed);
      case 'scope_2':
        return calculateScope2Emissions(parsed);
      case 'scope_3':
        return calculateScope3Emissions(parsed);
      default:
        throw new BadRequestException('Unsupported carbon scope.');
    }
  }

  async calculateFromEmissionFactor(
    orgId: string,
    body: unknown,
  ): Promise<{
    calculation: CarbonCalculationResponse;
    emissionFactorId: string;
    co2eKg: string;
  }> {
    const input = createCarbonTransactionWithCalculationSchema.parse(body);

    const factor = await this.activityRepository.findEmissionFactor(
      orgId,
      input.emissionFactorId,
    );

    if (!factor) {
      throw new NotFoundException('Emission factor not found.');
    }

    if (input.unit !== factor.unit && factor.scope !== 'scope_2') {
      throw new BadRequestException(
        `Unit mismatch: activity "${input.unit}" vs factor "${factor.unit}".`,
      );
    }

    const calculation = calculateFromStoredFactor(
      factor.scope,
      input.activityType,
      input.quantity,
      input.unit,
      Number(factor.factorValue),
      factor.unit,
      factor.source,
      {
        transmissionDistributionLossRate: input.transmissionDistributionLossRate,
        radiativeForcingIndex: input.radiativeForcingIndex,
      },
    );

    return {
      calculation,
      emissionFactorId: factor.id,
      co2eKg: calculation.co2eKg.toFixed(4),
    };
  }

  async getFootprintSummary(orgId: string): Promise<CarbonFootprintSummary> {
    const scopeTotals = await this.domainRepository.getScopeTotals(orgId);
    const breakdown = await this.domainRepository.getCarbonScopeBreakdown(orgId);

    let scope1 = 0;
    let scope2 = 0;
    let scope3 = 0;

    for (const row of scopeTotals) {
      const total = Number(row.total);
      if (row.scope === 'scope_1') scope1 = total;
      if (row.scope === 'scope_2') scope2 = total;
      if (row.scope === 'scope_3') scope3 = total;
    }

    if (breakdown) {
      scope1 = Number(breakdown.scope1Kg);
      scope2 = Number(breakdown.scope2Kg);
      scope3 = Number(breakdown.scope3Kg);
    }

    const totalKg = scope1 + scope2 + scope3;

    return carbonFootprintSummarySchema.parse({
      organizationId: orgId,
      periodStart: breakdown?.periodStart?.toISOString() ?? null,
      periodEnd: breakdown?.periodEnd?.toISOString() ?? null,
      scope1Kg: scope1,
      scope2Kg: scope2,
      scope3Kg: scope3,
      totalKg,
      totalTonnes: totalKg / 1000,
      transactionCount: scopeTotals.length,
      calculatedAt: new Date().toISOString(),
    });
  }
}
