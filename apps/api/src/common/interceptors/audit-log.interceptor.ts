import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap, catchError } from 'rxjs';
import { AuditService } from '../../modules/audit/audit.service';
import type { AuthenticatedRequest } from '../types/request.types';
import { UAParser } from 'ua-parser-js';
import * as crypto from 'crypto';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const method = request.method.toUpperCase();

    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const startTime = Date.now();
    const requestId = crypto.randomUUID();

    return next.handle().pipe(
      tap({
        next: (responseBody) => {
          const executionTime = Date.now() - startTime;
          this.logRequest(request, responseBody, true, executionTime, requestId);
        },
      }),
      catchError((error) => {
        const executionTime = Date.now() - startTime;
        this.logRequest(request, error, false, executionTime, requestId);
        throw error;
      }),
    );
  }

  private logRequest(
    req: AuthenticatedRequest,
    responseOrError: any,
    success: boolean,
    executionTime: number,
    requestId: string
  ) {
    // Only log if user and org exist
    const orgId = req.params?.orgId || req.user?.roles?.[0]?.organizationId;
    const actorUserId = req.user?.id;

    if (!orgId || !actorUserId) {
      return;
    }

    const userAgent = req.headers['user-agent'] || '';
    const parser = new UAParser(userAgent);
    const browser = parser.getBrowser();
    const os = parser.getOS();
    const device = parser.getDevice();

    const path = req.route?.path ?? req.url;
    const moduleName = path.split('/').filter(Boolean)[1] || 'core'; // /api/v1/module/...
    const actionName = `${req.method} ${path}`;

    let ipAddress = req.ip || req.connection?.remoteAddress || '';
    if (ipAddress.startsWith('::ffff:')) {
      ipAddress = ipAddress.replace('::ffff:', '');
    }

    this.auditService.logAction({
      organizationId: typeof orgId === 'string' ? orgId : '',
      userId: typeof actorUserId === 'string' ? actorUserId : '',
      module: moduleName,
      action: actionName,
      browser: `${browser.name || 'Unknown'} ${browser.version || ''}`.trim(),
      os: `${os.name || 'Unknown'} ${os.version || ''}`.trim(),
      device: `${device.vendor || 'Unknown'} ${device.model || ''}`.trim(),
      location: 'Unknown',
      sessionId: (req.headers['x-session-id'] as string) || 'default_session',
      requestId,
      oldValue: null,
      newValue: req.body,
      success,
      severity: success ? 'info' : 'error',
      executionTime,
    }).catch(err => {
      this.logger.error('Failed to log audit action', err);
    });
  }
}
