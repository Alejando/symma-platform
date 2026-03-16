import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Response } from 'express';
import { I18nContext } from 'nestjs-i18n';

@Catch(HttpException)
export class I18nExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const responseBody = exception.getResponse() as any;

    let i18n: I18nContext | undefined;
    try {
      i18n = I18nContext.current();
    } catch {
      i18n = undefined;
    }
    let message = responseBody.message || exception.message;

    // Translation logic for custom error keys
    if (i18n && typeof message === 'string' && (message.startsWith('errors.') || message.startsWith('server.'))) {
      try {
        message = i18n.t(message);
      } catch {
        // Ignore translation errors and keep original message
      }
    }

    response.status(status).json({
      ...responseBody,
      message,
      statusCode: status,
      timestamp: new Date().toISOString(),
    });
  }
}
