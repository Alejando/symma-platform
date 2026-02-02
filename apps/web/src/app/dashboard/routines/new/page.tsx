'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ExerciseCatalog } from '@/components/routines/exercise-catalog';
import { RoutineBuilder, type BuilderItem } from '@/components/routines/routine-builder';
import type { Exercise, Patient, CreateRoutineDto } from '@symma/shared-types';

import { getExercises, getPatients, createRoutine } from '@/lib/api';

export default function NewRoutinePage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [items, setItems] = useState<BuilderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!session?.user?.accessToken) return;
      try {
        const [fetchedExercises, fetchedPatients] = await Promise.all([
          getExercises(session.user.accessToken),
          getPatients(session.user.accessToken),
        ]);
        setExercises(fetchedExercises);
        setPatients(fetchedPatients);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [session?.user?.accessToken]);



  const handleAddExercise = (exercise: Exercise) => {
    const newItem: BuilderItem = {
      id: crypto.randomUUID(),
      exercise,
      sets: 3,
      repsPerSet: 10,
      targetHoldSeconds: exercise.defaultConfig?.holdTime || 5, // Keep existing fallback logic
      restBetweenSets: exercise.defaultConfig?.restTime || 60,
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
      await createRoutine(session.user.accessToken, createData);
      router.push('/dashboard/routines'); // Or wherever appropriate
    } catch (error) {
      console.error('Failed to create routine:', error);
      // Ideally show toast error here
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

  return (
    <div className="flex h-full overflow-hidden">
      {/* Exercise Catalog Sidebar */}
      <ExerciseCatalog
        exercises={exercises}
        onAddExercise={handleAddExercise}
      />

      {/* Main Builder Area */}
      <RoutineBuilder
        patients={patients}
        items={items}
        onItemsChange={setItems}
        onSubmit={handleSubmit}
        loading={saving}
      />
    </div>
  );
}
