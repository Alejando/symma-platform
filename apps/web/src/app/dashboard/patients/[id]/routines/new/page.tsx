'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ExerciseCatalog } from '@/components/routines/exercise-catalog';
import { RoutineBuilder, type BuilderItem } from '@/components/routines/routine-builder';
import type { Exercise, Patient, CreateRoutineDto } from '@symma/shared-types';
import { getAllExercises, getPatient, createRoutine } from '@/lib/api';
import { ErrorAlert } from '@/components/ui/error-alert';
import { useApiErrorHandler } from '@/hooks/use-api-error-handler';

export default function NewPatientRoutinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [items, setItems] = useState<BuilderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleApiError = useApiErrorHandler();

  useEffect(() => {
    async function fetchData() {
      try {
        const [fetchedExercises, fetchedPatient] = await Promise.all([
          getAllExercises(),
          getPatient(id),
        ]);
        setExercises(fetchedExercises);
        setPatient(fetchedPatient);
      } catch (fetchError) {
        setError(handleApiError(fetchError));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, handleApiError]);



  const handleAddExercise = (exercise: Exercise) => {
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

  const handleSubmit = async (data: CreateRoutineDto | { name?: string }) => {
    const createData = data as CreateRoutineDto;
    setSaving(true);
    setError(null);
    try {
      await createRoutine({
        ...createData,
        patientId: id,
      });
      router.push(`/dashboard/patients/${id}/routines`);
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
      <div className="flex bg-white h-[calc(100vh-180px)] md:h-[calc(100vh-140px)] border border-[#e7f3f2] rounded-xl overflow-hidden relative">
        {/* Exercise Catalog Sidebar */}
        <ExerciseCatalog
          exercises={exercises}
          onAddExercise={handleAddExercise}
        />

        {/* Main Builder Area */}
        <div className="flex-1 min-w-0 w-full">
          <RoutineBuilder
            patients={patientsList}
            preSelectedPatientId={id}
            items={items}
            onItemsChange={setItems}
            onSubmit={handleSubmit}
            loading={saving}
            onCancel={() => router.push(`/dashboard/patients/${id}/routines`)}
          />
        </div>
      </div>
    </div>
  );
}
