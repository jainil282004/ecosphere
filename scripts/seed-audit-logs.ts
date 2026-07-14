import { db } from '@ecosphere/db';
import { auditLogs, organizations, users } from '@ecosphere/db';

async function run() {
  console.log('Seeding audit logs...');

  // 1. Get Jainil and his Org
  const [jainil] = await db.select().from(users).limit(1);
  const [org] = await db.select().from(organizations).limit(1);

  if (!jainil || !org) {
    console.error('No user or org found. Exiting.');
    process.exit(1);
  }

  // 2. Insert dummy logs
  await db.insert(auditLogs).values([
    {
      organizationId: org.id,
      actorUserId: jainil.id,
      action: 'Updated ESG Goals',
      entityType: 'esg_domain',
      metadata: { domain: 'environmental', target: 'net_zero_2030' },
      ipAddress: '192.168.1.1',
    },
    {
      organizationId: org.id,
      actorUserId: jainil.id,
      action: 'Approved Department Budget',
      entityType: 'department',
      metadata: { departmentId: 'ops-123', amount: 50000 },
      ipAddress: '192.168.1.1',
    },
    {
      organizationId: org.id,
      actorUserId: jainil.id,
      action: 'User Login',
      entityType: 'user',
      metadata: { email: jainil.email },
      ipAddress: '192.168.1.1',
    },
  ]);

  console.log('Successfully seeded 3 audit logs!');
  process.exit(0);
}

run().catch(console.error);
