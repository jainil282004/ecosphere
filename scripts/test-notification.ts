import { createDb } from '@ecosphere/db';
import { notifications } from '@ecosphere/db/schema';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL is missing in apps/api/.env');
  }

  // Use port 5433 for local Windows PG instance
  const localDbUrl = dbUrl.replace(':5432/', ':5433/');
  const { db, client } = createDb(localDbUrl);

  try {
    console.log('Connecting to database...');
    // We need an org and a user
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, 'jainil@greentech.io'),
    });

    if (!user) {
      throw new Error('User jainil@greentech.io not found.');
    }

    const orgUser = await db.query.userRoles.findFirst({
      where: (ur, { eq }) => eq(ur.userId, user.id),
    });

    if (!orgUser || !orgUser.organizationId) {
      throw new Error('User is not part of an organization.');
    }

    console.log('Inserting test notification for', user.email);

    await db.insert(notifications).values({
      organizationId: orgUser.organizationId,
      userId: user.id,
      title: 'Welcome to Ecosphere Live!',
      body: 'Your live notification system is working perfectly. The red dot appeared without refreshing the page!',
      type: 'policy_published',
      isRead: false,
    });

    console.log('Successfully inserted notification!');
  } catch (error) {
    console.error('Failed:', error);
  } finally {
    await client.end();
  }
}

main();
