'use client';

import { useTranslations } from 'next-intl';
import type { Routine } from '@symma/shared-types';
import { Button } from '@/components/ui/button';
import { ErrorAlert } from '@/components/ui/error-alert';

interface ActivateRoutineDialogProps {
  draft: Routine;
  currentActive: Routine | null;
  pending: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ActivateRoutineDialog({
  draft,
  currentActive,
  pending,
  error,
  onConfirm,
  onCancel,
}: ActivateRoutineDialogProps) {
  const t = useTranslations('common');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="activate-routine-title"
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-md m-4 p-6"
      >
        <h3 id="activate-routine-title" className="font-bold text-lg text-gray-900 mb-3">
          {t('routineDetail.activateTitle', { name: draft.name })}
        </h3>
        <p className="text-gray-600 mb-6">
          {currentActive
            ? t('routineDetail.activateReplacesActive', { name: draft.name, active: currentActive.name })
            : t('routineDetail.activateFirst', { name: draft.name })}
        </p>
        <ErrorAlert message={error} className="mb-4" />
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel} className="text-sm font-medium text-gray-700">
            {t('buttons.cancel')}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={pending}
            className="bg-brand hover:bg-brand-hover text-white text-sm font-bold"
          >
            {currentActive ? t('routineDetail.confirmActivateAndArchive') : t('routineDetail.confirmActivate')}
          </Button>
        </div>
      </div>
    </div>
  );
}
