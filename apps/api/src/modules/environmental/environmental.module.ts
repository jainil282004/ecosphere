import { Module } from '@nestjs/common';
import { EnvironmentalMetricService } from './environmental-metric.service';
import { EnvironmentalService } from './environmental.service';
import { EnvironmentalController } from './environmental.controller';
import { EnvironmentalRoutesController } from './environmental-routes.controller';
import { CarbonFootprintService } from './carbon-footprint.service';
import { CarbonVerificationService } from './carbon-verification.service';
import { ApprovalsModule } from '../approvals/approvals.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [ApprovalsModule, NotificationsModule],
  providers: [
    EnvironmentalService,
    EnvironmentalMetricService,
    CarbonFootprintService,
    CarbonVerificationService,
  ],
  controllers: [EnvironmentalController, EnvironmentalRoutesController],
  exports: [CarbonFootprintService, CarbonVerificationService, EnvironmentalMetricService],
})
export class EnvironmentalModule {}
