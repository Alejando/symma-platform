'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { getExercises, createExercise, updateExercise, deleteExercise } from '@/lib/api';
import type { CreateExerciseRequest, Exercise, UpdateExerciseRequest } from '@symma/shared-types';
import { ExerciseDialog } from './components/exercise-dialog';
import { useApiErrorHandler } from '@/hooks/use-api-error-handler';
import { Button } from '@/components/ui/button';
import { ErrorAlert } from '@/components/ui/error-alert';
import { Pagination } from '@/components/ui/pagination';

const PAGE_SIZE = 20;
import { EnumLabel } from '@/components/ui/enum-label';

export default function ExercisesPage() {
  const { data: session } = useSession();
  const t = useTranslations('common');
  const handleApiError = useApiErrorHandler();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const accessToken = session?.user?.accessToken;

  const fetchExercises = useCallback(async () => {
    if (!accessToken) return;
    try {
      const result = await getExercises(accessToken, { page, limit: PAGE_SIZE });
      if (result.data.length === 0 && page > 1) {
        setPage(page - 1);
        return;
      }
      setExercises(result.data);
      setTotal(result.total);
    } catch (fetchError) {
      setError(handleApiError(fetchError));
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, handleApiError]);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  const handleCreate = () => {
    setSelectedExercise(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('messages.confirmDeleteExercise'))) return;
    if (!session?.user?.accessToken) return;
    setError(null);
    try {
      await deleteExercise(session.user.accessToken, id);
      await fetchExercises();
    } catch (deleteError) {
      setError(handleApiError(deleteError));
    }
  };

  const handleSubmit = async (data: CreateExerciseRequest | UpdateExerciseRequest) => {
    if (!session?.user?.accessToken) return;
    if (selectedExercise) {
      const updated = await updateExercise(
        session.user.accessToken,
        selectedExercise.id,
        data as UpdateExerciseRequest,
      );
      setExercises(prev => prev.map(e => e.id === updated.id ? updated : e));
    } else {
      await createExercise(session.user.accessToken, data as CreateExerciseRequest);
      await fetchExercises();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0d1b1a]">{t('exercises.title')}</h1>
          <p className="text-gray-500 mt-1">{t('exercises.subtitle')}</p>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-brand text-white hover:bg-brand-hover font-medium shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          {t('buttons.addExercise')}
        </Button>
      </div>

      <ErrorAlert message={error} className="mb-6" />

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-xl border border-[#e7f3f2] shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#f0f9f9] border-b border-[#e7f3f2]">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-brand uppercase tracking-wider">{t('labels.name')}</th>
              <th className="px-6 py-4 text-xs font-semibold text-brand uppercase tracking-wider">{t('labels.type')}</th>
              <th className="px-6 py-4 text-xs font-semibold text-brand uppercase tracking-wider">{t('labels.module')}</th>
              <th className="px-6 py-4 text-xs font-semibold text-brand uppercase tracking-wider">{t('labels.category')}</th>
              <th className="px-6 py-4 text-xs font-semibold text-brand uppercase tracking-wider">{t('labels.key')}</th>
              <th className="px-6 py-4 text-xs font-semibold text-brand uppercase tracking-wider text-right">{t('labels.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e7f3f2]">
            {exercises.map((exercise) => (
              <tr key={exercise.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-[#0d1b1a]">{exercise.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                    <EnumLabel enumName="ExerciseType" value={exercise.type} />
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <span className="px-2 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-medium">
                    {exercise.mobileModule ? <EnumLabel enumName="MobileModule" value={exercise.mobileModule} /> : '-'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <span className="px-2 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                    <EnumLabel enumName="ExerciseCategory" value={exercise.category} />
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 font-mono text-xs">{exercise.keyName}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleEdit(exercise)}
                      className="text-gray-500 hover:text-brand hover:bg-brand/10"
                      title={t('buttons.edit')}
                    >
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleDelete(exercise.id)}
                      className="text-gray-500 hover:text-red-600 hover:bg-red-50"
                      title={t('buttons.delete')}
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {exercises.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  {t('messages.noExercisesFoundCreate')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {exercises.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#e7f3f2] p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-gray-300 mb-3">fitness_center</span>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{t('messages.noExercisesYet')}</h3>
            <p className="text-gray-500 text-sm">{t('messages.addFirstExercise')}</p>
          </div>
        ) : (
          exercises.map((exercise) => (
            <div
              key={exercise.id}
              className="bg-white rounded-xl border border-[#e7f3f2] p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-brand">fitness_center</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium text-gray-900">{exercise.name}</h3>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">{exercise.keyName}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                      <EnumLabel enumName="ExerciseType" value={exercise.type} />
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-medium">
                      {exercise.mobileModule ? <EnumLabel enumName="MobileModule" value={exercise.mobileModule} /> : '-'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                      <EnumLabel enumName="ExerciseCategory" value={exercise.category} />
                    </span>
                  </div>
                  {exercise.description && (
                    <p className="mt-2 text-xs text-gray-500 line-clamp-2">{exercise.description}</p>
                  )}
                  <div className="mt-3 flex items-center gap-2 pt-3 border-t border-gray-100">
                    <Button
                      variant="ghost"
                      onClick={() => handleEdit(exercise)}
                      className="flex-1 text-sm font-medium text-brand hover:bg-brand/10"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                      {t('buttons.edit')}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => handleDelete(exercise.id)}
                      className="flex-1 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                      {t('buttons.delete')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6">
        <Pagination page={page} limit={PAGE_SIZE} total={total} onPageChange={setPage} />
      </div>

      <ExerciseDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        exercise={selectedExercise}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
