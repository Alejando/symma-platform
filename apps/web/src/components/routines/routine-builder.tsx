'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { ExerciseResponse, Patient, CreateRoutineDto, RoutineResponse, UpdateRoutineDto } from '@symma/shared-types';
import { Button } from '@/components/ui/button';
import { EnumLabel } from '@/components/ui/enum-label';
import { ExerciseThumbnail } from './exercise-thumbnail';

type Exercise = ExerciseResponse;
type Routine = RoutineResponse;

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
  const t = useTranslations('common');
  const [name, setName] = useState(initialData?.name || t('routines.newRoutine'));
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
  const therapistNotes = initialData?.therapistNotes ?? '';

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
      const updateDto: UpdateRoutineDto = {
        name,
        startDate,
        endDate: endDate || undefined,
        therapistNotes: therapistNotes || undefined,
      };

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
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${mode === 'edit' ? 'bg-blue-100 text-blue-700' : 'bg-brand/10 text-brand'}`}>
              {mode === 'edit' ? (isLocked ? t('routines.locked') : t('buttons.edit')) : t('routines.newRoutine')}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs md:text-sm text-slate-500">{t('labels.patient')}:</span>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                disabled={!!preSelectedPatientId}
                className={`text-xs md:text-sm font-medium text-slate-800 border-none bg-transparent focus:ring-0 p-0 ${preSelectedPatientId ? 'cursor-default opacity-100' : 'cursor-pointer hover:underline'}`}
              >
                <option value="" disabled>{t('labels.selectPatient')}</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <input
            className="text-xl md:text-3xl font-bold text-slate-900 bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-brand focus:ring-0 p-0 transition-colors placeholder-slate-300 w-full"
            placeholder={t('routines.routineName')}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="flex gap-3 md:gap-4 mt-1">
            <div className="flex-1 md:flex-none">
              <label className="block text-xs text-slate-500 mb-1">{t('labels.startDate')}</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs border-slate-200 rounded p-1 w-full md:w-auto"
              />
            </div>
            <div className="flex-1 md:flex-none">
              <label className="block text-xs text-slate-500 mb-1">{t('labels.endDate')}</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs border-slate-200 rounded p-1 w-full md:w-auto"
              />
            </div>
          </div>
          {mode === 'create' && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2">
              {t('routines.replacesActiveNotice')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 md:gap-3 justify-between md:justify-end">
          <span className="text-xs md:text-sm text-slate-500 hidden sm:inline">
            {t('routines.estDuration', { minutes: items.length * 2 })}
          </span>
          <div className="flex items-center gap-2 flex-1 sm:flex-none justify-end">
            {onCancel && (
              <Button
                variant="ghost"
                onClick={onCancel}
                className="px-3 md:px-4 py-2 text-sm font-medium text-slate-600"
              >
                {t('buttons.cancel')}
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={loading || items.length === 0}
              className="h-10 px-4 md:px-6 bg-brand text-white text-sm font-bold shadow-sm hover:bg-brand-hover"
            >
              {loading ? t('buttons.saving') : t('buttons.save')}
            </Button>
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
                <p className="text-sm font-medium text-amber-800">{t('routines.routineHasSessions')}</p>
                <p className="text-xs text-amber-700">{t('routines.exercisesLocked')}</p>
              </div>
            </div>
          )}
          {items.length === 0 ? (
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 flex flex-col items-center justify-center text-center">
              <div className="bg-slate-100 p-4 rounded-full mb-4">
                <span className="material-symbols-outlined text-slate-500 text-4xl">playlist_add</span>
              </div>
              <h4 className="text-lg font-medium text-slate-900">{t('routines.startBuilding')}</h4>
              <p className="text-slate-500 mt-1">{t('routines.addExercisesFromCatalog')}</p>
            </div>
          ) : (
            items.map((item, index) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-5 group transition-all hover:shadow-md"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex flex-col items-center gap-1 text-slate-500 pt-1">
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 rounded px-1.5 py-0.5">
                      {(index + 1).toString().padStart(2, '0')}
                    </span>
                  </div>

                  <ExerciseThumbnail
                    imageUrl={item.exercise.assetAnimationUrl}
                    className="size-14 md:size-16 border border-slate-100"
                  />

                  {/* Exercise info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base md:text-lg font-bold text-slate-900 truncate">{item.exercise.name}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1"><EnumLabel enumName="ExerciseCategory" value={item.exercise.category} /> • <EnumLabel enumName="ExerciseType" value={item.exercise.type} /></p>
                    <p className="text-sm text-slate-500 line-clamp-1 mt-1 hidden lg:block">{item.exercise.description}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {!isLocked && (
                      <>
                        <div className="hidden md:flex gap-1">
                          <Button variant="ghost" size="icon-xs" onClick={() => moveItem(index, 'up')} disabled={index === 0} className="text-slate-300 hover:text-slate-600">
                            <span className="material-symbols-outlined text-lg">arrow_upward</span>
                          </Button>
                          <Button variant="ghost" size="icon-xs" onClick={() => moveItem(index, 'down')} disabled={index === items.length - 1} className="text-slate-300 hover:text-slate-600">
                            <span className="material-symbols-outlined text-lg">arrow_downward</span>
                          </Button>
                        </div>
                        <div className="flex md:hidden gap-1">
                          <Button variant="ghost" size="icon-xs" onClick={() => moveItem(index, 'up')} disabled={index === 0}>
                            <span className="material-symbols-outlined text-sm text-slate-500">arrow_upward</span>
                          </Button>
                          <Button variant="ghost" size="icon-xs" onClick={() => moveItem(index, 'down')} disabled={index === items.length - 1}>
                            <span className="material-symbols-outlined text-sm text-slate-500">arrow_downward</span>
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-slate-500 hover:text-red-600 hover:bg-red-50"
                          title={t('routines.removeExercise')}
                          aria-label={t('routines.removeExercise')}
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Inputs row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  {/* Row 2: Metrics */}
                  < div className="col-span-2 md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-3" >


                    <div>
                      <label className="block text-[10px] md:text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">{t('labels.sets')}</label>
                      <input
                        className={`w-full h-8 md:h-9 rounded-md border-slate-200 text-center text-sm focus:border-brand focus:ring-brand ${isLocked ? 'bg-slate-100' : 'bg-slate-50'}`}
                        type="number"
                        min="1"
                        value={item.sets}
                        onChange={(e) => handleUpdateItem(item.id, 'sets', parseInt(e.target.value) || 0)}
                        disabled={isLocked}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] md:text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">{t('labels.reps')}</label>
                      <input
                        className={`w-full h-8 md:h-9 rounded-md border-slate-200 text-center text-sm focus:border-brand focus:ring-brand ${isLocked ? 'bg-slate-100' : 'bg-slate-50'}`}
                        type="number"
                        min="1"
                        value={item.repsPerSet}
                        onChange={(e) => handleUpdateItem(item.id, 'repsPerSet', parseInt(e.target.value) || 0)}
                        disabled={isLocked}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] md:text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">{t('labels.holdSeconds')}</label>
                      <input
                        className={`w-full h-8 md:h-9 rounded-md border-slate-200 text-center text-sm focus:border-brand focus:ring-brand ${isLocked || item.exercise.type === 'ISOTONIC' ? 'bg-slate-100 cursor-not-allowed opacity-60' : 'bg-slate-50'}`}
                        type="number"
                        min="0"
                        value={item.targetHoldSeconds}
                        onChange={(e) => handleUpdateItem(item.id, 'targetHoldSeconds', parseInt(e.target.value) || 0)}
                        disabled={isLocked || item.exercise.type === 'ISOTONIC'}
                      />
                    </div>
                  </div>
                </div>

                {/* Row 3: Advanced Config */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-[10px] md:text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">{t('labels.restSeconds')}</label>
                    <input
                      className={`w-full h-8 md:h-9 rounded-md border-slate-200 text-center text-sm focus:border-brand focus:ring-brand ${isLocked ? 'bg-slate-100' : 'bg-slate-50'}`}
                      type="number"
                      min="0"
                      value={item.restBetweenSets}
                      onChange={(e) => handleUpdateItem(item.id, 'restBetweenSets', parseInt(e.target.value) || 0)}
                      disabled={isLocked}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] md:text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">{t('labels.difficulty')}</label>
                    <input
                      className={`w-full h-8 md:h-9 rounded-md border-slate-200 text-center text-sm focus:border-brand focus:ring-brand ${isLocked ? 'bg-slate-100' : 'bg-slate-50'}`}
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
                        onChange={(e) => handleUpdateItem(item.id, 'strictMode', e.target.checked)}
                        disabled={isLocked}
                        className="rounded border-slate-300 text-brand focus:ring-brand"
                      />
                      <span className="text-xs font-medium text-slate-600">{t('labels.strict')}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.allowSkip}
                        onChange={(e) => handleUpdateItem(item.id, 'allowSkip', e.target.checked)}
                        disabled={isLocked}
                        className="rounded border-slate-300 text-brand focus:ring-brand"
                      />
                      <span className="text-xs font-medium text-slate-600">{t('labels.skip')}</span>
                    </label>
                  </div>
                </div>
              </div>
            ))
          )}

          <div className="h-2 rounded-full bg-brand/10 w-full mt-2"></div>
        </div>
      </div>
    </div>
  );
}
