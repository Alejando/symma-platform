import {
  ConflictException,
  HttpStatus,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { I18nExceptionFilter } from './i18n-exception.filter';

describe('I18nExceptionFilter', () => {
  const translate = jest.fn(
    (key: string, options: { lang: string; args?: Record<string, unknown> }) =>
      `${options.lang}:${key}${options.args ? JSON.stringify(options.args) : ''}`,
  );
  const filter = new I18nExceptionFilter({
    translate,
  } as unknown as I18nService);

  const respond = (exception: unknown, acceptLanguage?: string) => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: { 'accept-language': acceptLanguage } }),
        getResponse: () => ({ status }) as unknown as Response,
      }),
    } as unknown as ArgumentsHost;

    filter.catch(exception, host);

    return {
      status: status.mock.calls[0][0] as number,
      body: json.mock.calls[0][0] as Record<string, unknown>,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(I18nContext, 'current').mockReturnValue(undefined);
  });

  it('translates an error key with the Accept-Language of the request', () => {
    const { status, body } = respond(
      new NotFoundException('errors.patients.notFound'),
      'en-US,en;q=0.9',
    );

    expect(status).toBe(404);
    expect(body).toMatchObject({
      statusCode: 404,
      error: 'Not Found',
      message: 'en:errors.patients.notFound',
    });
  });

  it('defaults to Spanish', () => {
    const { body } = respond(new NotFoundException('errors.patients.notFound'));

    expect(body.message).toBe('es:errors.patients.notFound');
  });

  it('prefers the language resolved by nestjs-i18n', () => {
    jest.spyOn(I18nContext, 'current').mockReturnValue({ lang: 'en' } as never);

    const { body } = respond(
      new NotFoundException('errors.patients.notFound'),
      'es',
    );

    expect(body.message).toBe('en:errors.patients.notFound');
  });

  it('passes interpolation arguments and keeps them out of the body', () => {
    const { body } = respond(
      new ConflictException({
        message: 'errors.exercises.inUse',
        args: { routines: 2 },
      }),
      'es',
    );

    expect(body.message).toBe('es:errors.exercises.inUse{"routines":2}');
    expect(body).not.toHaveProperty('args');
  });

  it('translates each validation message', () => {
    const { body } = respond(
      new ConflictException({
        message: [
          { key: 'errors.validation.required', args: { property: 'name' } },
        ],
      }),
      'en',
    );

    expect(body.message).toEqual([
      'en:errors.validation.required{"property":"name"}',
    ]);
  });

  it('replaces untranslated framework messages by the status default', () => {
    const { body } = respond(new UnauthorizedException(), 'en');

    expect(body.message).toBe('en:errors.auth.unauthorized');
  });

  it.each([
    ['P2002', HttpStatus.CONFLICT, 'errors.database.uniqueConstraint'],
    ['P2003', HttpStatus.CONFLICT, 'errors.database.foreignKeyConstraint'],
    ['P2025', HttpStatus.NOT_FOUND, 'errors.server.notFound'],
  ])('maps Prisma %s to HTTP %i', (code, expectedStatus, expectedKey) => {
    const { status, body } = respond(
      new Prisma.PrismaClientKnownRequestError('prisma', {
        code,
        clientVersion: 'test',
      }),
      'es',
    );

    expect(status).toBe(expectedStatus);
    expect(body.message).toBe(`es:${expectedKey}`);
  });

  it('hides unexpected errors behind a translated 500', () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const { status, body } = respond(new Error('secret detail'), 'es');

    expect(status).toBe(500);
    expect(body.message).toBe('es:errors.server.internalError');
    expect(JSON.stringify(body)).not.toContain('secret detail');
  });
});
