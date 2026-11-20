'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { SessionItemDetailResponse } from '@symma/shared-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function SnapshotPlaceholder({ message }: { message: string }) {
  return (
    <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-center text-xs text-gray-600">
      <span className="material-symbols-outlined text-2xl text-gray-400" aria-hidden="true">no_photography</span>
      {message}
    </div>
  );
}

function BestAttemptSnapshot({ item }: { item: SessionItemDetailResponse }) {
  const t = useTranslations('common');
  const [failedToLoad, setFailedToLoad] = useState(false);

  if (!item.snapshotUrl) {
    return <SnapshotPlaceholder message={t('sessionDetail.noSnapshot')} />;
  }

  if (failedToLoad) {
    return <SnapshotPlaceholder message={t('sessionDetail.snapshotUnavailable')} />;
  }

  return (
    <Image
      src={item.snapshotUrl}
      alt={t('sessionDetail.bestAttemptAlt', { exercise: item.exerciseName })}
      width={320}
      height={240}
      unoptimized
      onError={() => setFailedToLoad(true)}
      className="aspect-[4/3] w-full rounded-lg object-cover"
    />
  );
}

export function BestAttemptGallery({ items }: { items: SessionItemDetailResponse[] }) {
  const t = useTranslations('common');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('sessionDetail.bestAttempts')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.id}>
              <figure className="space-y-2">
                <BestAttemptSnapshot item={item} />
                <figcaption className="text-sm font-medium text-gray-900">{item.exerciseName}</figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
