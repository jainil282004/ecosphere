import { Module } from '@nestjs/common';
import { SocialService } from './social.service';
import { SocialController } from './social.controller';
import { ApprovalsModule } from '../approvals/approvals.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [ApprovalsModule, NotificationsModule],
  providers: [SocialService],
  controllers: [SocialController],
})
export class SocialModule {}
