import { Injectable } from '@nestjs/common';
import { NotificationsRepository } from '../../database/repositories/notifications.repository';
import type { NotificationType } from '@ecosphere/shared';

import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async createNotification(input: {
    organizationId: string;
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    entityType?: string;
    entityId?: string;
  }) {
    const [record] =
      (await this.notificationsRepository.create({
        organizationId: input.organizationId,
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
      })) ?? [];

    if (record) {
      // Broadcast real-time notification
      this.notificationsGateway.sendToUser(record.userId, 'notification.new', record);
    }

    return record ?? null;
  }

  listForUser(organizationId: string, userId: string) {
    return this.notificationsRepository.listForUser(organizationId, userId);
  }

  async markRead(notificationId: string, userId: string) {
    await this.notificationsRepository.markRead(notificationId, userId);
    return { success: true };
  }
}
