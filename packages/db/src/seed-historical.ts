import { eq } from 'drizzle-orm';
import { createDb } from './index.js';
import {
  organizations,
  departments,
  users,
  emissionFactors,
  carbonTransactions,
  carbonLedger,
  resourceConsumptionLedger,
  complianceIssues,
} from './schema/index.js';

const connectionString =
  process.env.DATABASE_URL ??
  'postgresql://ecosphere:ecosphere_secret@localhost:5433/ecosphere';

// Utility to generate a random number within a range
const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
// Utility to get a date for X months ago
const getPastDate = (monthsAgo: number, day: number = 15) => {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  d.setDate(day);
  return d;
};

async function seedHistorical() {
  const { db } = createDb(connectionString);

  console.log('Seeding Historical 12-Month ESG Data...');

  // 1. Get Organization
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, 'greentech-industries'),
  });

  if (!org) {
    throw new Error('Organization not found. Run the primary seed.ts first.');
  }

  // 2. Get User
  const user = await db.query.users.findFirst({
    where: eq(users.email, 'jainil@greentech.io'),
  });

  if (!user) {
    throw new Error('User not found. Run the primary seed.ts first.');
  }

  // 3. Get Departments
  const depts = await db.query.departments.findMany({
    where: eq(departments.organizationId, org.id),
  });

  if (!depts.length) {
    throw new Error('No departments found.');
  }

  // 4. Setup Emission Factors
  let electricityFactor = await db.query.emissionFactors.findFirst({
    where: eq(emissionFactors.name, 'Grid Electricity'),
  });

  if (!electricityFactor) {
    [electricityFactor] = await db.insert(emissionFactors).values({
      organizationId: org.id,
      name: 'Grid Electricity',
      category: 'Energy',
      scope: 'scope_2',
      unit: 'kWh',
      factorValue: '0.45', // 0.45 kg CO2e per kWh
      source: 'EPA eGRID 2024',
      effectiveFrom: new Date('2020-01-01'),
      createdById: user.id,
    }).returning();
  }

  let fuelFactor = await db.query.emissionFactors.findFirst({
    where: eq(emissionFactors.name, 'Diesel Fuel'),
  });

  if (!fuelFactor) {
    [fuelFactor] = await db.insert(emissionFactors).values({
      organizationId: org.id,
      name: 'Diesel Fuel',
      category: 'Stationary Combustion',
      scope: 'scope_1',
      unit: 'L',
      factorValue: '2.68', // 2.68 kg CO2e per Liter
      source: 'EPA GHG Hub',
      effectiveFrom: new Date('2020-01-01'),
      createdById: user.id,
    }).returning();
  }

  let travelFactor = await db.query.emissionFactors.findFirst({
    where: eq(emissionFactors.name, 'Air Travel (Short Haul)'),
  });

  if (!travelFactor) {
    [travelFactor] = await db.insert(emissionFactors).values({
      organizationId: org.id,
      name: 'Air Travel (Short Haul)',
      category: 'Business Travel',
      scope: 'scope_3',
      unit: 'km',
      factorValue: '0.15', // 0.15 kg CO2e per km
      source: 'EPA GHG Hub',
      effectiveFrom: new Date('2020-01-01'),
      createdById: user.id,
    }).returning();
  }

  // Generate 12 months of historical data
  for (let m = 11; m >= 0; m--) {
    const monthDate = getPastDate(m);
    console.log(`Generating data for month: ${monthDate.toISOString().substring(0, 7)}`);

    for (const dept of depts) {
      // Base multipliers for departments
      let deptMultiplier = 1.0;
      if (dept.name.includes('Manufacturing') || dept.name.includes('Operations')) {
        deptMultiplier = 3.5;
      } else if (dept.name.includes('Logistics')) {
        deptMultiplier = 2.0;
      }

      // Seasonality: higher in summer (months 5,6,7) and winter (months 0,1,11)
      const currentMonthIndex = monthDate.getMonth();
      const seasonMultiplier = (currentMonthIndex >= 5 && currentMonthIndex <= 7) ? 1.3 : 1.0;

      // 1. Carbon Transactions & Ledger
      const electricityQty = Math.round(randomInRange(5000, 15000) * deptMultiplier * seasonMultiplier);
      const fuelQty = Math.round(randomInRange(100, 1000) * deptMultiplier);
      const travelQty = Math.round(randomInRange(0, 5000) * (deptMultiplier > 2 ? 0.5 : 2.0)); // HR/Sales travel more

      const transactionsToInsert = [
        {
          organizationId: org.id,
          departmentId: dept.id,
          submittedById: user.id,
          scope: 'scope_2' as const,
          activityType: 'Electricity Use',
          quantity: electricityQty.toString(),
          unit: 'kWh',
          emissionFactorId: electricityFactor.id,
          snapshotFactorValue: electricityFactor.factorValue,
          snapshotFactorUnit: electricityFactor.unit,
          co2eKg: (electricityQty * Number(electricityFactor.factorValue)).toString(),
          activityDate: monthDate,
          status: 'approved' as const,
          description: `Monthly electricity for ${dept.name}`,
        },
        {
          organizationId: org.id,
          departmentId: dept.id,
          submittedById: user.id,
          scope: 'scope_1' as const,
          activityType: 'Backup Generator Fuel',
          quantity: fuelQty.toString(),
          unit: 'L',
          emissionFactorId: fuelFactor.id,
          snapshotFactorValue: fuelFactor.factorValue,
          snapshotFactorUnit: fuelFactor.unit,
          co2eKg: (fuelQty * Number(fuelFactor.factorValue)).toString(),
          activityDate: monthDate,
          status: 'approved' as const,
          description: `Monthly fuel usage for ${dept.name}`,
        },
        {
          organizationId: org.id,
          departmentId: dept.id,
          submittedById: user.id,
          scope: 'scope_3' as const,
          activityType: 'Business Flights',
          quantity: travelQty.toString(),
          unit: 'km',
          emissionFactorId: travelFactor.id,
          snapshotFactorValue: travelFactor.factorValue,
          snapshotFactorUnit: travelFactor.unit,
          co2eKg: (travelQty * Number(travelFactor.factorValue)).toString(),
          activityDate: monthDate,
          status: 'approved' as const,
          description: `Monthly air travel for ${dept.name}`,
        }
      ];

      const insertedTxns = await db.insert(carbonTransactions).values(transactionsToInsert).returning();

      // Mirror to Carbon Ledger
      const ledgerEntries = insertedTxns.map(txn => ({
        organizationId: org.id,
        departmentId: dept.id,
        userId: user.id,
        entryType: 'credit' as const,
        co2eKg: txn.co2eKg,
        sourceType: 'carbon_transaction',
        sourceId: txn.id,
        description: txn.description,
        recordedAt: txn.activityDate,
      }));
      await db.insert(carbonLedger).values(ledgerEntries);

      // 2. Resource Consumption
      const waterQty = Math.round(randomInRange(1000, 5000) * deptMultiplier);
      await db.insert(resourceConsumptionLedger).values([
        {
          organizationId: org.id,
          departmentId: dept.id,
          submittedById: user.id,
          resourceType: 'energy',
          quantity: electricityQty.toString(),
          unit: 'kWh',
          consumptionDate: monthDate,
          documentHash: `energy-${dept.id}-${m}`,
          status: 'approved',
        },
        {
          organizationId: org.id,
          departmentId: dept.id,
          submittedById: user.id,
          resourceType: 'water',
          quantity: waterQty.toString(),
          unit: 'L',
          consumptionDate: monthDate,
          documentHash: `water-${dept.id}-${m}`,
          status: 'approved',
        }
      ]);

      // 3. Compliance Issues
      // Generate 0-2 issues per month per dept
      const numIssues = Math.floor(Math.random() * 3);
      for (let i = 0; i < numIssues; i++) {
        const isResolved = m > 2; // Older issues are resolved, newer might be open
        const severity = Math.random() > 0.8 ? 'high' : (Math.random() > 0.5 ? 'medium' : 'low');
        
        await db.insert(complianceIssues).values({
          organizationId: org.id,
          departmentId: dept.id,
          title: `Audit finding in ${dept.name} - ${severity} risk`,
          description: `Automatically generated historical compliance issue for testing.`,
          severity,
          status: isResolved ? 'resolved' : 'open',
          createdById: user.id,
          createdAt: monthDate,
          updatedAt: isResolved ? new Date(monthDate.getTime() + 86400000 * 5) : monthDate,
        });
      }
    }
  }

  console.log('Successfully seeded 12 months of historical ESG data!');
  process.exit(0);
}

seedHistorical().catch((err) => {
  console.error('Error seeding historical data:', err);
  process.exit(1);
});
