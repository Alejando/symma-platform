'use client';

import { useState } from 'react';
import type { Exercise, Patient, CreateRoutineDto } from '@symma/shared-types';

export type BuilderItem = {
  id: string;
  exercise: Exercise;
  targetRepetitions: number;
  targetSets: number;
  holdTimeSeconds: number;
};

interface RoutineBuilderProps {
  patients: Patient[];
  preSelectedPatientId?: string;
  items: BuilderItem[];
  onItemsChange: (items: BuilderItem[]) => void;
  onSubmit: (data: CreateRoutineDto) => void;
  onCancel?: () => void;
  loading?: boolean;
}

export function RoutineBuilder({
  patients,
  preSelectedPatientId,
  items,
  onItemsChange,
  onSubmit,
  onCancel,
  loading = false
}: RoutineBuilderProps) {
  const [name, setName] = useState('New Routine');
  const [patientId, setPatientId] = useState(preSelectedPatientId || patients[0]?.id || '');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');

  // Keep these handlers here or pass them? Logic is here, state update via prop.
  const handleRemoveItem = (itemId: string) => {
    onItemsChange(items.filter((item) => item.id !== itemId));
  };

  const handleUpdateItem = (itemId: string, field: keyof BuilderItem, value: number) => {
    onItemsChange(
      items.map((item) => (item.id === itemId ? { ...item, [field]: value } : item))
    );
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < newItems.length) {
      [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
      onItemsChange(newItems);
    }
  };

  const handleSubmit = () => {
    if (!patientId || !name || items.length === 0) return;

    const routineDto: CreateRoutineDto = {
      patientId,
      name,
      startDate,
      endDate: endDate || undefined,
      items: items.map((item) => ({
        exerciseId: item.exercise.id,
        targetRepetitions: item.targetRepetitions,
        targetSets: item.targetSets,
        holdTimeSeconds: item.holdTimeSeconds,
      })),
    };
    onSubmit(routineDto);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#f6f8f8] relative overflow-hidden h-full">
      {/* Workspace Header */}
      <div className="px-8 py-6 flex flex-col md:flex-row md:items-start justify-between bg-white border-b border-slate-200 shadow-sm shrink-0 gap-4">
        <div className="flex flex-col gap-2 w-full max-w-xl">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#0d9488]/10 text-[#0d9488]">
              Draft
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Patient:</span>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                disabled={!!preSelectedPatientId}
                className={`text-sm font-medium text-slate-800 border-none bg-transparent focus:ring-0 p-0 ${preSelectedPatientId ? 'cursor-default opacity-100' : 'cursor-pointer hover:underline'}`}
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
            className="text-3xl font-bold text-slate-900 bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-[#0d9488] focus:ring-0 p-0 transition-colors placeholder-slate-300 w-full"
            placeholder="Routine Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="flex gap-4 mt-2">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs border-slate-200 rounded p-1"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">End Date (Optional)</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs border-slate-200 rounded p-1"
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500 mr-2 hidden md:inline">
            Est. Duration: <span className="font-bold text-slate-900">~{items.length * 2} mins</span>
          </span>
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={loading || items.length === 0}
            className="flex items-center justify-center h-10 px-6 rounded-lg bg-[#0d9488] text-white text-sm font-bold shadow-sm hover:bg-[#0b847a] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Saving...' : 'Save Routine'}
          </button>
        </div>
      </div>

      {/* Builder Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-4">
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
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col md:flex-row items-start gap-4 group transition-all hover:shadow-md"
              >
                <div className="flex md:flex-col items-center gap-2 mt-1 text-slate-400 w-full md:w-auto justify-between md:justify-start">
                  <div className="flex items-center gap-2 md:flex-col">
                    <span className="material-symbols-outlined cursor-move">drag_indicator</span>
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 rounded px-1.5 py-0.5">
                      {(index + 1).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className="flex gap-1 md:hidden">
                    <button onClick={() => moveItem(index, 'up')} disabled={index === 0} className="p-1 hover:bg-slate-100 rounded">
                      <span className="material-symbols-outlined text-sm">arrow_upward</span>
                    </button>
                    <button onClick={() => moveItem(index, 'down')} disabled={index === items.length - 1} className="p-1 hover:bg-slate-100 rounded">
                      <span className="material-symbols-outlined text-sm">arrow_downward</span>
                    </button>
                  </div>
                </div>

                <div
                  className="size-16 rounded-lg bg-slate-100 bg-center bg-cover border border-slate-100 shrink-0 hidden md:block"
                  style={{ backgroundImage: `url('${item.exercise.assetAnimationUrl || '/placeholder-exercise.png'}')` }}
                />

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
                  <div className="lg:col-span-5 flex flex-col justify-center">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-8 w-8 rounded bg-slate-100 bg-center bg-cover border border-slate-100 shrink-0 md:hidden"
                        style={{ backgroundImage: `url('${item.exercise.assetAnimationUrl || '/placeholder-exercise.png'}')` }}
                      />
                      <div className="min-w-0">
                        <h4 className="text-lg font-bold text-slate-900 truncate">{item.exercise.name}</h4>
                        <p className="text-xs text-slate-500 md:hidden">{item.exercise.category}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-2 mt-1 hidden md:block">{item.exercise.description}</p>
                  </div>
                  <div className="lg:col-span-7 flex flex-wrap md:flex-nowrap items-center gap-4">
                    <div className="flex-1 min-w-[80px]">
                      <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">Sets</label>
                      <input
                        className="w-full h-10 rounded-md border-slate-200 bg-slate-50 text-slate-900 text-center font-medium focus:border-[#0d9488] focus:ring-[#0d9488]"
                        type="number"
                        min="1"
                        value={item.targetSets}
                        onChange={(e) => handleUpdateItem(item.id, 'targetSets', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="flex-1 min-w-[80px]">
                      <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">Reps</label>
                      <input
                        className="w-full h-10 rounded-md border-slate-200 bg-slate-50 text-slate-900 text-center font-medium focus:border-[#0d9488] focus:ring-[#0d9488]"
                        type="number"
                        min="1"
                        value={item.targetRepetitions}
                        onChange={(e) => handleUpdateItem(item.id, 'targetRepetitions', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="flex-1 min-w-[80px]">
                      <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">Hold (s)</label>
                      <input
                        className="w-full h-10 rounded-md border-slate-200 bg-slate-50 text-slate-900 text-center font-medium focus:border-[#0d9488] focus:ring-[#0d9488]"
                        type="number"
                        min="0"
                        value={item.holdTimeSeconds}
                        onChange={(e) => handleUpdateItem(item.id, 'holdTimeSeconds', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
                    title="Remove exercise"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                  <div className="hidden md:flex flex-col gap-1">
                    <button onClick={() => moveItem(index, 'up')} disabled={index === 0} className="text-slate-300 hover:text-slate-600 disabled:opacity-30">
                      <span className="material-symbols-outlined text-lg">arrow_upward</span>
                    </button>
                    <button onClick={() => moveItem(index, 'down')} disabled={index === items.length - 1} className="text-slate-300 hover:text-slate-600 disabled:opacity-30">
                      <span className="material-symbols-outlined text-lg">arrow_downward</span>
                    </button>
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
