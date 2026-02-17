'use client';

import { useState, useEffect } from 'react';
import type { ExerciseResponse, MobileModule, ExerciseType } from '@symma/shared-types';

type Exercise = ExerciseResponse;

const MOBILE_SUPPORTED_TYPES: ExerciseType[] = ['ISOTONIC', 'ISOMETRIC'];

const EXERCISE_TYPES: ExerciseType[] = ['ISOTONIC', 'ISOMETRIC', 'MANUAL', 'RELAXATION'];
const MOBILE_MODULES: MobileModule[] = ['SMILE', 'BROWS', 'JAW', 'KISS', 'EYES', 'EYES_INVERSE'];



const EXERCISE_CATEGORIES = [
  { value: 'WARMUP', label: 'Warmup' },
  { value: 'CORE', label: 'Core' },
  { value: 'COOLDOWN', label: 'Cooldown' },
];

interface ExerciseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  exercise?: Exercise | null;
  onSubmit: (data: any) => Promise<void>;
}

export function ExerciseDialog({ isOpen, onClose, exercise, onSubmit }: ExerciseDialogProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    keyName: '',
    name: '',
    description: '',
    type: 'ISOMETRIC' as ExerciseType,
    category: 'CORE',
    mobileModule: 'EYES' as MobileModule,
    assetAnimationUrl: '',
    assetTutorialVideoUrl: '',
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        keyName: exercise?.keyName || '',
        name: exercise?.name || '',
        description: exercise?.description || '',
        type: exercise?.type || 'ISOMETRIC',
        category: exercise?.category || 'CORE',
        mobileModule: exercise?.mobileModule || 'EYES',
        assetAnimationUrl: exercise?.assetAnimationUrl || '',
        assetTutorialVideoUrl: exercise?.assetTutorialVideoUrl || '',
      });
      setErrors({});
    }
  }, [exercise, isOpen]);

  const isMobileModuleEnabled = MOBILE_SUPPORTED_TYPES.includes(formData.type as ExerciseType);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // Clear mobileModule if type doesn't support it
      if (name === 'type' && !MOBILE_SUPPORTED_TYPES.includes(value as ExerciseType)) {
        updated.mobileModule = undefined as any;
      }
      return updated;
    });
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.keyName.trim()) newErrors.keyName = 'Key name is required';
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      // Clean up empty strings to avoid sending them if not needed, though backend now handles ''
      const payload = {
        ...formData,
        assetAnimationUrl: formData.assetAnimationUrl || undefined,
        assetTutorialVideoUrl: formData.assetTutorialVideoUrl || undefined,
      };
      await onSubmit(payload);
      onClose();
    } catch (error) {
      console.error(error);
      setErrors({ submit: 'Failed to save exercise' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-[#0d1b1a]">
            {exercise ? 'Edit Exercise' : 'New Exercise'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <span className="material-symbols-outlined text-gray-500">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
              {errors.submit}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Key Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="keyName"
              value={formData.keyName}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] ${errors.keyName ? 'border-red-300' : 'border-gray-200'}`}
              placeholder="exercise_unique_key"
              disabled={!!exercise}
            />
            {errors.keyName && <p className="text-red-500 text-xs mt-1">{errors.keyName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] ${errors.name ? 'border-red-300' : 'border-gray-200'}`}
              placeholder="Smile Stretch"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488]"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488]"
              >
                {EXERCISE_TYPES.map(type => (
                  <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            {isMobileModuleEnabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Module</label>
                <select
                  name="mobileModule"
                  value={formData.mobileModule || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488]"
                >
                  <option value="">Select module...</option>
                  {MOBILE_MODULES.map(module => (
                    <option key={module} value={module}>{module.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488]"
              >
                {EXERCISE_CATEGORIES.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Animation URL</label>
            <input
              type="text"
              name="assetAnimationUrl"
              value={formData.assetAnimationUrl}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tutorial Video URL</label>
            <input
              type="text"
              name="assetTutorialVideoUrl"
              value={formData.assetTutorialVideoUrl}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488]"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-sm font-bold text-white bg-[#0d9488] hover:bg-[#0b857a] disabled:opacity-50 rounded-lg transition-colors shadow-sm"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
