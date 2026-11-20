import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { httpExceptionForPrismaError } from '../prisma/prisma-exception.mapper';
import {
  isTranslatableMessage,
  isTranslationKey,
} from '../i18n/translatable-message';
import { languageFromAcceptLanguage } from '../i18n/request-language';

const DEFAULT_KEY_BY_STATUS: Partial<Record<number, string>> = {
  [HttpStatus.BAD_REQUEST]: 'errors.server.badRequest',
  [HttpStatus.UNAUTHORIZED]: 'errors.auth.unauthorized',
  [HttpStatus.FORBIDDEN]: 'errors.auth.forbidden',
  [HttpStatus.NOT_FOUND]: 'errors.server.notFound',
  [HttpStatus.CONFLICT]: 'errors.server.conflict',
  [HttpStatus.TOO_MANY_REQUESTS]: 'errors.server.tooManyRequests',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'errors.server.unavailable',
};

type ErrorBody = Record<string, unknown> & {
  message?: unknown;
  args?: Record<string, unknown>;
};

@Catch()
@Injectable()
export class I18nExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(I18nExceptionFilter.name);

  constructor(private readonly i18n: I18nService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const httpException = this.toHttpException(exception);
    const status = httpException.getStatus();
    const { args, message, ...body } = errorBodyOf(httpException);
    const language =
      I18nContext.current()?.lang ??
      languageFromAcceptLanguage(request.headers['accept-language']);

    response.status(status).json({
      ...body,
      message: this.translate(message, args, status, language),
      statusCode: status,
      timestamp: new Date().toISOString(),
    });
  }

  private toHttpException(exception: unknown): HttpException {
    if (exception instanceof HttpException) {
      return exception;
    }

    const mapped = httpExceptionForPrismaError(exception);
    if (mapped) {
      return mapped;
    }

    this.logger.error(exception);
    return new InternalServerErrorException('errors.server.internalError');
  }

  private translate(
    message: unknown,
    args: Record<string, unknown> | undefined,
    status: number,
    language: string,
  ): string | string[] {
    if (Array.isArray(message)) {
      return message.map((entry) =>
        isTranslatableMessage(entry)
          ? this.translateKey(entry.key, entry.args, language)
          : this.translateKey(defaultKeyFor(status), undefined, language),
      );
    }

    const key = isTranslationKey(message) ? message : defaultKeyFor(status);
    return this.translateKey(key, args, language);
  }

  private translateKey(
    key: string,
    args: Record<string, unknown> | undefined,
    language: string,
  ): string {
    return this.i18n.translate(key, { lang: language, args });
  }
}

function errorBodyOf(exception: HttpException): ErrorBody {
  const response = exception.getResponse();
  return typeof response === 'string'
    ? { message: response }
    : (response as ErrorBody);
}

function defaultKeyFor(status: number): string {
  return (
    DEFAULT_KEY_BY_STATUS[status] ??
    (status >= 500 ? 'errors.server.internalError' : 'errors.generic')
  );
}
