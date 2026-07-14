import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ZodError } from 'zod';
import type { Request, Response } from 'express';
import { DomainRepository } from '../../database/repositories/domain.repository';
import type { AuthenticatedUser } from '../types/request.types';

interface PostgresErrorLike {
  code?: string;
  constraint?: string;
  constraint_name?: string;
  column?: string;
  detail?: string;
  message?: string;
}

interface ValidationDetail {
  field: string;
  message: string;
  code?: string;
}

interface ZodErrorLike {
  name: 'ZodError';
  issues: Array<{
    path: Array<string | number>;
    message: string;
    code: string;
  }>;
}

interface NormalizedError {
  status: number;
  code: string;
  message: string;
  details?: ValidationDetail[];
}

interface ErrorRequest extends Request {
  user?: AuthenticatedUser;
  orgId?: string;
}

const PG_UNIQUE_VIOLATION = '23505';
const PG_FOREIGN_KEY_VIOLATION = '23503';
const PG_CHECK_VIOLATION = '23514';
const PG_NOT_NULL_VIOLATION = '23502';
const PG_INVALID_TEXT_REPRESENTATION = '22P02';
const PG_STRING_DATA_RIGHT_TRUNCATION = '22001';
const PG_SERIALIZATION_FAILURE = '40001';
const PG_DEADLOCK_DETECTED = '40P01';
const PG_TOO_MANY_CONNECTIONS = '53300';

