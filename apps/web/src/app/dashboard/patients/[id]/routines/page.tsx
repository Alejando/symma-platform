'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { getPatientRoutines, cloneRoutine, deleteRoutine } from '@/lib/api';
import type { Routine } from '@symma/shared-types';
import { Button } from '@/components/ui/button';
import { EnumLabel } from '@/components/ui/enum-label';

import { use } from 'react';

export default function PatientRoutinesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  const t = useTranslations('common');
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function loadRoutines() {
    if (session?.user?.accessToken) {
      try {
        const data = await getPatientRoutines(session.user.accessToken, id);
        setRoutines(data);
      } catch (error) {
        console.error('Failed to load routines:', error);
      } finally {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    loadRoutines();
  }, [session, id]);

  const handleClone = async (routineId: string) => {
    if (!session?.user?.accessToken) return;
    setActionLoading(routineId);
    try {
      const cloned = await cloneRoutine(session.user.accessToken, routineId);
      // Navigate to the edit page for the new cloned routine
      router.push(`/dashboard/patients/${id}/routines/${cloned.id}/edit`);
    } catch (error) {
      console.error('Failed to clone routine:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (routineId: string, routineName: string) => {
    if (!session?.user?.accessToken) return;
    if (!confirm(t('routineDetail.confirmDeleteRoutine', { name: routineName }))) return;

    setActionLoading(routineId);
    try {
      await deleteRoutine(session.user.accessToken, routineId);
      // Refresh the list
      await loadRoutines();
    } catch (error) {
      console.error('Failed to delete routine:', error);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0d9488]"></div>
      </div>
    );
  }

  const activeRoutines = routines.filter((r) => r.status === 'ACTIVE' && (!r.endDate || new Date(r.endDate) > new Date()));
  const historyRoutines = routines.filter((r) => r.status === 'ARCHIVED' || (r.endDate && new Date(r.endDate) <= new Date()));

  return (
    <div className="space-y-6 md:space-y-8 max-w-5xl mx-auto">
      {/* Header Action */}


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
                      {t('routineDetail.started')} {new Date(routine.startDate).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end gap-2">
                    <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide">
                      {t('routineDetail.active')}
                    </span>
                    <Link
                      href={`/dashboard/patients/${id}/routines/${routine.id}`}
                      className="text-sm text-[#0d9488] hover:text-[#0f766e] font-medium flex items-center gap-1"
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
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-[#f0f9f9] text-[#0d9488] border border-[#e0f2f1]"
                      >
                        {item.exercise?.name}
                        <span className="text-[#0d9488]/60 text-xs ml-1">
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
            <p className="text-sm text-gray-400 mt-1">{t('routineDetail.assignNewRoutine')}</p>
          </div>
        )}
      </section>

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
                        <Link href={`/dashboard/patients/${id}/routines/${routine.id}`} className="hover:text-[#0d9488] hover:underline">
                          {routine.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(routine.startDate).toLocaleDateString('es-MX')} -{' '}
                        {routine.endDate ? new Date(routine.endDate).toLocaleDateString('es-MX') : t('routineDetail.present')}
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
                      className="font-medium text-gray-900 hover:text-[#0d9488] block truncate"
                    >
                      {routine.name}
                    </Link>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(routine.startDate).toLocaleDateString('es-MX')} - {routine.endDate ? new Date(routine.endDate).toLocaleDateString('es-MX') : t('routineDetail.present')}
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
