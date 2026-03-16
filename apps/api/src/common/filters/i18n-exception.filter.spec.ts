import { HttpException, HttpStatus } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import type { Response } from 'express';
import { I18nContext } from 'nestjs-i18n';
import { I18nExceptionFilter } from './i18n-exception.filter';

describe('I18nExceptionFilter', () => {
  const createHost = (response: Response): ArgumentsHost => {
    const httpArgumentsHost = {
      getRequest: () => ({}),
      getResponse: () => response,
      getNext: () => undefined,
    };

    return {
      switchToHttp: () => httpArgumentsHost,
      switchToRpc: () => ({} as any),
      switchToWs: () => ({} as any),
      getType: () => 'http',
      getArgByIndex: () => undefined,
      getArgs: () => [],
    } as unknown as ArgumentsHost;
  };

  it('should not throw if I18nContext.current throws', () => {
    const filter = new I18nExceptionFilter();

    const resJson = jest.fn();
    const resStatus = jest.fn().mockReturnValue({ json: resJson });
    const response = { status: resStatus } as unknown as Response;

    jest.spyOn(I18nContext, 'current').mockImplementation(() => {
      throw new Error('no context');
    });

    const exception = new HttpException({ message: 'errors.server.internalError' }, HttpStatus.BAD_REQUEST);

    expect(() => filter.catch(exception, createHost(response))).not.toThrow();

    expect(resStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(resJson).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'errors.server.internalError',
        statusCode: HttpStatus.BAD_REQUEST,
      }),
    );
  });

  it('should translate message when i18n context exists and message is a translation key', () => {
    const filter = new I18nExceptionFilter();

    const resJson = jest.fn();
    const resStatus = jest.fn().mockReturnValue({ json: resJson });
    const response = { status: resStatus } as unknown as Response;

    const t = jest.fn().mockReturnValue('Mensaje traducido');
    jest.spyOn(I18nContext, 'current').mockReturnValue({ t } as any);

    const exception = new HttpException({ message: 'errors.server.internalError' }, HttpStatus.BAD_REQUEST);

    filter.catch(exception, createHost(response));

    expect(t).toHaveBeenCalledWith('errors.server.internalError');
    expect(resJson).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Mensaje traducido',
      }),
    );
  });
});
