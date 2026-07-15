import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { EmailService } from './providers/email.service';
import { WebhookService } from './providers/webhook.service';

import { NotificationsGateway } from './notifications.gateway';

@Module({
  providers: [NotificationsService, NotificationsGateway, EmailService, WebhookService],
  controllers: [NotificationsController],
  exports: [NotificationsService, EmailService, WebhookService],
})
export class NotificationsModule {}
