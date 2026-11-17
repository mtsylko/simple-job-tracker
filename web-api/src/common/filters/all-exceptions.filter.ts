import {
  ArgumentsHost,
  Catch,
  HttpException,
  Logger,
  HttpStatus
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import type { Request } from 'express';

type RequestWithUser = Request & { user?: { id?: string } };

/**
 * Logs every unhandled exception with the request context, then delegates to
 * Nest's default handling so response shapes are unchanged. Without this an
 * upstream failure reaches the client as a bare 500 and leaves no trace of why.
 */
@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  private readonly logger = new Logger('UnhandledException');

  catch(exception: unknown, host: ArgumentsHost): void {
    const request = host.switchToHttp().getRequest<RequestWithUser>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // 4xx is the client being told no, which the request log already records.
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      const { method, url } = request;
      const userId = request.user?.id ?? 'anonymous';

      this.logger.error(
        `${method} ${url} failed with ${status} for user ${userId}`,
        exception instanceof Error ? exception.stack : String(exception)
      );
    }

    super.catch(exception, host);
  }
}
