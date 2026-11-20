import { useSession } from 'next-auth/react';

export function useIsAdmin(): boolean {
  const { data } = useSession();
  return data?.user?.role === 'ADMIN';
}
