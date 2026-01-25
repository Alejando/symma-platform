'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getExercises, createExercise, updateExercise, deleteExercise } from '@/lib/api';
import type { Exercise } from '@symma/shared-types';
import { ExerciseDialog } from './components/exercise-dialog';

export default function ExercisesPage() {
  const { data: session } = useSession();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const fetchExercises = async () => {
    if (!session?.user?.accessToken) return;
    try {
      const data = await getExercises(session.user.accessToken);
      setExercises(data);
    } catch (error) {
      console.error('Failed to fetch exercises', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, [session?.user?.accessToken]);

  const handleCreate = () => {
    setSelectedExercise(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this exercise?')) return;
    if (!session?.user?.accessToken) return;
    try {
      await deleteExercise(session.user.accessToken, id);
      setExercises(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      console.error('Failed to delete', error);
    }
  };

  const handleSubmit = async (data: any) => {
    if (!session?.user?.accessToken) return;
    try {
      if (selectedExercise) {
        // Update
        const updated = await updateExercise(session.user.accessToken, selectedExercise.id, data);
        setExercises(prev => prev.map(e => e.id === updated.id ? updated : e));
      } else {
        // Create
        const created = await createExercise(session.user.accessToken, data);
        setExercises(prev => [...prev, created]);
      }
    } catch (error) {
      throw error; // Let dialog handle error display
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
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0d1b1a]">Exercises</h1>
          <p className="text-gray-500 mt-1">Manage library of exercises</p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-[#0d9488] text-white rounded-lg hover:bg-[#0b857a] flex items-center gap-2 font-medium shadow-sm transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Add Exercise
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#e7f3f2] shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#f0f9f9] border-b border-[#e7f3f2]">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-[#0d9488] uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#0d9488] uppercase tracking-wider">Type</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#0d9488] uppercase tracking-wider">Category</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#0d9488] uppercase tracking-wider">Key</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#0d9488] uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e7f3f2]">
            {exercises.map((exercise) => (
              <tr key={exercise.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-[#0d1b1a]">{exercise.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                    {exercise.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <span className="px-2 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                    {exercise.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 font-mono text-xs">{exercise.keyName}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(exercise)}
                      className="p-1 text-gray-400 hover:text-[#0d9488] hover:bg-[#0d9488]/10 rounded transition-colors"
                      title="Edit"
                    >
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(exercise.id)}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {exercises.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No exercises found. Create one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
