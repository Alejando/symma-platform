import { renderHook } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, AuthenticationError } from '@/lib/errors';
import { esMessages } from '@/test/render-with-intl';
import { useApiErrorHandler } from './use-api-error-handler';

const mockSignOut = vi.fn();

vi.mock('next-auth/react', () => ({
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider locale="es" messages={esMessages}>
      {children}
    </NextIntlClientProvider>
  );
}

describe('useApiErrorHandler', () => {
  beforeEach(() => {
    mockSignOut.mockClear();
  });

  it('sends the user to login when the session expired', () => {
    const { result } = renderHook(() => useApiErrorHandler(), { wrapper });

    expect(result.current(new AuthenticationError())).toBeNull();
    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/login' });
  });

  it('keeps the session and reports missing permission on 403', () => {
    const { result } = renderHook(() => useApiErrorHandler(), { wrapper });

    expect(result.current(new ApiError(403, ''))).toBe(esMessages.errors.auth.forbidden);
    expect(mockSignOut).not.toHaveBeenCalled();
  });
});
