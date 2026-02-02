'use client';

import { useState, useEffect } from 'react';
import type { Exercise, Patient, CreateRoutineDto, Routine, UpdateRoutineDto, RoutineItem } from '@symma/shared-types';
import { MobileModule, ExerciseType } from '@symma/shared-types';

export type BuilderItem = {
  id: string;
  exercise: Exercise;
  sets: number;
  repsPerSet: number;
  targetHoldSeconds: number;
  restBetweenSets: number;
  difficultyLevel: number;
  strictMode: boolean;
  allowSkip: boolean;

};

interface RoutineBuilderProps {
  patients: Patient[];
  preSelectedPatientId?: string;
  items: BuilderItem[];
  onItemsChange: (items: BuilderItem[]) => void;
  onSubmit: (data: CreateRoutineDto | UpdateRoutineDto) => void;
  onCancel?: () => void;
  loading?: boolean;
  // Edit mode props
  mode?: 'create' | 'edit';
  initialData?: Routine;
  isLocked?: boolean;
}

export function RoutineBuilder({
  patients,
  preSelectedPatientId,
  items,
  onItemsChange,
  onSubmit,
  onCancel,
  loading = false,
  mode = 'create',
  initialData,
  isLocked = false,
}: RoutineBuilderProps) {
  const [name, setName] = useState(initialData?.name || 'New Routine');
  const [patientId, setPatientId] = useState(preSelectedPatientId || initialData?.patientId || patients[0]?.id || '');
  const [startDate, setStartDate] = useState(
    initialData?.startDate
      ? new Date(initialData.startDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    initialData?.endDate
      ? new Date(initialData.endDate).toISOString().split('T')[0]
      : ''
  );
  const [therapistNotes, setTherapistNotes] = useState(initialData?.therapistNotes || '');

  // Update state when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setPatientId(initialData.patientId);
      setStartDate(new Date(initialData.startDate).toISOString().split('T')[0]);
      setEndDate(initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : '');
      setTherapistNotes(initialData.therapistNotes || '');
    }
  }, [initialData]);

  // Keep these handlers here or pass them? Logic is here, state update via prop.
  const handleRemoveItem = (itemId: string) => {
    if (isLocked) return;
    onItemsChange(items.filter((item) => item.id !== itemId));
  };

  const handleUpdateItem = (itemId: string, field: keyof BuilderItem, value: number | string | boolean) => {
    if (isLocked) return;
    onItemsChange(
      items.map((item) => (item.id === itemId ? { ...item, [field]: value } : item))
    );
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (isLocked) return;
    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < newItems.length) {
      [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
      onItemsChange(newItems);
    }
  };

  const handleSubmit = () => {
    if (!patientId || !name || items.length === 0) return;

    if (mode === 'edit') {
      // For edit mode, only send metadata if locked, or full data if unlocked
      const updateDto: UpdateRoutineDto = {
        name,
        startDate,
        endDate: endDate || undefined,
        therapistNotes: therapistNotes || undefined,
      };

      // Only include items if not locked (routine has no sessions)
      if (!isLocked) {
        updateDto.items = items.map((item) => ({
          exerciseId: item.exercise.id,
          sets: item.sets,
          repsPerSet: item.repsPerSet,
          targetHoldSeconds: item.targetHoldSeconds,
          restBetweenSets: item.restBetweenSets,
          difficultyLevel: item.difficultyLevel,
          strictMode: item.strictMode,
          allowSkip: item.allowSkip,

        }));
      }

      onSubmit(updateDto);
    } else {
      const routineDto: CreateRoutineDto = {
        patientId,
        name,
        startDate,
        endDate: endDate || undefined,
        therapistNotes: therapistNotes || undefined,
        items: items.map((item) => ({
          exerciseId: item.exercise.id,
          sets: item.sets,
          repsPerSet: item.repsPerSet,
          targetHoldSeconds: item.targetHoldSeconds,
          restBetweenSets: item.restBetweenSets,
          difficultyLevel: item.difficultyLevel,
          strictMode: item.strictMode,
          allowSkip: item.allowSkip,

        })),
      };
      onSubmit(routineDto);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#f6f8f8] relative overflow-hidden h-full">
      {/* Workspace Header */}
      <div className="px-4 md:px-8 py-4 md:py-6 flex flex-col gap-4 bg-white border-b border-slate-200 shadow-sm shrink-0">
        <div className="flex flex-col gap-2 w-full">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${mode === 'edit' ? 'bg-blue-100 text-blue-700' : 'bg-[#0d9488]/10 text-[#0d9488]'}`}>
              {mode === 'edit' ? (isLocked ? 'Locked' : 'Edit') : 'Draft'}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs md:text-sm text-slate-500">Patient:</span>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                disabled={!!preSelectedPatientId}
                className={`text-xs md:text-sm font-medium text-slate-800 border-none bg-transparent focus:ring-0 p-0 ${preSelectedPatientId ? 'cursor-default opacity-100' : 'cursor-pointer hover:underline'}`}
              >
                <option value="" disabled>Select Patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <input
            className="text-xl md:text-3xl font-bold text-slate-900 bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-[#0d9488] focus:ring-0 p-0 transition-colors placeholder-slate-300 w-full"
            placeholder="Routine Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="flex gap-3 md:gap-4 mt-1">
            <div className="flex-1 md:flex-none">
              <label className="block text-xs text-slate-500 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs border-slate-200 rounded p-1 w-full md:w-auto"
              />
            </div>
            <div className="flex-1 md:flex-none">
              <label className="block text-xs text-slate-500 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs border-slate-200 rounded p-1 w-full md:w-auto"
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3 justify-between md:justify-end">
          <span className="text-xs md:text-sm text-slate-500 hidden sm:inline">
            Est. Duration: <span className="font-bold text-slate-900">~{items.length * 2} mins</span>
          </span>
          <div className="flex items-center gap-2 flex-1 sm:flex-none justify-end">
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-3 md:px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={loading || items.length === 0}
              className="flex items-center justify-center h-10 px-4 md:px-6 rounded-lg bg-[#0d9488] text-white text-sm font-bold shadow-sm hover:bg-[#0b847a] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Builder Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Locked Alert */}
          {isLocked && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-amber-600">lock</span>
              <div>
                <p className="text-sm font-medium text-amber-800">Routine has sessions</p>
                <p className="text-xs text-amber-700">Exercises are locked to preserve historical data. Clone this routine to make changes.</p>
              </div>
            </div>
          )}
          {items.length === 0 ? (
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 flex flex-col items-center justify-center text-center">
              <div className="bg-slate-100 p-4 rounded-full mb-4">
                <span className="material-symbols-outlined text-slate-400 text-4xl">drag_indicator</span>
              </div>
              <h4 className="text-lg font-medium text-slate-900">Start Building</h4>
              <p className="text-slate-500 mt-1">Add exercises from the catalog on the left</p>
            </div>
          ) : (
            items.map((item, index) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-5 group transition-all hover:shadow-md"
              >
                {/* Top row: Drag handle, Exercise info, Delete button */}
                <div className="flex items-start gap-3 mb-4">
                  {/* Drag handle and index */}
                  <div className="flex flex-col items-center gap-1 text-slate-400 pt-1">
                    <span className="material-symbols-outlined cursor-move text-lg">drag_indicator</span>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 rounded px-1.5 py-0.5">
                      {(index + 1).toString().padStart(2, '0')}
                    </span>
                  </div>

                  {/* Exercise image */}
                  <div
                    className="size-14 md:size-16 rounded-lg bg-slate-100 bg-center bg-cover border border-slate-100 shrink-0"
                    style={{ backgroundImage: `url('${item.exercise.assetAnimationUrl || '/placeholder-exercise.png'}')` }}
                  />

                  {/* Exercise info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base md:text-lg font-bold text-slate-900 truncate">{item.exercise.name}</h4>
                    <p className="text-xs text-slate-500">{item.exercise.category} • {item.exercise.type.replace('_', ' ')}</p>
                    <p className="text-sm text-slate-500 line-clamp-1 mt-1 hidden lg:block">{item.exercise.description}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {!isLocked && (
                      <>
                        <div className="hidden md:flex gap-1">
                          <button onClick={() => moveItem(index, 'up')} disabled={index === 0} className="p-1 text-slate-300 hover:text-slate-600 disabled:opacity-30 rounded">
                            <span className="material-symbols-outlined text-lg">arrow_upward</span>
                          </button>
                          <button onClick={() => moveItem(index, 'down')} disabled={index === items.length - 1} className="p-1 text-slate-300 hover:text-slate-600 disabled:opacity-30 rounded">
                            <span className="material-symbols-outlined text-lg">arrow_downward</span>
                          </button>
                        </div>
                        <div className="flex md:hidden gap-1">
                          <button onClick={() => moveItem(index, 'up')} disabled={index === 0} className="p-1 hover:bg-slate-100 rounded">
                            <span className="material-symbols-outlined text-sm text-slate-400">arrow_upward</span>
                          </button>
                          <button onClick={() => moveItem(index, 'down')} disabled={index === items.length - 1} className="p-1 hover:bg-slate-100 rounded">
                            <span className="material-symbols-outlined text-sm text-slate-400">arrow_downward</span>
                          </button>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Remove exercise"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Inputs row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  {/* Row 1: Module & Type - REMOVED */}
                  {/* Row 2: Metrics */}
                  < div className="col-span-2 md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-3" >


                    <div>
                      <label className="block text-[10px] md:text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">Sets</label>
                      <input
                        className={`w-full h-8 md:h-9 rounded-md border-slate-200 text-center text-sm focus:border-[#0d9488] focus:ring-[#0d9488] ${isLocked ? 'bg-slate-100' : 'bg-slate-50'}`}
                        type="number"
                        min="1"
                        value={item.sets}
                        onChange={(e) => handleUpdateItem(item.id, 'sets', parseInt(e.target.value) || 0)}
                        disabled={isLocked}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] md:text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">Reps</label>
                      <input
                        className={`w-full h-8 md:h-9 rounded-md border-slate-200 text-center text-sm focus:border-[#0d9488] focus:ring-[#0d9488] ${isLocked ? 'bg-slate-100' : 'bg-slate-50'}`}
                        type="number"
                        min="1"
                        value={item.repsPerSet}
                        onChange={(e) => handleUpdateItem(item.id, 'repsPerSet', parseInt(e.target.value) || 0)}
                        disabled={isLocked}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] md:text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">Hold (s)</label>
                      <input
                        className={`w-full h-8 md:h-9 rounded-md border-slate-200 text-center text-sm focus:border-[#0d9488] focus:ring-[#0d9488] ${isLocked || item.exercise.type === ExerciseType.ISOTONIC ? 'bg-slate-100 cursor-not-allowed opacity-60' : 'bg-slate-50'}`}
                        type="number"
                        min="0"
                        value={item.targetHoldSeconds}
                        onChange={(e) => handleUpdateItem(item.id, 'targetHoldSeconds', parseInt(e.target.value) || 0)}
                        disabled={isLocked || item.exercise.type === ExerciseType.ISOTONIC}
                      />
                    </div>
                  </div>
                </div>

                {/* Row 3: Advanced Config */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-[10px] md:text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">Rest (s)</label>
                    <input
                      className={`w-full h-8 md:h-9 rounded-md border-slate-200 text-center text-sm focus:border-[#0d9488] focus:ring-[#0d9488] ${isLocked ? 'bg-slate-100' : 'bg-slate-50'}`}
                      type="number"
                      min="0"
                      value={item.restBetweenSets}
                      onChange={(e) => handleUpdateItem(item.id, 'restBetweenSets', parseInt(e.target.value) || 0)}
                      disabled={isLocked}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] md:text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">Diff (0.1-3)</label>
                    <input
                      className={`w-full h-8 md:h-9 rounded-md border-slate-200 text-center text-sm focus:border-[#0d9488] focus:ring-[#0d9488] ${isLocked ? 'bg-slate-100' : 'bg-slate-50'}`}
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="3.0"
                      value={item.difficultyLevel}
                      onChange={(e) => handleUpdateItem(item.id, 'difficultyLevel', parseFloat(e.target.value) || 1.0)}
                      disabled={isLocked}
                    />
                  </div>
                  <div className="md:col-span-2 flex items-center justify-end gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.strictMode}
                        onChange={(e) => handleUpdateItem(item.id, 'strictMode', e.target.checked as any)}
                        disabled={isLocked}
                        className="rounded border-slate-300 text-[#0d9488] focus:ring-[#0d9488]"
                      />
                      <span className="text-xs font-medium text-slate-600">Strict</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.allowSkip}
                        onChange={(e) => handleUpdateItem(item.id, 'allowSkip', e.target.checked as any)}
                        disabled={isLocked}
                        className="rounded border-slate-300 text-[#0d9488] focus:ring-[#0d9488]"
                      />
                      <span className="text-xs font-medium text-slate-600">Skip</span>
                    </label>
                  </div>
                </div>
              </div>
            ))
          )}

          <div className="h-2 rounded-full bg-[#0d9488]/10 w-full mt-2"></div>
        </div>
      </div>
    </div>
  );
}
