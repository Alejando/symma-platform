'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';

export function SessionExpired() {
  const t = useTranslations('errors');

  useEffect(() => {
    signOut({ callbackUrl: '/login' });
  }, []);

  return <p className="p-8 text-sm text-gray-600">{t('auth.tokenExpired')}</p>;
}
