import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        response.status(status).json({
          type: 'about:blank',
          title: exception.name,
          status,
          ...(exceptionResponse as Record<string, unknown>),
        });
        return;
      }

      response.status(status).json({
        type: 'about:blank',
        title: exception.name,
        detail: String(exceptionResponse),
        status,
      });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      type: 'about:blank',
      title: 'Internal Server Error',
      detail: 'An unexpected error occurred.',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
}
