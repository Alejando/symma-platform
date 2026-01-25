'use client';

import { useState } from 'react';
import type { Exercise } from '@symma/shared-types';

interface ExerciseCatalogProps {
  exercises: Exercise[];
  onAddExercise: (exercise: Exercise) => void;
}

export function ExerciseCatalog({ exercises, onAddExercise }: ExerciseCatalogProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'WARMUP' | 'CORE' | 'COOLDOWN'>('ALL');

  const filteredExercises = exercises.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase()) ||
      ex.description?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'ALL' || ex.category === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <aside className="w-full md:w-[380px] flex flex-col border-r border-slate-200 bg-white z-10 shrink-0 h-full">
      <div className="p-4 border-b border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-3">Exercise Catalog</h3>

        {/* Search */}
        <div className="relative mb-3">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-2 pl-10 pr-4 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0d9488] focus:border-[#0d9488] placeholder-slate-400 transition-shadow"
            placeholder="Search exercises..."
          />
        </div>

        {/* Chips Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {(['ALL', 'WARMUP', 'CORE', 'COOLDOWN'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1 text-xs font-medium rounded-full shrink-0 transition-colors ${filter === cat
                  ? 'bg-[#0d9488] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              {cat.charAt(0) + cat.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredExercises.map((exercise) => (
          <div
            key={exercise.id}
            className="group flex items-center gap-3 p-2 bg-white border border-slate-200 rounded-lg hover:border-[#0d9488]/50 hover:shadow-sm cursor-grab active:cursor-grabbing transition-all"
          >
            <div
              className="h-12 w-12 rounded-md bg-slate-100 bg-center bg-cover shrink-0"
              style={{ backgroundImage: `url('${exercise.assetAnimationUrl || '/placeholder-exercise.png'}')` }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{exercise.name}</p>
              <p className="text-xs text-slate-500 truncate">
                {exercise.category} • {exercise.type.replace('_', ' ')}
              </p>
            </div>
            <button
              onClick={() => onAddExercise(exercise)}
              className="p-1.5 text-slate-400 hover:text-[#0d9488] hover:bg-[#0d9488]/10 rounded-full transition-colors"
              aria-label={`Add ${exercise.name}`}
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
            </button>
          </div>
        ))}

        {filteredExercises.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-sm">
            No exercises found matching your filters.
          </div>
        )}
      </div>
    </aside>
  );
}