@Catch()
@Injectable()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly domainRepository: DomainRepository) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<ErrorRequest>();
    const response = ctx.getResponse<Response>();
    const requestId = this.resolveRequestId(request);
    const normalized = this.normalizeException(exception);
    const timestamp = new Date().toISOString();
    const path = request.originalUrl ?? request.url;

    response.setHeader('X-Request-Id', requestId);
    response.status(normalized.status).json({
      timestamp,
      path,
      statusCode: normalized.status,
      errorCode: normalized.code,
      message: normalized.message,
      details: normalized.details ?? [],
      requestId,
      // Retained for clients that consume JSON:API error documents.
      errors: [
        {
          status: String(normalized.status),
          code: normalized.code,
          title: normalized.message,
          detail: normalized.message,
          meta: {
            timestamp,
            path,
            requestId,
            validationDetails: normalized.details ?? [],
          },
        },
      ],
    });

    this.logException(exception, normalized, requestId, path);

    if (
      normalized.status === HttpStatus.UNAUTHORIZED ||
      normalized.status === HttpStatus.FORBIDDEN
    ) {
      void this.auditDeniedAccess(request, normalized, requestId, path);
    }
  }

  private normalizeException(exception: unknown): NormalizedError {
    const zodError = this.asZodError(exception);
    if (zodError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        code: 'VALIDATION_FAILED',
        message: 'The request contains invalid or missing data.',
        details: zodError.issues.map((issue) => ({
          field: issue.path.join('.') || 'request',
          message: issue.message,
          code: issue.code,
        })),
      };
    }

    const pgError = this.asPostgresError(exception);
    if (pgError) {
      return this.mapPostgresError(pgError);
    }

    if (exception instanceof HttpException) {
      return this.normalizeHttpException(exception);
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred. Please try again later.',
    };
  }

  private asZodError(exception: unknown): ZodErrorLike | null {
    if (exception instanceof ZodError) {
      return exception as ZodErrorLike;
    }
    if (!exception || typeof exception !== 'object') {
      return null;
    }

    const candidate = exception as {
      name?: unknown;
      issues?: unknown;
    };
    if (candidate.name !== 'ZodError' || !Array.isArray(candidate.issues)) {
      return null;
    }

    const validIssues = candidate.issues.every((issue) => {
      if (!issue || typeof issue !== 'object') {
        return false;
      }
      const value = issue as Record<string, unknown>;
      return (
        Array.isArray(value.path) &&
        value.path.every((segment) => typeof segment === 'string' || typeof segment === 'number') &&
        typeof value.message === 'string' &&
        typeof value.code === 'string'
      );
    });

    return validIssues ? (candidate as ZodErrorLike) : null;
  }

  private normalizeHttpException(exception: HttpException): NormalizedError {
    const status = exception.getStatus();
    const payload = exception.getResponse();
    let suppliedCode: string | undefined;
    let suppliedMessage: string | string[] | undefined;
    let suppliedDetails: ValidationDetail[] | undefined;

    if (typeof payload === 'string') {
      suppliedMessage = payload;
    } else if (payload && typeof payload === 'object') {
      const objectPayload = payload as Record<string, unknown>;
      suppliedCode =
        typeof objectPayload.code === 'string' ? objectPayload.code : undefined;
      suppliedMessage =
        typeof objectPayload.message === 'string' ||
        (Array.isArray(objectPayload.message) &&
          objectPayload.message.every((item) => typeof item === 'string'))
          ? (objectPayload.message as string | string[])
          : undefined;
      suppliedDetails = this.readValidationDetails(objectPayload.details);
    }

    if (status === HttpStatus.BAD_REQUEST && Array.isArray(suppliedMessage)) {
      return {
        status,
        code: suppliedCode ?? 'VALIDATION_FAILED',
        message: 'The request contains invalid or missing data.',
        details:
          suppliedDetails ??
          suppliedMessage.map((message) => ({
            field: this.inferValidationField(message),
            message,
          })),
      };
    }

    if (status === HttpStatus.UNAUTHORIZED || status === HttpStatus.FORBIDDEN) {
      return {
        status,
        code: suppliedCode ?? this.httpErrorCode(status),
        message:
          (typeof suppliedMessage === 'string' && suppliedMessage) ||
          this.defaultHttpMessage(status),
      };
    }

    return {
      status,
      code: suppliedCode ?? this.httpErrorCode(status),
      message:
        (typeof suppliedMessage === 'string' && suppliedMessage) ||
        this.defaultHttpMessage(status),
      ...(suppliedDetails ? { details: suppliedDetails } : {}),
    };
  }

  private mapPostgresError(error: PostgresErrorLike): NormalizedError {
    switch (error.code) {
      case PG_UNIQUE_VIOLATION:
        return {
          status: HttpStatus.CONFLICT,
          code: 'DB_UNIQUE_VIOLATION',
          message: this.humanizeUniqueViolation(error),
        };
      case PG_FOREIGN_KEY_VIOLATION:
        return {
          status: HttpStatus.BAD_REQUEST,
          code: 'DB_FOREIGN_KEY_VIOLATION',
          message: 'A referenced record does not exist or cannot be linked.',
        };
      case PG_CHECK_VIOLATION:
        return {
          status: HttpStatus.BAD_REQUEST,
          code: 'DB_CHECK_VIOLATION',
          message: 'The supplied value violates a data constraint.',
        };
      case PG_NOT_NULL_VIOLATION:
        return {
          status: HttpStatus.BAD_REQUEST,
          code: 'DB_NOT_NULL_VIOLATION',
          message: 'A required value was not provided.',
          details: error.column
            ? [{ field: error.column, message: 'This field is required.' }]
            : undefined,
        };
      case PG_INVALID_TEXT_REPRESENTATION:
        return {
          status: HttpStatus.BAD_REQUEST,
          code: 'DB_INVALID_VALUE',
          message: 'One or more supplied values have an invalid format.',
        };
      case PG_STRING_DATA_RIGHT_TRUNCATION:
        return {
          status: HttpStatus.BAD_REQUEST,
          code: 'DB_VALUE_TOO_LONG',
          message: 'One or more supplied values exceed the permitted length.',
        };
      case PG_SERIALIZATION_FAILURE:
      case PG_DEADLOCK_DETECTED:
        return {
          status: HttpStatus.SERVICE_UNAVAILABLE,
          code: 'DB_TRANSACTION_RETRY_REQUIRED',
          message: 'The operation could not be completed. Please retry.',
        };
      case PG_TOO_MANY_CONNECTIONS:
        return {
          status: HttpStatus.SERVICE_UNAVAILABLE,
          code: 'DB_TEMPORARILY_UNAVAILABLE',
          message: 'The service is temporarily unavailable. Please try again shortly.',
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          code: 'DB_OPERATION_FAILED',
          message: 'A database operation failed.',
        };
    }
  }

  private asPostgresError(exception: unknown): PostgresErrorLike | null {
    let candidate: unknown = exception;
    const visited = new Set<unknown>();

    for (let depth = 0; depth < 6; depth += 1) {
      if (!candidate || typeof candidate !== 'object' || visited.has(candidate)) {
        return null;
      }

      visited.add(candidate);
      const error = candidate as PostgresErrorLike & { cause?: unknown };
      if (typeof error.code === 'string' && /^[0-9A-Z]{5}$/.test(error.code)) {
        return error;
      }
      candidate = error.cause;
    }

    return null;
  }

  private humanizeUniqueViolation(error: PostgresErrorLike): string {
    const constraint = error.constraint ?? error.constraint_name ?? '';
    if (constraint.includes('document_hash')) {
      return 'Document hash already registered for this organization.';
    }
    if (constraint.includes('email')) {
      return 'An account with this email already exists.';
    }
    if (constraint.includes('slug')) {
      return 'An organization with this slug already exists.';
    }
    return 'A record with the same unique value already exists.';
  }

  private httpErrorCode(status: number): string {
    const codes: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
      [HttpStatus.UNAUTHORIZED]: 'AUTHENTICATION_REQUIRED',
      [HttpStatus.FORBIDDEN]: 'ACCESS_DENIED',
      [HttpStatus.NOT_FOUND]: 'RESOURCE_NOT_FOUND',
      [HttpStatus.METHOD_NOT_ALLOWED]: 'METHOD_NOT_ALLOWED',
      [HttpStatus.CONFLICT]: 'RESOURCE_CONFLICT',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
      [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMIT_EXCEEDED',
    };
    return codes[status] ?? `HTTP_${status}`;
  }

  private defaultHttpMessage(status: number): string {
    const messages: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'The request could not be processed.',
      [HttpStatus.UNAUTHORIZED]: 'Authentication is required to access this resource.',
      [HttpStatus.FORBIDDEN]: 'You do not have permission to perform this action.',
      [HttpStatus.NOT_FOUND]: 'The requested resource was not found.',
      [HttpStatus.METHOD_NOT_ALLOWED]: 'This HTTP method is not supported for the resource.',
      [HttpStatus.CONFLICT]: 'The request conflicts with the current resource state.',
      [HttpStatus.TOO_MANY_REQUESTS]: 'Too many requests. Please try again later.',
    };
    return messages[status] ?? 'The request could not be completed.';
  }

  private readValidationDetails(value: unknown): ValidationDetail[] | undefined {
    if (!Array.isArray(value)) {
      return undefined;
    }

    const details = value.flatMap((item): ValidationDetail[] => {
      if (!item || typeof item !== 'object') {
        return [];
      }
      const candidate = item as Record<string, unknown>;
      if (typeof candidate.field !== 'string' || typeof candidate.message !== 'string') {
        return [];
      }
      return [{
        field: candidate.field,
        message: candidate.message,
        ...(typeof candidate.code === 'string' ? { code: candidate.code } : {}),
      }];
    });

    return details.length > 0 ? details : undefined;
  }

  private inferValidationField(message: string): string {
    const [firstWord] = message.trim().split(/\s+/, 1);
    return firstWord && /^[A-Za-z][A-Za-z0-9_.-]*$/.test(firstWord)
      ? firstWord
      : 'request';
  }

  private resolveRequestId(request: Request): string {
    const incoming = request.headers['x-request-id'];
    if (
      typeof incoming === 'string' &&
      incoming.length > 0 &&
      incoming.length <= 128 &&
      /^[A-Za-z0-9._:-]+$/.test(incoming)
    ) {
      return incoming;
    }
    return randomUUID();
  }

  private logException(
    exception: unknown,
    normalized: NormalizedError,
    requestId: string,
    path: string,
  ): void {
    const context = `${normalized.code} ${normalized.status} ${path} requestId=${requestId}`;
    if (normalized.status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        context,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(context);
    }
  }

  private async auditDeniedAccess(
    request: ErrorRequest,
    error: NormalizedError,
    requestId: string,
    path: string,
  ): Promise<void> {
    const orgId = this.validUuid(
      request.orgId ??
        (typeof request.params?.orgId === 'string' ? request.params.orgId : undefined) ??
        (typeof request.query?.orgId === 'string' ? request.query.orgId : undefined) ??
        (typeof request.headers['x-org-id'] === 'string'
          ? request.headers['x-org-id']
          : undefined),
    );
    const actorUserId = this.validUuid(request.user?.id);

    try {
      await this.domainRepository.insertAuditLog({
        organizationId: orgId,
        actorUserId,
        action:
          error.status === HttpStatus.UNAUTHORIZED
            ? 'AUTHENTICATION_FAILED'
            : 'AUTHORIZATION_DENIED',
        entityType: 'security_event',
        metadata: {
          requestId,
          method: request.method,
          path,
          errorCode: error.code,
          userAgent: request.headers['user-agent']?.slice(0, 500) ?? null,
        },
        ipAddress: request.ip?.slice(0, 45) ?? null,
      });
    } catch (auditError) {
      this.logger.error(
        `Failed to persist access-denial audit requestId=${requestId}`,
        auditError instanceof Error ? auditError.stack : String(auditError),
      );
    }
  }

  private validUuid(value: string | undefined): string | null {
    return value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
      )
      ? value
      : null;
  }
}
