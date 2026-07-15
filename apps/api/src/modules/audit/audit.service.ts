import { Injectable, Logger } from '@nestjs/common';
import { AuditRepository } from '../../database/repositories/audit.repository';

export interface AuditLogDto {
  organizationId: string;
  userId: string;
  module: string;
  action: string;
  browser?: string;
  os?: string;
  device?: string;
  location?: string;
  sessionId?: string;
  requestId?: string;
  oldValue?: any;
  newValue?: any;
  success?: boolean;
  severity?: string;
  executionTime?: number;
}

export interface SecurityEventDto {
  organizationId: string;
  userId?: string;
  eventType: string;
  severity: string;
  ipAddress?: string;
  details?: any;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly auditRepository: AuditRepository) {}

  async logAction(data: AuditLogDto) {
    try {
      const { userId, ...rest } = data;
      await this.auditRepository.createAuditLog({
        ...rest,
        actorUserId: userId,
        entityType: data.module,
      });
    } catch (error) {
      this.logger.error('Failed to create audit log', error);
      // We don't throw here to avoid failing the main request if logging fails
    }
  }

  async logSecurityEvent(data: SecurityEventDto) {
    try {
      await this.auditRepository.createSecurityEvent({
        ...data,
      });
    } catch (error) {
      this.logger.error('Failed to create security event log', error);
    }
  }

  async getOrganizationLogs(organizationId: string, options?: any) {
    return this.auditRepository.getAuditLogs(organizationId, options);
  }

  async getSecurityEvents(organizationId: string, limit?: number, offset?: number) {
    return this.auditRepository.getSecurityEvents(organizationId, limit, offset);
  }
}
