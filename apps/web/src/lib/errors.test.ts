import { describe, expect, it } from 'vitest';
import { ApiError, NetworkError, describeApiError } from './errors';

const translate = (key: string) => `errors.${key}`;

describe('describeApiError', () => {
  it('shows the translated reason the API gives for a 403', () => {
    expect(describeApiError(new ApiError(403, 'Solo un administrador puede modificar el catálogo'), translate)).toBe(
      'Solo un administrador puede modificar el catálogo',
    );
  });

  it('describes a 403 without a reason as missing permission', () => {
    expect(describeApiError(new ApiError(403, ''), translate)).toBe('errors.auth.forbidden');
  });

  it('shows the API message for client errors such as a conflict', () => {
    expect(describeApiError(new ApiError(409, 'Exercise in use'), translate)).toBe('Exercise in use');
  });

  it('hides server error details behind a generic message', () => {
    expect(describeApiError(new ApiError(500, 'PrismaClientKnownRequestError'), translate)).toBe('errors.server.internalError');
  });

  it('describes a failed network request as a connection problem', () => {
    expect(describeApiError(new NetworkError(new TypeError('Failed to fetch')), translate)).toBe('errors.network.offline');
  });

  it('never reports a programming error as a connection problem', () => {
    const unexpectedShape = new TypeError("Cannot read properties of undefined (reading 'length')");
    expect(describeApiError(unexpectedShape, translate)).toBe('errors.generic');
  });

  it('falls back to a generic message for unknown errors', () => {
    expect(describeApiError('unexpected', translate)).toBe('errors.generic');
  });
});
