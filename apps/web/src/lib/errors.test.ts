import { describe, expect, it } from 'vitest';
import { ApiError, describeApiError } from './errors';

const translate = (key: string) => `errors.${key}`;

describe('describeApiError', () => {
  it('describes a 403 as missing permission', () => {
    expect(describeApiError(new ApiError(403, 'Forbidden resource'), translate)).toBe('errors.auth.forbidden');
  });

  it('shows the API message for client errors such as a conflict', () => {
    expect(describeApiError(new ApiError(409, 'Exercise in use'), translate)).toBe('Exercise in use');
  });

  it('hides server error details behind a generic message', () => {
    expect(describeApiError(new ApiError(500, 'PrismaClientKnownRequestError'), translate)).toBe('errors.server.internalError');
  });

  it('describes a failed network request as a connection problem', () => {
    expect(describeApiError(new TypeError('Failed to fetch'), translate)).toBe('errors.network.offline');
  });

  it('falls back to a generic message for unknown errors', () => {
    expect(describeApiError('unexpected', translate)).toBe('errors.generic');
  });
});
