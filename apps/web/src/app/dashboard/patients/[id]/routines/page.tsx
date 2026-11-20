'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getPatientRoutines, cloneRoutine, deleteRoutine, activateRoutine } from '@/lib/api';
import type { Routine } from '@symma/shared-types';
import { Button } from '@/components/ui/button';
import { EnumLabel } from '@/components/ui/enum-label';
import { ErrorAlert } from '@/components/ui/error-alert';
import { ActivateRoutineDialog } from '@/components/routines/activate-routine-dialog';
import { useApiErrorHandler } from '@/hooks/use-api-error-handler';
import { useDateFormatter } from '@/hooks/use-date-formatter';

export default function PatientRoutinesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const t = useTranslations('common');
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draftToActivate, setDraftToActivate] = useState<Routine | null>(null);
  const [activationError, setActivationError] = useState<string | null>(null);
  const handleApiError = useApiErrorHandler();
  const formatDate = useDateFormatter();

  const loadRoutines = useCallback(async () => {
    try {
      setRoutines(await getPatientRoutines(id));
    } catch (loadError) {
      setError(handleApiError(loadError));
    } finally {
      setLoading(false);
    }
  }, [id, handleApiError]);

  useEffect(() => {
    loadRoutines();
  }, [loadRoutines]);

  const handleClone = async (routineId: string) => {
    setActionLoading(routineId);
    setError(null);
    try {
      const cloned = await cloneRoutine(routineId);
      router.push(`/dashboard/patients/${id}/routines/${cloned.id}/edit`);
    } catch (cloneError) {
      setError(handleApiError(cloneError));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (routineId: string, routineName: string) => {
    if (!confirm(t('routineDetail.confirmDeleteRoutine', { name: routineName }))) return;

    setActionLoading(routineId);
    setError(null);
    try {
      await deleteRoutine(routineId);
      await loadRoutines();
    } catch (deleteError) {
      setError(handleApiError(deleteError));
    } finally {
      setActionLoading(null);
    }
  };

  const openActivation = (draft: Routine) => {
    setActivationError(null);
    setDraftToActivate(draft);
  };

  const confirmActivation = async () => {
    if (!draftToActivate) return;
    setActionLoading(draftToActivate.id);
    setActivationError(null);
    try {
      await activateRoutine(draftToActivate.id);
      setDraftToActivate(null);
      await loadRoutines();
    } catch (activateError) {
      setActivationError(handleApiError(activateError));
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }

  const currentActiveRoutine = routines.find((r) => r.status === 'ACTIVE') ?? null;
  const draftRoutines = routines.filter((r) => r.status === 'DRAFT');
  const activeRoutines = routines.filter((r) => r.status === 'ACTIVE' && (!r.endDate || new Date(r.endDate) > new Date()));
  const historyRoutines = routines.filter(
    (r) => r.status === 'ARCHIVED' || (r.status === 'ACTIVE' && r.endDate && new Date(r.endDate) <= new Date()),
  );

  return (
    <div className="space-y-6 md:space-y-8 max-w-5xl mx-auto">
      <ErrorAlert message={error} />

      {/* Active Routine Section */}
      <section>
        <h2 className="text-base md:text-lg font-semibold text-[#0d1b1a] mb-3 md:mb-4">{t('routineDetail.activeRoutine')}</h2>
        {activeRoutines.length > 0 ? (
          <div className="grid gap-4">
            {activeRoutines.map((routine) => (
              <div
                key={routine.id}
                className="bg-white border border-[#e7f3f2] rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                  <div className="min-w-0">
                    <h3 className="text-lg md:text-xl font-bold text-[#0d1b1a] mb-1 truncate">{routine.name}</h3>
                    <p className="text-sm text-gray-500">
                      {t('routineDetail.started')} {formatDate.calendarDate(routine.startDate)}
                    </p>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end gap-2">
                    <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide">
                      {t('routineDetail.active')}
                    </span>
                    <Link
                      href={`/dashboard/patients/${id}/routines/${routine.id}`}
                      className="text-sm text-brand hover:text-brand-hover font-medium flex items-center gap-1"
                    >
                      {t('routineDetail.analytics')}
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                  </div>
                </div>

                {routine.therapistNotes && (
                  <div className="mb-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 italic">
                    &quot;{routine.therapistNotes}&quot;
                  </div>
                )}

                <div className="border-t border-[#e7f3f2] pt-4">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{t('nav.exercises')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {routine.items?.map((item) => (
                      <span
                        key={item.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-[#f0f9f9] text-brand border border-[#e0f2f1]"
                      >
                        {item.exercise?.name}
                        <span className="text-brand/60 text-xs ml-1">
                          {item.sets}x{item.repsPerSet}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="border-t border-[#e7f3f2] pt-3 md:pt-4 mt-3 md:mt-4 flex flex-wrap items-center gap-2 md:gap-3">
                  <Link
                    href={`/dashboard/patients/${id}/routines/${routine.id}/edit`}
                    className="inline-flex items-center gap-1 px-2 md:px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                    <span className="hidden sm:inline">{t('buttons.edit')}</span>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleClone(routine.id)}
                    disabled={actionLoading === routine.id}
                    className="text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                  >
                    <span className="material-symbols-outlined text-[18px]">content_copy</span>
                    <span className="hidden sm:inline">{t('routineDetail.clone')}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(routine.id, routine.name)}
                    disabled={actionLoading === routine.id}
                    className="text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 ml-auto"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                    <span className="hidden sm:inline">{t('buttons.delete')}</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <span className="material-symbols-outlined text-gray-300 text-4xl mb-2">assignment_late</span>
            <p className="text-gray-500 font-medium">{t('routineDetail.noActiveRoutine')}</p>
            <p className="text-sm text-gray-500 mt-1">{t('routineDetail.assignNewRoutine')}</p>
          </div>
        )}
      </section>

      {draftRoutines.length > 0 && (
        <section>
          <h2 className="text-base md:text-lg font-semibold text-[#0d1b1a] mb-3 md:mb-4">{t('routineDetail.drafts')}</h2>
          <div className="grid gap-4">
            {draftRoutines.map((routine) => (
              <div
                key={routine.id}
                className="bg-white border border-dashed border-amber-300 rounded-xl p-4 md:p-6 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-lg font-bold text-[#0d1b1a] truncate">{routine.name}</h3>
                      <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide">
                        <EnumLabel enumName="RoutineStatus" value={routine.status} />
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{t('routineDetail.draftExplanation')}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Link
                      href={`/dashboard/patients/${id}/routines/${routine.id}/edit`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                      {t('buttons.edit')}
                    </Link>
                    <Button
                      size="sm"
                      onClick={() => openActivation(routine)}
                      disabled={actionLoading === routine.id}
                      className="bg-brand hover:bg-brand-hover text-white text-sm font-semibold"
                    >
                      <span className="material-symbols-outlined text-[18px]">play_circle</span>
                      {t('routineDetail.activate')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(routine.id, routine.name)}
                      disabled={actionLoading === routine.id}
                      className="text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                      <span className="hidden sm:inline">{t('buttons.delete')}</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {draftToActivate && (
        <ActivateRoutineDialog
          draft={draftToActivate}
          currentActive={currentActiveRoutine}
          pending={actionLoading === draftToActivate.id}
          error={activationError}
          onConfirm={confirmActivation}
          onCancel={() => setDraftToActivate(null)}
        />
      )}

      {/* History Section */}
      {historyRoutines.length > 0 && (
        <section>
          <h2 className="text-base md:text-lg font-semibold text-[#0d1b1a] mb-3 md:mb-4">{t('routineDetail.routineHistory')}</h2>

          {/* Desktop Table */}
          <div className="hidden md:block bg-white border border-[#e7f3f2] rounded-xl overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('routineDetail.routineName')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('routineDetail.duration')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('nav.exercises')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('labels.status')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {historyRoutines.map((routine) => (
                  <tr key={routine.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        <Link href={`/dashboard/patients/${id}/routines/${routine.id}`} className="hover:text-brand hover:underline">
                          {routine.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {formatDate.calendarDate(routine.startDate)} -{' '}
                        {routine.endDate ? formatDate.calendarDate(routine.endDate) : t('routineDetail.present')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {routine.items?.slice(0, 3).map((item) => (
                          <span key={item.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {item.exercise?.name}
                          </span>
                        ))}
                        {(routine.items?.length || 0) > 3 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {t('routineDetail.more', { count: routine.items!.length - 3 })}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        <EnumLabel enumName="RoutineStatus" value={routine.status} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {historyRoutines.map((routine) => (
              <div
                key={routine.id}
                className="bg-white border border-[#e7f3f2] rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/dashboard/patients/${id}/routines/${routine.id}`}
                      className="font-medium text-gray-900 hover:text-brand block truncate"
                    >
                      {routine.name}
                    </Link>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate.calendarDate(routine.startDate)} - {routine.endDate ? formatDate.calendarDate(routine.endDate) : t('routineDetail.present')}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 shrink-0">
                    <EnumLabel enumName="RoutineStatus" value={routine.status} />
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {routine.items?.slice(0, 2).map((item) => (
                    <span key={item.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                      {item.exercise?.name}
                    </span>
                  ))}
                  {(routine.items?.length || 0) > 2 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                      {t('routineDetail.more', { count: routine.items!.length - 2 })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
