'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, limit, total, onPageChange }: PaginationProps) {
  const t = useTranslations('common.pagination');
  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (total === 0) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <nav className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-700">
      <p>{t('showing', { start, end, total })}</p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          {t('previous')}
        </Button>
        <span>{t('page', { current: page, total: totalPages })}</span>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
          {t('next')}
        </Button>
      </div>
    </nav>
  );
}
