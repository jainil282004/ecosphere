import type {
  CarbonCalculationResponse,
  Scope1ActivityInput,
  Scope2ActivityInput,
  Scope3ActivityInput,
} from '../schemas/carbon.js';

const KG_PER_TONNE = 1000;

function roundCo2e(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

function buildResponse(
  scope: CarbonCalculationResponse['scope'],
  activityType: string,
  co2eKg: number,
  formula: string,
  method: string,
  breakdown: CarbonCalculationResponse['breakdown'],
  emissionFactorSource: string,
): CarbonCalculationResponse {
  return {
    scope,
    activityType,
    co2eKg: roundCo2e(co2eKg),
    co2eTonnes: roundCo2e(co2eKg / KG_PER_TONNE),
    formula,
    method,
    breakdown,
    emissionFactorSource,
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Scope 1 — GHG Protocol direct emissions.
 * CO2e (kg) = Activity Data × Emission Factor (kg CO2e / unit)
 * GWP applied at factor publication time (AR4/AR5/AR6 noted in audit trail).
 */
export function calculateScope1Emissions(input: Scope1ActivityInput): CarbonCalculationResponse {
  const co2eKg = input.quantity * input.emissionFactorKgPerUnit;

  return buildResponse(
    'scope_1',
    input.activityType,
    co2eKg,
    'CO2e_kg = quantity × emission_factor_kg_per_unit',
    `direct_${input.activityType}`,
    [
      { label: 'Activity quantity', value: input.quantity, unit: input.unit },
      {
        label: 'Emission factor',
        value: input.emissionFactorKgPerUnit,
        unit: `kg CO2e / ${input.unit}`,
      },
    ],
    input.emissionFactorSource,
  );
}

/**
 * Scope 2 — GHG Protocol indirect energy emissions.
 * Location-based: CO2e = kWh × grid_EF × (1 + T&D_loss_rate)
 * Market-based: CO2e = (kWh - REC_offset) × residual_grid_EF × (1 + T&D_loss_rate)
 */
export function calculateScope2Emissions(input: Scope2ActivityInput): CarbonCalculationResponse {
  const tdMultiplier = 1 + input.transmissionDistributionLossRate;
  const recKwh = input.renewableEnergyCertificatesMwh * 1000;
  const netKwh = Math.max(0, input.quantityKwh - recKwh);

  let co2eKg: number;
  let method: string;
  let formula: string;

  if (input.calculationMethod === 'market_based' && recKwh > 0) {
    co2eKg = netKwh * input.gridEmissionFactorKgPerKwh * tdMultiplier;
    method = 'market_based_with_rec_adjustment';
    formula =
      'CO2e_kg = max(0, kWh - REC_kWh) × grid_EF × (1 + T&D_loss_rate)';
  } else {
    co2eKg = input.quantityKwh * input.gridEmissionFactorKgPerKwh * tdMultiplier;
    method = 'location_based';
    formula = 'CO2e_kg = kWh × grid_EF × (1 + T&D_loss_rate)';
  }

  return buildResponse(
    'scope_2',
    input.activityType,
    co2eKg,
    formula,
    method,
    [
      { label: 'Electricity consumed', value: input.quantityKwh, unit: 'kWh' },
      {
        label: 'Grid emission factor',
        value: input.gridEmissionFactorKgPerKwh,
        unit: 'kg CO2e / kWh',
      },
      {
        label: 'T&D loss rate',
        value: input.transmissionDistributionLossRate,
        unit: 'ratio',
      },
      { label: 'REC offset', value: recKwh, unit: 'kWh' },
      { label: 'Net billable kWh', value: netKwh, unit: 'kWh' },
    ],
    input.emissionFactorSource,
  );
}

/**
 * Scope 3 — Value chain emissions.
 * Air travel: CO2e = distance × EF × RFI (radiative forcing index)
 * Other: CO2e = activity × emission factor
 */
export function calculateScope3Emissions(input: Scope3ActivityInput): CarbonCalculationResponse {
  let co2eKg: number;
  let formula: string;
  let method: string;

  if (input.activityType === 'business_travel_air') {
    co2eKg =
      input.quantity * input.emissionFactorKgPerUnit * input.radiativeForcingIndex;
    formula = 'CO2e_kg = distance_km × EF_kg_per_km × RFI';
    method = 'distance_based_with_rfi';
  } else {
    co2eKg = input.quantity * input.emissionFactorKgPerUnit;
    formula = 'CO2e_kg = quantity × emission_factor_kg_per_unit';
    method = 'activity_based';
  }

  const breakdown: CarbonCalculationResponse['breakdown'] = [
    { label: 'Activity quantity', value: input.quantity, unit: input.unit },
    {
      label: 'Emission factor',
      value: input.emissionFactorKgPerUnit,
      unit: `kg CO2e / ${input.unit}`,
    },
  ];

  if (input.activityType === 'business_travel_air') {
    breakdown.push({
      label: 'Radiative forcing index',
      value: input.radiativeForcingIndex,
      unit: 'multiplier',
    });
  }

  return buildResponse(
    'scope_3',
    input.activityType,
    co2eKg,
    formula,
    method,
    breakdown,
    input.emissionFactorSource,
  );
}

export function calculateFromStoredFactor(
  scope: 'scope_1' | 'scope_2' | 'scope_3',
  activityType: string,
  quantity: number,
  unit: string,
  factorValue: number,
  factorUnit: string,
  source: string,
  options?: {
    transmissionDistributionLossRate?: number;
    radiativeForcingIndex?: number;
    calculationMethod?: 'location_based' | 'market_based';
  },
): CarbonCalculationResponse {
  if (unit !== factorUnit && scope !== 'scope_2') {
    throw new Error(
      `Unit mismatch: activity unit "${unit}" does not match emission factor unit "${factorUnit}".`,
    );
  }

  switch (scope) {
    case 'scope_1':
      return calculateScope1Emissions({
        scope: 'scope_1',
        activityType: mapToScope1ActivityType(activityType),
        quantity,
        unit,
        emissionFactorKgPerUnit: factorValue,
        emissionFactorSource: source,
        gwpTimeHorizon: 'AR6',
      });
    case 'scope_2':
      return calculateScope2Emissions({
        scope: 'scope_2',
        activityType: 'purchased_electricity',
        quantityKwh: quantity,
        gridEmissionFactorKgPerKwh: factorValue,
        calculationMethod: options?.calculationMethod ?? 'location_based',
        transmissionDistributionLossRate: options?.transmissionDistributionLossRate ?? 0.05,
        renewableEnergyCertificatesMwh: 0,
        emissionFactorSource: source,
      });
    case 'scope_3':
      return calculateScope3Emissions({
        scope: 'scope_3',
        activityType: mapToScope3ActivityType(activityType),
        quantity,
        unit,
        emissionFactorKgPerUnit: factorValue,
        radiativeForcingIndex: options?.radiativeForcingIndex ?? 1.9,
        emissionFactorSource: source,
      });
    default:
      throw new Error(`Unsupported scope: ${scope as string}`);
  }
}

function mapToScope1ActivityType(
  activityType: string,
): Scope1ActivityInput['activityType'] {
  const normalized = activityType.toLowerCase();
  if (normalized.includes('mobile') || normalized.includes('fleet')) {
    return 'mobile_combustion';
  }
  if (normalized.includes('process')) {
    return 'process_emissions';
  }
  if (normalized.includes('fugitive')) {
    return 'fugitive_emissions';
  }
  return 'stationary_combustion';
}

function mapToScope3ActivityType(
  activityType: string,
): Scope3ActivityInput['activityType'] {
  const normalized = activityType.toLowerCase();
  if (normalized.includes('air') || normalized.includes('flight')) {
    return 'business_travel_air';
  }
  if (normalized.includes('commut')) {
    return 'employee_commuting';
  }
  if (normalized.includes('transport') || normalized.includes('logistics')) {
    return 'upstream_transport';
  }
  if (normalized.includes('waste')) {
    return 'waste_generated';
  }
  if (normalized.includes('travel') || normalized.includes('road')) {
    return 'business_travel_road';
  }
  return 'purchased_goods_services';
}
