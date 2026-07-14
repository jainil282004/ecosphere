import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { createDb } from './index.js';
import {
  badges,
  carbonTransactions,
  challenges,
  csrActivities,
  departments,
  emissionFactors,
  esgWeightages,
  frameworkMappings,
  organizations,
  participationStreaks,
  pointsLedger,
  policies,
  resourceConsumptionLedger,
  rewardInventory,
  rewards,
  userRoles,
  users,
  xpLedger,
} from './schema/index.js';

const connectionString =
  process.env.DATABASE_URL ??
  'postgresql://ecosphere:ecosphere_secret@localhost:5432/ecosphere';

async function seed() {
  const { db, client } = createDb(connectionString);

  console.log('Seeding EcoSphere database...');

  const passwordHash = await bcrypt.hash('Password123!', 12);

  const [superAdmin] = await db
    .insert(users)
    .values({
      email: 'superadmin@ecosphere.io',
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
    })
    .onConflictDoNothing({ target: users.email })
    .returning();

  const existingSuperAdmin =
    superAdmin ??
    (await db.query.users.findFirst({
      where: eq(users.email, 'superadmin@ecosphere.io'),
    }));

  if (!existingSuperAdmin) {
    throw new Error('Failed to create or locate super admin user.');
  }

  await db
    .insert(userRoles)
    .values({
      userId: existingSuperAdmin.id,
      role: 'super_admin',
      organizationId: null,
      departmentId: null,
    })
    .onConflictDoNothing();

  const [organization] = await db
    .insert(organizations)
    .values({
      name: 'GreenTech Industries',
      slug: 'greentech-industries',
      industry: 'Technology',
      country: 'India',
    })
    .onConflictDoNothing({ target: organizations.slug })
    .returning();

  const existingOrg =
    organization ??
    (await db.query.organizations.findFirst({
      where: eq(organizations.slug, 'greentech-industries'),
    }));

  if (!existingOrg) {
    throw new Error('Failed to create or locate demo organization.');
  }

  const orgUsers = [
    {
      email: 'orgadmin@greentech.io',
      firstName: 'Olivia',
      lastName: 'Admin',
      role: 'org_admin' as const,
      departmentCode: null,
    },
    {
      email: 'esgmanager@greentech.io',
      firstName: 'Ethan',
      lastName: 'Manager',
      role: 'esg_manager' as const,
      departmentCode: null,
    },
    {
      email: 'depthead@greentech.io',
      firstName: 'Diana',
      lastName: 'Head',
      role: 'dept_head' as const,
      departmentCode: 'ENG',
    },
    {
      email: 'auditor@greentech.io',
      firstName: 'Alice',
      lastName: 'Auditor',
      role: 'auditor' as const,
      departmentCode: null,
    },
    {
      email: 'employee@greentech.io',
      firstName: 'Emma',
      lastName: 'Employee',
      role: 'employee' as const,
      departmentCode: 'ENG',
    },
    {
      email: 'priya@greentech.io',
      firstName: 'Priya',
      lastName: 'Sharma',
      role: 'employee' as const,
      departmentCode: 'OPS',
    },
    {
      email: 'rahul@greentech.io',
      firstName: 'Rahul',
      lastName: 'Mehta',
      role: 'employee' as const,
      departmentCode: 'ENG',
    },
    {
      email: 'sara@greentech.io',
      firstName: 'Sara',
      lastName: 'Khan',
      role: 'employee' as const,
      departmentCode: 'HR',
    },
    {
      email: 'michael@greentech.io',
      firstName: 'Michael',
      lastName: 'Dsouza',
      role: 'employee' as const,
      departmentCode: 'ENG',
    },
    {
      email: 'anita@greentech.io',
      firstName: 'Anita',
      lastName: 'Roy',
      role: 'employee' as const,
      departmentCode: 'OPS',
    },
    {
      email: 'vikram@greentech.io',
      firstName: 'Vikram',
      lastName: 'Patel',
      role: 'employee' as const,
      departmentCode: 'HR',
    },
  ];

  const departmentRows = await db
    .insert(departments)
    .values([
      {
        organizationId: existingOrg.id,
        name: 'Engineering',
        code: 'ENG',
      },
      {
        organizationId: existingOrg.id,
        name: 'Operations',
        code: 'OPS',
      },
      {
        organizationId: existingOrg.id,
        name: 'Human Resources',
        code: 'HR',
      },
    ])
    .onConflictDoNothing()
    .returning();

  const allDepartments =
    departmentRows.length > 0
      ? departmentRows
      : await db.query.departments.findMany({
          where: eq(departments.organizationId, existingOrg.id),
        });

  const departmentByCode = new Map(allDepartments.map((dept) => [dept.code, dept]));
  const userByEmail = new Map<string, typeof users.$inferSelect>();

  for (const orgUser of orgUsers) {
    const [createdUser] = await db
      .insert(users)
      .values({
        email: orgUser.email,
        passwordHash,
        firstName: orgUser.firstName,
        lastName: orgUser.lastName,
      })
      .onConflictDoNothing({ target: users.email })
      .returning();

    const userRecord =
      createdUser ??
      (await db.query.users.findFirst({
        where: eq(users.email, orgUser.email),
      }));

    if (!userRecord) {
      throw new Error(`Failed to create user ${orgUser.email}`);
    }

    userByEmail.set(orgUser.email, userRecord);

    const departmentId = orgUser.departmentCode
      ? departmentByCode.get(orgUser.departmentCode)?.id ?? null
      : null;

    await db
      .insert(userRoles)
      .values({
        userId: userRecord.id,
        role: orgUser.role,
        organizationId: existingOrg.id,
        departmentId,
      })
      .onConflictDoNothing();

    if (orgUser.role === 'dept_head' || orgUser.role === 'employee') {
      await db
        .insert(userRoles)
        .values({
          userId: userRecord.id,
          role: 'employee',
          organizationId: existingOrg.id,
          departmentId,
        })
        .onConflictDoNothing();
    }
  }

  const orgAdmin =
    (await db.query.users.findFirst({ where: eq(users.email, 'orgadmin@greentech.io') }))!;

  await db.insert(esgWeightages).values({
    organizationId: existingOrg.id,
    environmentalWeight: '40.00',
    socialWeight: '35.00',
    governanceWeight: '25.00',
    effectiveFrom: new Date('2025-01-01T00:00:00.000Z'),
    createdById: orgAdmin.id,
  }).onConflictDoNothing();

  await db.insert(emissionFactors).values([
    {
      organizationId: existingOrg.id,
      name: 'Grid Electricity - India',
      category: 'energy',
      scope: 'scope_2',
      unit: 'kWh',
      factorValue: '0.82000000',
      effectiveFrom: new Date('2025-01-01T00:00:00.000Z'),
      source: 'CEA 2024',
      createdById: orgAdmin.id,
    },
    {
      organizationId: existingOrg.id,
      name: 'Petrol Combustion',
      category: 'transport',
      scope: 'scope_1',
      unit: 'liter',
      factorValue: '2.31000000',
      effectiveFrom: new Date('2025-01-01T00:00:00.000Z'),
      source: 'IPCC 2024',
      createdById: orgAdmin.id,
    },
    {
      organizationId: existingOrg.id,
      name: 'Business Air Travel',
      category: 'travel',
      scope: 'scope_3',
      unit: 'km',
      factorValue: '0.15000000',
      effectiveFrom: new Date('2025-01-01T00:00:00.000Z'),
      source: 'DEFRA 2024',
      createdById: orgAdmin.id,
    },
    {
      organizationId: existingOrg.id,
      name: 'Natural Gas Combustion',
      category: 'energy',
      scope: 'scope_1',
      unit: 'm3',
      factorValue: '2.05000000',
      effectiveFrom: new Date('2025-01-01T00:00:00.000Z'),
      source: 'IPCC 2024',
      createdById: orgAdmin.id,
    },
  ]);

  const [volunteerBadge] = await db
    .insert(badges)
    .values({
      organizationId: existingOrg.id,
      name: 'Community Champion',
      description: 'Completed 3 approved CSR activities',
      iconKey: 'community-champion',
      criteriaJson: { type: 'csr_count', threshold: 3 },
    })
    .onConflictDoNothing()
    .returning();

  if (volunteerBadge) {
    await db
      .insert(badges)
      .values({
        organizationId: existingOrg.id,
        name: 'Carbon Tracker',
        description: 'Submitted 5 approved carbon activities',
        iconKey: 'carbon-tracker',
        criteriaJson: { type: 'carbon_count', threshold: 5 },
      })
      .onConflictDoNothing();
  } else {
    await db
      .insert(badges)
      .values({
        organizationId: existingOrg.id,
        name: 'Carbon Tracker',
        description: 'Submitted 5 approved carbon activities',
        iconKey: 'carbon-tracker',
        criteriaJson: { type: 'carbon_count', threshold: 5 },
      })
      .onConflictDoNothing();
  }

  const [reward] = await db
    .insert(rewards)
    .values({
      organizationId: existingOrg.id,
      name: 'Eco Water Bottle',
      description: 'Stainless steel reusable bottle with EcoSphere branding',
      pointsCost: 250,
    })
    .onConflictDoNothing()
    .returning();

  if (reward) {
    await db.insert(rewardInventory).values({
      organizationId: existingOrg.id,
      rewardId: reward.id,
      stockRemaining: 100,
      version: 0,
    });

    const [rewardTwo] = await db
      .insert(rewards)
      .values({
        organizationId: existingOrg.id,
        name: 'Plant a Tree Certificate',
        description: 'Fund the planting of one native tree through our partner NGO',
        pointsCost: 500,
      })
      .onConflictDoNothing()
      .returning();

    if (rewardTwo) {
      await db.insert(rewardInventory).values({
        organizationId: existingOrg.id,
        rewardId: rewardTwo.id,
        stockRemaining: 50,
        version: 0,
      });
    }
  }

  await db.insert(policies).values({
    organizationId: existingOrg.id,
    title: 'Code of Conduct',
    content:
      'All employees must uphold ethical standards, respect human rights, and report violations promptly.',
    version: '1.0',
    effectiveFrom: new Date('2025-01-01T00:00:00.000Z'),
    requiresAcknowledgement: true,
    createdById: orgAdmin.id,
  }).onConflictDoNothing();

  const engDept = departmentByCode.get('ENG');

  await db.insert(frameworkMappings).values([
    {
      organizationId: existingOrg.id,
      framework: 'brsr',
      metricCode: 'BRSR-E1',
      metricTitle: 'Total Scope 1 and 2 GHG emissions',
      domain: 'environmental',
      description: 'Direct and energy indirect greenhouse gas emissions in metric tonnes CO2e',
      unit: 'tCO2e',
      isMandatory: true,
    },
    {
      organizationId: existingOrg.id,
      framework: 'gri',
      metricCode: 'GRI-305-1',
      metricTitle: 'Direct (Scope 1) GHG emissions',
      domain: 'environmental',
      description: 'GRI 305-1 direct greenhouse gas emissions',
      unit: 'tCO2e',
      isMandatory: true,
    },
    {
      organizationId: existingOrg.id,
      framework: 'csrd',
      metricCode: 'E1-6',
      metricTitle: 'Gross Scopes 1, 2, 3 and Total GHG emissions',
      domain: 'environmental',
      description: 'CSRD ESRS E1-6 climate change mitigation disclosures',
      unit: 'tCO2e',
      isMandatory: true,
    },
    {
      organizationId: existingOrg.id,
      framework: 'brsr',
      metricCode: 'BRSR-S1',
      metricTitle: 'CSR volunteer hours',
      domain: 'social',
      description: 'Total employee volunteer hours for community initiatives',
      unit: 'hours',
      isMandatory: true,
    },
    {
      organizationId: existingOrg.id,
      framework: 'gri',
      metricCode: 'GRI-405-1',
      metricTitle: 'Diversity of governance bodies and employees',
      domain: 'social',
      description: 'Percentage of diversity across employee population',
      unit: 'percent',
      isMandatory: true,
    },
  ]).onConflictDoNothing();

  if (engDept) {
    await db.insert(resourceConsumptionLedger).values({
      organizationId: existingOrg.id,
      departmentId: engDept.id,
      submittedById: orgAdmin.id,
      resourceType: 'energy',
      quantity: '12500.0000',
      unit: 'kWh',
      consumptionDate: new Date('2025-06-01T00:00:00.000Z'),
      documentHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      description: 'Q2 engineering floor electricity consumption — verified utility bill',
      status: 'approved',
    }).onConflictDoNothing();
  }

  const emissionFactorRows = await db.query.emissionFactors.findMany({
    where: eq(emissionFactors.organizationId, existingOrg.id),
  });
  const scope1Factor = emissionFactorRows.find((factor) => factor.scope === 'scope_1');
  const scope2Factor = emissionFactorRows.find((factor) => factor.scope === 'scope_2');
  const scope3Factor = emissionFactorRows.find((factor) => factor.scope === 'scope_3');
  const opsDept = departmentByCode.get('OPS');
  const hrDept = departmentByCode.get('HR');

  const emma = userByEmail.get('employee@greentech.io');
  const priya = userByEmail.get('priya@greentech.io');
  const rahul = userByEmail.get('rahul@greentech.io');
  const sara = userByEmail.get('sara@greentech.io');
  const michael = userByEmail.get('michael@greentech.io');
  const anita = userByEmail.get('anita@greentech.io');
  const vikram = userByEmail.get('vikram@greentech.io');
  const deptHead = userByEmail.get('depthead@greentech.io');

  const existingDemoCsr = await db.query.csrActivities.findFirst({
    where: eq(csrActivities.organizationId, existingOrg.id),
  });

  if (
    engDept &&
    opsDept &&
    hrDept &&
    emma &&
    priya &&
    rahul &&
    sara &&
    michael &&
    deptHead &&
    !existingDemoCsr
  ) {
    const seededCsr = await db
      .insert(csrActivities)
      .values([
        {
          organizationId: existingOrg.id,
          departmentId: engDept.id,
          submittedById: emma.id,
          title: 'STEM Workshop for Rural Schools',
          description:
            'Conducted coding and sustainability workshops for 120 students across two rural schools near Pune.',
          activityDate: new Date('2026-01-18T09:00:00.000Z'),
          hoursContributed: '16.00',
          beneficiariesCount: 120,
          status: 'approved',
        },
        {
          organizationId: existingOrg.id,
          departmentId: opsDept.id,
          submittedById: priya.id,
          title: 'Food Distribution Drive',
          description:
            'Packaged and distributed meals to underserved families with a local NGO partner during winter.',
          activityDate: new Date('2026-02-08T11:00:00.000Z'),
          hoursContributed: '10.50',
          beneficiariesCount: 85,
          status: 'approved',
        },
        {
          organizationId: existingOrg.id,
          departmentId: hrDept.id,
          submittedById: sara.id,
          title: 'Inclusive Hiring Awareness Session',
          description:
            'Hosted an internal and community session on inclusive hiring practices and workplace accessibility.',
          activityDate: new Date('2026-03-05T14:00:00.000Z'),
          hoursContributed: '6.00',
          beneficiariesCount: 45,
          status: 'submitted',
        },
        {
          organizationId: existingOrg.id,
          departmentId: engDept.id,
          submittedById: rahul.id,
          title: 'E-Waste Collection Camp',
          description:
            'Organized an employee-led e-waste collection camp and coordinated responsible recycling with certified vendors.',
          activityDate: new Date('2026-04-12T10:00:00.000Z'),
          hoursContributed: '8.00',
          beneficiariesCount: 60,
          status: 'approved',
        },
        {
          organizationId: existingOrg.id,
          departmentId: engDept.id,
          submittedById: michael.id,
          title: 'Urban Tree Plantation Drive',
          description:
            'Planted 250 native saplings with municipal support and tracked survival rates for quarterly reporting.',
          activityDate: new Date('2026-05-20T07:30:00.000Z'),
          hoursContributed: '12.00',
          beneficiariesCount: 250,
          status: 'submitted',
        },
        ...(anita
          ? [{
              organizationId: existingOrg.id,
              departmentId: opsDept.id,
              submittedById: anita.id,
              title: 'Warehouse Safety Training for Workers',
              description:
                'Delivered safety and ergonomics training for contract workers at the regional warehouse.',
              activityDate: new Date('2026-06-02T09:30:00.000Z'),
              hoursContributed: '7.00',
              beneficiariesCount: 40,
              status: 'approved' as const,
            }]
          : []),
        ...(vikram
          ? [{
              organizationId: existingOrg.id,
              departmentId: hrDept.id,
              submittedById: vikram.id,
              title: 'Career Mentorship for Graduates',
              description:
                'Mentored first-generation graduates on interview readiness and workplace communication skills.',
              activityDate: new Date('2026-06-10T15:00:00.000Z'),
              hoursContributed: '5.50',
              beneficiariesCount: 30,
              status: 'submitted' as const,
            }]
          : []),
      ])
      .returning();

    for (const [index, activity] of seededCsr.entries()) {
      if (activity.status !== 'approved') {
        continue;
      }

      const submitter =
        activity.submittedById === emma.id
          ? emma
          : activity.submittedById === priya.id
            ? priya
            : activity.submittedById === rahul.id
              ? rahul
              : michael;

      await db.insert(xpLedger).values({
        organizationId: existingOrg.id,
        userId: submitter.id,
        entryType: 'credit',
        amount: 120 + index * 15,
        sourceType: 'csr_activity',
        sourceId: activity.id,
        description: `Approved CSR: ${activity.title}`,
      });

      await db.insert(pointsLedger).values({
        organizationId: existingOrg.id,
        userId: submitter.id,
        entryType: 'credit',
        amount: 80 + index * 10,
        sourceType: 'csr_activity',
        sourceId: activity.id,
        description: `Reward points for ${activity.title}`,
      });
    }

    if (scope1Factor && scope2Factor && scope3Factor) {
      await db.insert(carbonTransactions).values([
        {
          organizationId: existingOrg.id,
          departmentId: engDept.id,
          submittedById: rahul.id,
          scope: 'scope_2',
          activityType: 'Office electricity',
          quantity: '4200.0000',
          unit: 'kWh',
          emissionFactorId: scope2Factor.id,
          snapshotFactorValue: scope2Factor.factorValue,
          snapshotFactorUnit: scope2Factor.unit,
          co2eKg: '3444.0000',
          activityDate: new Date('2026-01-15T00:00:00.000Z'),
          description: 'January engineering office electricity usage',
          status: 'approved',
        },
        {
          organizationId: existingOrg.id,
          departmentId: opsDept.id,
          submittedById: priya.id,
          scope: 'scope_1',
          activityType: 'Fleet fuel',
          quantity: '180.0000',
          unit: 'liter',
          emissionFactorId: scope1Factor.id,
          snapshotFactorValue: scope1Factor.factorValue,
          snapshotFactorUnit: scope1Factor.unit,
          co2eKg: '415.8000',
          activityDate: new Date('2026-02-10T00:00:00.000Z'),
          description: 'Operations fleet diesel consumption',
          status: 'approved',
        },
        {
          organizationId: existingOrg.id,
          departmentId: engDept.id,
          submittedById: michael.id,
          scope: 'scope_3',
          activityType: 'Business travel',
          quantity: '3200.0000',
          unit: 'km',
          emissionFactorId: scope3Factor.id,
          snapshotFactorValue: scope3Factor.factorValue,
          snapshotFactorUnit: scope3Factor.unit,
          co2eKg: '480.0000',
          activityDate: new Date('2026-03-18T00:00:00.000Z'),
          description: 'Client visit flights and ground travel',
          status: 'approved',
        },
        {
          organizationId: existingOrg.id,
          departmentId: engDept.id,
          submittedById: emma.id,
          scope: 'scope_2',
          activityType: 'Office electricity',
          quantity: '3900.0000',
          unit: 'kWh',
          emissionFactorId: scope2Factor.id,
          snapshotFactorValue: scope2Factor.factorValue,
          snapshotFactorUnit: scope2Factor.unit,
          co2eKg: '3198.0000',
          activityDate: new Date('2026-04-22T00:00:00.000Z'),
          description: 'April engineering office electricity usage',
          status: 'approved',
        },
        {
          organizationId: existingOrg.id,
          departmentId: opsDept.id,
          submittedById: deptHead.id,
          scope: 'scope_3',
          activityType: 'Supplier logistics',
          quantity: '5100.0000',
          unit: 'km',
          emissionFactorId: scope3Factor.id,
          snapshotFactorValue: scope3Factor.factorValue,
          snapshotFactorUnit: scope3Factor.unit,
          co2eKg: '765.0000',
          activityDate: new Date('2026-05-28T00:00:00.000Z'),
          description: 'Inbound logistics from tier-2 suppliers',
          status: 'approved',
        },
      ]);
    }

    await db.insert(participationStreaks).values([
      {
        organizationId: existingOrg.id,
        userId: emma.id,
        currentStreakWeeks: 4,
        longestStreakWeeks: 6,
        lastActivityWeek: '2026-W27',
      },
      {
        organizationId: existingOrg.id,
        userId: priya.id,
        currentStreakWeeks: 3,
        longestStreakWeeks: 5,
        lastActivityWeek: '2026-W27',
      },
      {
        organizationId: existingOrg.id,
        userId: rahul.id,
        currentStreakWeeks: 2,
        longestStreakWeeks: 4,
        lastActivityWeek: '2026-W26',
      },
    ]).onConflictDoNothing();

    await db.insert(challenges).values({
      organizationId: existingOrg.id,
      departmentId: engDept.id,
      createdById: orgAdmin.id,
      title: 'Green Commute Week',
      description: 'Use public transport, carpool, or cycle for five consecutive workdays.',
      startDate: new Date('2026-06-01T00:00:00.000Z'),
      endDate: new Date('2026-06-30T23:59:59.000Z'),
      xpReward: 150,
      pointsReward: 100,
      status: 'active',
    });
  }



  console.log('Seed completed.');
  console.log('');
  console.log('Demo credentials (password for all): Password123!');
  console.log('  superadmin@ecosphere.io     — Super Admin');
  console.log('  orgadmin@greentech.io       — Organization Admin');
  console.log('  esgmanager@greentech.io     — ESG Manager');
  console.log('  depthead@greentech.io       — Department Head + Employee');
  console.log('  auditor@greentech.io        — Auditor');
  console.log('  employee@greentech.io       — Employee');
  console.log('  priya@greentech.io          — Employee (Operations)');
  console.log('  rahul@greentech.io          — Employee (Engineering)');
  console.log('  sara@greentech.io           — Employee (HR)');
  console.log('  michael@greentech.io        — Employee (Engineering)');
  console.log('  anita@greentech.io          — Employee (Operations)');
  console.log('  vikram@greentech.io         — Employee (HR)');
  console.log('');

  await client.end();
}

seed().catch((error: unknown) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
