import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { notifications } from '@ecosphere/db';
import { BaseRepository } from './base.repository';

@Injectable()
export class NotificationsRepository extends BaseRepository {
  create(values: typeof notifications.$inferInsert) {
    return this.db.insert(notifications).values(values).onConflictDoNothing().returning();
  }

  listForUser(orgId: string, userId: string) {
    return this.db.query.notifications.findMany({
      where: and(eq(notifications.organizationId, orgId), eq(notifications.userId, userId)),
      orderBy: (table, { desc }) => [desc(table.createdAt)],
    });
  }

  markRead(notificationId: string, userId: string) {
    return this.db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
  }
}
