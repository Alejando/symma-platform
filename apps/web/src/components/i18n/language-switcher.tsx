'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { locales } from '@/i18n/config';
import { setUserLocale } from '@/i18n/locale-actions';
import { cn } from '@/lib/utils';

export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations('common.language');
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const changeLocale = (nextLocale: string) => {
    startTransition(async () => {
      await setUserLocale(nextLocale);
      router.refresh();
    });
  };

  return (
    <div className={cn('flex items-center gap-2 text-sm text-gray-700', className)}>
      <span className="material-symbols-outlined text-lg" aria-hidden="true">translate</span>
      <select
        aria-label={t('label')}
        value={locale}
        onChange={(event) => changeLocale(event.target.value)}
        disabled={isPending}
        className="bg-transparent border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
      >
        {locales.map((option) => (
          <option key={option} value={option}>
            {t(option)}
          </option>
        ))}
      </select>
    </div>
  );
}
