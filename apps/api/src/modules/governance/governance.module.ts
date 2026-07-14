import { Module } from '@nestjs/common';
import { GovernanceService } from './governance.service';
import { GovernanceController } from './governance.controller';
import { GovernanceRoutesController } from './governance-routes.controller';
import { ApprovalsModule } from '../approvals/approvals.module';

@Module({
  imports: [ApprovalsModule],
  providers: [GovernanceService],
  controllers: [GovernanceController, GovernanceRoutesController],
})
export class GovernanceModule {}
