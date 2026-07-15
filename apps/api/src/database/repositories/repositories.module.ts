import { Global, Module } from '@nestjs/common';
import { ActivityRepository } from './activity.repository';
import { EnvironmentalRepository } from './environmental.repository';
import { ApprovalRepository } from './approval.repository';
import { AuthRepository } from './auth.repository';
import { DomainRepository } from './domain.repository';
import { GovernanceRepository } from './governance.repository';
import { LedgerRepository } from './ledger.repository';
import { NotificationsRepository } from './notifications.repository';
import { ReportsRepository } from './reports.repository';
import { RewardsRepository } from './rewards.repository';
import { TenantRepository } from './tenant.repository';
import { WorkflowRepository } from './workflow.repository';
import { VaultRepository } from './vault.repository';
import { AuditRepository } from './audit.repository';

const repositories = [
  AuthRepository,
  TenantRepository,
  ActivityRepository,
  EnvironmentalRepository,
  ApprovalRepository,
  LedgerRepository,
  GovernanceRepository,
  DomainRepository,
  RewardsRepository,
  ReportsRepository,
  NotificationsRepository,
  WorkflowRepository,
  VaultRepository,
  AuditRepository,
];

@Global()
@Module({
  providers: repositories,
  exports: repositories,
})
export class RepositoriesModule {}

export {
  ActivityRepository,
  EnvironmentalRepository,
  ApprovalRepository,
  AuthRepository,
  DomainRepository,
  GovernanceRepository,
  LedgerRepository,
  NotificationsRepository,
  ReportsRepository,
  RewardsRepository,
  TenantRepository,
  AuditRepository,
  VaultRepository,
  WorkflowRepository,
};
