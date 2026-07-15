import { Module } from '@nestjs/common';
import { AiModule } from './modules/ai/ai.module';
import { WorkflowsModule } from './modules/workflows/workflows.module';
import { VaultModule } from './modules/vault/vault.module';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import { AuthModule } from './modules/auth/auth.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { UsersModule } from './modules/users/users.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { EnvironmentalModule } from './modules/environmental/environmental.module';
import { SocialModule } from './modules/social/social.module';
import { GovernanceModule } from './modules/governance/governance.module';
import { ApprovalsModule } from './modules/approvals/approvals.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { RewardsModule } from './modules/rewards/rewards.module';
import { ReportsModule } from './modules/reports/reports.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { CommonModule } from './common/common.module';
import { RepositoriesModule } from './database/repositories/repositories.module';
import { DatabaseModule } from './database/database.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { HealthModule } from './modules/health/health.module';
import { AuditModule } from './modules/audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(__dirname, '../../../.env'),
        join(__dirname, `../../../.env.${process.env.NODE_ENV ?? 'development'}`),
        '.env',
      ],
    }),
    CommonModule,
    DatabaseModule,
    RepositoriesModule,
    AuthModule,
    OrganizationsModule,
    UsersModule,
    DepartmentsModule,
    EnvironmentalModule,
    SocialModule,
    GovernanceModule,
    ApprovalsModule,
    GamificationModule,
    RewardsModule,
    ReportsModule,
    NotificationsModule,
    JobsModule,
    HealthModule,
    AiModule,
    WorkflowsModule,
    VaultModule,
    AuditModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
})
export class AppModule {}
