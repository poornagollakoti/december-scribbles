import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { ApiError, ApiFieldError } from '@ds/contracts';
import type { Request, Response } from 'express';

/** Thrown by the validation pipe; carries per-field messages. */
export class ValidationFailedException extends HttpException {
  constructor(readonly details: ApiFieldError[]) {
    super('Validation failed', HttpStatus.BAD_REQUEST);
  }
}

/**
 * Converts every error into the shared `ApiError` shape. Unexpected errors are logged
 * with their stack server-side and reported to clients only as a generic 500, so database
 * errors, secrets and stack traces never leak.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const { statusCode, message, details } = describe(exception);

    if (statusCode >= 500) {
      this.logger.error(
        { err: exception, requestId: req.id, path: req.originalUrl },
        'Unhandled error while processing request',
      );
    }

    const body: ApiError = {
      statusCode,
      error: statusText(statusCode),
      message,
      ...(details ? { details } : {}),
      requestId: typeof req.id === 'string' ? req.id : undefined,
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
    };
    res.status(statusCode).json(body);
  }
}

function statusText(statusCode: number): string {
  const name = (HttpStatus as unknown as Record<number, string | undefined>)[statusCode];
  return name ? name.replace(/_/g, ' ') : 'ERROR';
}

export function describe(exception: unknown): {
  statusCode: number;
  message: string;
  details?: ApiFieldError[];
} {
  if (exception instanceof ValidationFailedException) {
    return { statusCode: 400, message: 'Validation failed', details: exception.details };
  }
  if (exception instanceof HttpException) {
    const statusCode = exception.getStatus();
    const response = exception.getResponse();
    let message = exception.message;
    if (typeof response === 'object' && response && 'message' in response) {
      const m = response.message;
      message = Array.isArray(m) ? m.join('; ') : String(m);
    }
    return { statusCode, message: statusCode >= 500 ? 'Internal server error' : message };
  }
  if (exception instanceof Prisma.PrismaClientKnownRequestError) {
    switch (exception.code) {
      case 'P2002': {
        const target = exception.meta?.target as string[] | string | undefined;
        const field = Array.isArray(target) ? target.join(', ') : (target ?? 'value');
        return { statusCode: 409, message: `A record with this ${field} already exists` };
      }
      case 'P2025':
        return { statusCode: 404, message: 'Resource not found' };
      case 'P2003':
        return { statusCode: 409, message: 'This record is referenced by other records' };
    }
  }
  return { statusCode: 500, message: 'Internal server error' };
}
