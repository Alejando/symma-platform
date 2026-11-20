'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { PatientStatsResponse } from '@symma/shared-types';
import { getPatientStats } from '@/lib/api';
import { usePercentFormatter } from '@/hooks/use-percent-formatter';
import { useApiErrorHandler } from '@/hooks/use-api-error-handler';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { ErrorAlert } from '@/components/ui/error-alert';

interface StatTileProps {
  icon: string;
  label: string;
  value: string | number | null;
  emptyText: string;
}

function StatTile({ icon, label, value, emptyText }: StatTileProps) {
  return (
    <div className="bg-brand/5 p-4 rounded-lg text-center">
      <span className="material-symbols-outlined text-brand text-2xl mb-1">{icon}</span>
      {value === null ? (
        <p className="text-sm font-medium text-gray-600 py-1">{emptyText}</p>
      ) : (
        <p className="text-2xl font-bold text-[#0d1b1a]">{value}</p>
      )}
      <p className="text-xs text-gray-500 font-medium uppercase">{label}</p>
    </div>
  );
}

export function PatientQuickStats({ patientId }: { patientId: string }) {
  const t = useTranslations('common');
  const formatPercent = usePercentFormatter();
  const handleApiError = useApiErrorHandler();
  const formatDate = useDateFormatter();
  const [stats, setStats] = useState<PatientStatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        setStats(await getPatientStats(patientId));
      } catch (loadError) {
        setError(handleApiError(loadError));
      }
    }
    loadStats();
  }, [patientId, handleApiError]);

  return (
    <div className="bg-white border border-[#e7f3f2] rounded-xl p-4 md:p-6 shadow-sm">
      <h3 className="text-base md:text-lg font-semibold text-[#0d1b1a] mb-3 md:mb-4">
        {t('patientDetail.quickStats')}
      </h3>
      <ErrorAlert message={error} />
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatTile
            icon="check_circle"
            label={t('patientDetail.adherence')}
            value={stats.adherencePercent === null ? null : formatPercent(stats.adherencePercent)}
            emptyText={t('patientDetail.noActiveRoutine')}
          />
          <StatTile
            icon="fitness_center"
            label={t('patientDetail.sessionsCompleted')}
            value={stats.sessionsCompleted}
            emptyText={t('patientDetail.noSessionsYet')}
          />
          <StatTile
            icon="event"
            label={t('patientDetail.lastSession')}
            value={stats.lastSessionAt === null ? null : formatDate.mediumDate(stats.lastSessionAt)}
            emptyText={t('patientDetail.noSessionsYet')}
          />
        </div>
      )}
    </div>
  );
}
