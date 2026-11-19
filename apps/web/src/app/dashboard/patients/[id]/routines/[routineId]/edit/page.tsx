'use client';

import { use, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ExerciseCatalog } from '@/components/routines/exercise-catalog';
import { RoutineBuilder, type BuilderItem } from '@/components/routines/routine-builder';
import type { Exercise, Patient, Routine, UpdateRoutineDto } from '@symma/shared-types';
import { getAllExercises, getPatient, getRoutine, updateRoutine } from '@/lib/api';
import { ErrorAlert } from '@/components/ui/error-alert';
import { useApiErrorHandler } from '@/hooks/use-api-error-handler';

export default function EditRoutinePage({
  params,
}: {
  params: Promise<{ id: string; routineId: string }>;
}) {
  const { id: patientId, routineId } = use(params);
  const { data: session } = useSession();
  const router = useRouter();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [items, setItems] = useState<BuilderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleApiError = useApiErrorHandler();

  const isLocked = (routine?.sessionsCount ?? 0) > 0;

  useEffect(() => {
    async function fetchData() {
      if (!session?.user?.accessToken) return;
      try {
        const [fetchedExercises, fetchedPatient, fetchedRoutine] = await Promise.all([
          getAllExercises(session.user.accessToken),
          getPatient(session.user.accessToken, patientId),
          getRoutine(session.user.accessToken, routineId),
        ]);
        setExercises(fetchedExercises);
        setPatient(fetchedPatient);
        setRoutine(fetchedRoutine);


        if (fetchedRoutine.items) {
          const builderItems: BuilderItem[] = fetchedRoutine.items.map((item) => ({
            id: item.id,
            exercise: item.exercise!,
            sets: item.sets,
            repsPerSet: item.repsPerSet,
            targetHoldSeconds: item.targetHoldSeconds,
            restBetweenSets: item.restBetweenSets,
            difficultyLevel: item.difficultyLevel,
            strictMode: item.strictMode,
            allowSkip: item.allowSkip,

          }));
          setItems(builderItems);
        }
      } catch (fetchError) {
        setError(handleApiError(fetchError));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [session?.user?.accessToken, patientId, routineId, handleApiError]);

  const handleAddExercise = (exercise: Exercise) => {
    if (isLocked) return;
    const newItem: BuilderItem = {
      id: crypto.randomUUID(),
      exercise,
      sets: 3,
      repsPerSet: 10,
      targetHoldSeconds: 5,
      restBetweenSets: 60,
      difficultyLevel: 1.0,
      strictMode: false,
      allowSkip: true,

    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleSubmit = async (data: UpdateRoutineDto) => {
    if (!session?.user?.accessToken) return;
    setSaving(true);
    setError(null);
    try {
      await updateRoutine(session.user.accessToken, routineId, data);
      router.push(`/dashboard/patients/${patientId}/routines`);
    } catch (saveError) {
      setError(handleApiError(saveError));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }

  const patientsList = patient ? [patient] : [];

  return (
    <div className="flex flex-col gap-4">
      <ErrorAlert message={error} />
      <div className="flex bg-white h-[calc(100vh-140px)] border border-[#e7f3f2] rounded-xl overflow-hidden">
        {/* Exercise Catalog Sidebar - hidden when locked */}
        {!isLocked && (
          <ExerciseCatalog
            exercises={exercises}
            onAddExercise={handleAddExercise}
          />
        )}

        {/* Main Builder Area */}
        <div className="flex-1 min-w-0">
          <RoutineBuilder
            patients={patientsList}
            preSelectedPatientId={patientId}
            items={items}
            onItemsChange={setItems}
            onSubmit={handleSubmit}
            loading={saving}
            onCancel={() => router.push(`/dashboard/patients/${patientId}/routines`)}
            mode="edit"
            initialData={routine || undefined}
            isLocked={isLocked}
          />
        </div>
      </div>
    </div>
  );
}
