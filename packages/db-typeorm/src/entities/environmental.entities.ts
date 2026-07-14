import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'emission_factors' })
@Index('emission_factors_org_category_idx', ['organizationId', 'category'])
export class EmissionFactorEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'varchar', length: 100 })
  category!: string;

  @Column({ type: 'varchar', length: 20 })
  scope!: string;

  @Column({ type: 'varchar', length: 50 })
  unit!: string;

  @Column({ name: 'factor_value', type: 'numeric', precision: 18, scale: 8 })
  factorValue!: string;

  @Column({ name: 'effective_from', type: 'timestamptz' })
  effectiveFrom!: Date;

  @Column({ type: 'varchar', length: 200 })
  source!: string;

  @Column({ name: 'created_by_id', type: 'uuid' })
  createdById!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}

@Entity({ name: 'carbon_transactions' })
@Index('carbon_transactions_org_status_idx', ['organizationId', 'status'])
export class CarbonTransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @Column({ name: 'department_id', type: 'uuid' })
  departmentId!: string;

  @Column({ name: 'submitted_by_id', type: 'uuid' })
  submittedById!: string;

  @Column({ type: 'varchar', length: 20 })
  scope!: string;

  @Column({ name: 'activity_type', type: 'varchar', length: 100 })
  activityType!: string;

  @Column({ type: 'numeric', precision: 18, scale: 4 })
  quantity!: string;

  @Column({ type: 'varchar', length: 50 })
  unit!: string;

  @Column({ name: 'emission_factor_id', type: 'uuid' })
  emissionFactorId!: string;

  @Column({ name: 'snapshot_factor_value', type: 'numeric', precision: 18, scale: 8 })
  snapshotFactorValue!: string;

  @Column({ name: 'snapshot_factor_unit', type: 'varchar', length: 50 })
  snapshotFactorUnit!: string;

  @Column({ name: 'co2e_kg', type: 'numeric', precision: 10, scale: 4 })
  co2eKg!: string;

  @Column({ name: 'activity_date', type: 'timestamptz' })
  activityDate!: Date;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'evidence_file_key', type: 'varchar', length: 500, nullable: true })
  evidenceFileKey!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'submitted' })
  status!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

@Entity({ name: 'audit_logs' })
@Index('audit_logs_org_created_idx', ['organizationId', 'createdAt'])
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId!: string | null;

  @Column({ name: 'actor_user_id', type: 'uuid', nullable: true })
  actorUserId!: string | null;

  @Column({ type: 'varchar', length: 150 })
  action!: string;

  @Column({ name: 'entity_type', type: 'varchar', length: 100 })
  entityType!: string;

  @Column({ name: 'entity_id', type: 'uuid', nullable: true })
  entityId!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}

@Entity({ name: 'approvals' })
@Index('approvals_org_status_idx', ['organizationId', 'status'])
export class ApprovalEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @Column({ name: 'entity_type', type: 'varchar', length: 50 })
  entityType!: string;

  @Column({ name: 'entity_id', type: 'uuid' })
  entityId!: string;

  @Column({ name: 'submitted_by_id', type: 'uuid' })
  submittedById!: string;

  @Column({ type: 'varchar', length: 20, default: 'submitted' })
  status!: string;

  @Column({ name: 'submitted_at', type: 'timestamptz' })
  submittedAt!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}

@Entity({ name: 'notifications' })
@Index('notifications_user_read_idx', ['userId', 'isRead', 'createdAt'])
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 50 })
  type!: string;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ name: 'entity_type', type: 'varchar', length: 100, nullable: true })
  entityType!: string | null;

  @Column({ name: 'entity_id', type: 'uuid', nullable: true })
  entityId!: string | null;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
