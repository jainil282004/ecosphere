import {
  DepartmentEntity,
  OrganizationEntity,
  UserEntity,
  UserRoleEntity,
} from './core.entities.js';
import {
  PasswordResetTokenEntity,
  RefreshTokenEntity,
} from './auth.entities.js';
import {
  ApprovalEntity,
  AuditLogEntity,
  CarbonTransactionEntity,
  EmissionFactorEntity,
  NotificationEntity,
} from './environmental.entities.js';

export const TYPEORM_ENTITIES = [
  OrganizationEntity,
  UserEntity,
  DepartmentEntity,
  UserRoleEntity,
  RefreshTokenEntity,
  PasswordResetTokenEntity,
  EmissionFactorEntity,
  CarbonTransactionEntity,
  AuditLogEntity,
  ApprovalEntity,
  NotificationEntity,
] as const;

export {
  OrganizationEntity,
  UserEntity,
  DepartmentEntity,
  UserRoleEntity,
  RefreshTokenEntity,
  PasswordResetTokenEntity,
  EmissionFactorEntity,
  CarbonTransactionEntity,
  AuditLogEntity,
  ApprovalEntity,
  NotificationEntity,
};
