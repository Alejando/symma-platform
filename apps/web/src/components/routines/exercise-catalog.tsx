'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Exercise } from '@symma/shared-types';
import { EnumLabel } from '@/components/ui/enum-label';
import { Button } from '@/components/ui/button';

interface ExerciseCatalogProps {
  exercises: Exercise[];
  onAddExercise: (exercise: Exercise) => void;
}

export function ExerciseCatalog({ exercises, onAddExercise }: ExerciseCatalogProps) {
  const t = useTranslations('common');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'WARMUP' | 'CORE' | 'COOLDOWN'>('ALL');
  const [isOpen, setIsOpen] = useState(false);

  const filteredExercises = exercises.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase()) ||
      ex.description?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'ALL' || ex.category === filter;
    return matchesSearch && matchesFilter;
  });

  const handleAddExercise = (exercise: Exercise) => {
    onAddExercise(exercise);
    // On mobile, close the drawer after adding
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed bottom-4 left-4 z-30 px-4 py-3 bg-[#0d9488] text-white rounded-full shadow-lg hover:bg-[#0b857a]"
      >
        <span className="material-symbols-outlined">add</span>
        {t('buttons.addExercise')}
      </Button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar/Drawer */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-[85%] max-w-[320px] md:w-[320px] lg:w-[380px]
        flex flex-col border-r border-slate-200 bg-white shrink-0 h-full
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-slate-800">{t('exercises.exerciseCatalog')}</h3>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setIsOpen(false)}
              className="md:hidden"
            >
              <span className="material-symbols-outlined text-slate-400">close</span>
            </Button>
          </div>

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
              placeholder={t('exercises.searchExercises')}
            />
          </div>

          {/* Chips Filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {(['ALL', 'WARMUP', 'CORE', 'COOLDOWN'] as const).map((cat) => (
              <Button
                key={cat}
                variant={filter === cat ? 'default' : 'secondary'}
                size="xs"
                onClick={() => setFilter(cat)}
                className={`rounded-full shrink-0 ${filter === cat
                  ? 'bg-[#0d9488] text-white hover:bg-[#0b847a]'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                {cat === 'ALL' ? t('exercises.all') : <EnumLabel enumName="ExerciseCategory" value={cat} />}
              </Button>
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
                <div className="text-xs text-slate-500 truncate flex items-center gap-1">
                  <EnumLabel enumName="ExerciseCategory" value={exercise.category} /> • <EnumLabel enumName="ExerciseType" value={exercise.type} />
                  {exercise.mobileModule && (
                    <> • <EnumLabel enumName="MobileModule" value={exercise.mobileModule} /></>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => handleAddExercise(exercise)}
                className="text-slate-400 hover:text-[#0d9488] hover:bg-[#0d9488]/10 rounded-full"
                aria-label={`Add ${exercise.name}`}
              >
                <span className="material-symbols-outlined text-[20px]">add_circle</span>
              </Button>
            </div>
          ))}

          {filteredExercises.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-sm">
              {t('messages.noExercisesFound')}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

