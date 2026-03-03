import { signOut } from 'next-auth/react';
import { useCallback } from 'react';
import { AuthenticationError } from '@/lib/errors';

/**
 * Hook to handle API errors, specifically authentication errors.
 * Returns a function that takes an error and returns true if it was handled
 * (e.g., if it was an AuthenticationError and triggered a redirect to login).
 */
export function useAuthErrorHandler() {
  return useCallback((error: unknown): boolean => {
    if (error instanceof AuthenticationError || (error instanceof Error && error.message === 'Session expired')) {
      // Trigger NextAuth signout which will redirect to the login page
      signOut({ callbackUrl: '/login' });
      return true;
    }
    
    // Check if error is a string that might indicate auth failure
    if (typeof error === 'string' && (error.includes('401') || error.toLowerCase().includes('unauthorized'))) {
      signOut({ callbackUrl: '/login' });
      return true;
    }

    return false;
  }, []);
}
