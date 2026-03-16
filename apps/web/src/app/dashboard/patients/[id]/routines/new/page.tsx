'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ExerciseCatalog } from '@/components/routines/exercise-catalog';
import { RoutineBuilder, type BuilderItem } from '@/components/routines/routine-builder';
import type { Exercise, Patient, CreateRoutineDto } from '@symma/shared-types';
import { MobileModule, ExerciseType } from '@symma/shared-types';
import { getExercises, getPatient, createRoutine } from '@/lib/api';

import { use } from 'react';

export default function NewPatientRoutinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [items, setItems] = useState<BuilderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!session?.user?.accessToken) return;
      try {
        const [fetchedExercises, fetchedPatient] = await Promise.all([
          getExercises(session.user.accessToken),
          getPatient(session.user.accessToken, id),
        ]);
        setExercises(fetchedExercises);
        setPatient(fetchedPatient);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [session?.user?.accessToken, id]);



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
    if (!session?.user?.accessToken) return;
    // In create mode, we always have the full CreateRoutineDto
    const createData = data as CreateRoutineDto;
    setSaving(true);
    try {
      // Ensure the routine is created for the correct patient
      await createRoutine(session.user.accessToken, {
        ...createData,
        patientId: id,
      });
      router.push(`/dashboard/patients/${id}/routines`);
    } catch (error) {
      console.error('Failed to create routine:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0d9488]"></div>
      </div>
    );
  }

  // We wrap the single patient in an array for compatibility with the existing RoutineBuilder
  // component which might expect a list of selectables, but we pre-select or force this one.
  const patientsList = patient ? [patient] : [];

  return (
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
  );
}
