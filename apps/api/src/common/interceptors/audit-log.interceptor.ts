import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { DomainRepository } from '../../database/repositories/domain.repository';
import type { AuthenticatedRequest } from '../types/request.types';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(private readonly domainRepository: DomainRepository) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const method = request.method.toUpperCase();

    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const orgIdParam = request.params?.orgId;
    const orgId = typeof orgIdParam === 'string' ? orgIdParam : null;
    const entityIdParam = request.params?.id;
    const entityId = typeof entityIdParam === 'string' ? entityIdParam : null;
    const actorUserId = request.user?.id ?? null;
    const path = request.route?.path ?? request.url;
    const entityType = path.split('/').filter(Boolean).slice(2).join('/') || 'unknown';

    return next.handle().pipe(
      tap({
        next: () => {
          void this.domainRepository
            .insertAuditLog({
              organizationId: orgId,
              actorUserId,
              action: `${method} ${path}`,
              entityType,
              entityId,
              metadata: {
                bodyKeys: request.body ? Object.keys(request.body as object) : [],
                params: request.params ?? {},
              },
              ipAddress: request.ip ?? null,
            })
            .catch((error: unknown) => {
              this.logger.error(
                `Failed to persist mutation audit for ${method} ${path}`,
                error instanceof Error ? error.stack : String(error),
              );
            });
        },
      }),
    );
  }
}
