import { useCallback } from 'react';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { AuthenticationError, describeApiError } from '@/lib/errors';

/**
 * Returns the message to show for a failed API call, or null when the
 * session expired and the user is being sent back to the login page.
 */
export function useApiErrorHandler() {
  const t = useTranslations('errors');

  return useCallback(
    (error: unknown): string | null => {
      if (error instanceof AuthenticationError) {
        signOut({ callbackUrl: '/login' });
        return null;
      }

      return describeApiError(error, (key) => t(key));
    },
    [t],
  );
}
