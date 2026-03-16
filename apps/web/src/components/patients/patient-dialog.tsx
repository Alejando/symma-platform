'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Patient, CreatePatientDto, UpdatePatientDto, Gender } from '@symma/shared-types';
import { Button } from '@/components/ui/button';

interface PatientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: Patient | null;
  onSubmit: (data: CreatePatientDto | UpdatePatientDto) => Promise<void>;
}

const genderOptions: { value: Gender; label: string }[] = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
];

const paralysisOptions = [
  { value: 1, label: 'I - Normal' },
  { value: 2, label: 'II - Slight' },
  { value: 3, label: 'III - Moderate' },
  { value: 4, label: 'IV - Moderately Severe' },
  { value: 5, label: 'V - Severe' },
  { value: 6, label: 'VI - Total' },
];

export function PatientDialog({ isOpen, onClose, patient, onSubmit }: PatientDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    firstName: patient?.firstName || '',
    lastName: patient?.lastName || '',
    email: patient?.email || '',
    dateOfBirth: patient?.dateOfBirth?.split('T')[0] || '',
    gender: patient?.gender || '',
    phoneNumber: patient?.phoneNumber || '',
    diagnosis: patient?.diagnosis || '',
    initialParalysisDegree: patient?.initialParalysisDegree?.toString() || '',
    clinicalNotes: patient?.clinicalNotes || '',
    emergencyContactName: patient?.emergencyContactName || '',
    emergencyContactPhone: patient?.emergencyContactPhone || '',
  });

  // Helper to format phone number for display: xxx-xxx-xxxx
  const formatPhoneDisplay = (value: string) => {
    if (!value) return '';
    // Strip all non-digits
    const digits = value.replace(/\D/g, '');
    // If it has +52 prefix (12 digits starting with 52), strip it for display
    let coreDigits = digits;
    if (digits.startsWith('52') && digits.length > 10) {
      coreDigits = digits.substring(2);
    }

    // Limit to 10 digits
    coreDigits = coreDigits.slice(0, 10);

    // Format
    if (coreDigits.length === 0) return '';
    if (coreDigits.length <= 3) return coreDigits;
    if (coreDigits.length <= 6) return `${coreDigits.slice(0, 3)}-${coreDigits.slice(3)}`;
    return `${coreDigits.slice(0, 3)}-${coreDigits.slice(3, 6)}-${coreDigits.slice(6)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Remove all non-digits to get raw input, then re-format
    // To handle deletion properly, we might want to just strip non-digits first
    // But simple approach: just re-format the input string
    const formatted = formatPhoneDisplay(value);
    setFormData((prev) => ({ ...prev, [name]: formatted }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Sync state with prop when patient object changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        firstName: patient?.firstName || '',
        lastName: patient?.lastName || '',
        email: patient?.email || '',
        dateOfBirth: patient?.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : '',
        gender: patient?.gender || '',
        phoneNumber: formatPhoneDisplay(patient?.phoneNumber || ''),
        diagnosis: patient?.diagnosis || '',
        initialParalysisDegree: patient?.initialParalysisDegree?.toString() || '',
        clinicalNotes: patient?.clinicalNotes || '',
        emergencyContactName: patient?.emergencyContactName || '',
        emergencyContactPhone: formatPhoneDisplay(patient?.emergencyContactPhone || ''),
      });
      setErrors({});
    }
  }, [patient, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';

    // Validate phone length if present
    if (formData.phoneNumber) {
      const digits = formData.phoneNumber.replace(/\D/g, '');
      if (digits.length !== 10) {
        newErrors.phoneNumber = 'Phone number must be 10 digits';
      }
    }
    if (formData.emergencyContactPhone) {
      const digits = formData.emergencyContactPhone.replace(/\D/g, '');
      if (digits.length !== 10) {
        newErrors.emergencyContactPhone = 'Phone number must be 10 digits';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      // Helper to add +52 prefix
      const formatPhoneForSave = (phone: string) => {
        if (!phone) return undefined;
        const digits = phone.replace(/\D/g, '');
        return `+52${digits}`;
      };

      const data: CreatePatientDto = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        dateOfBirth: formData.dateOfBirth,
        ...(formData.gender && { gender: formData.gender as Gender }),
        ...(formData.phoneNumber && { phoneNumber: formatPhoneForSave(formData.phoneNumber) }),
        ...(formData.diagnosis && { diagnosis: formData.diagnosis.trim() }),
        ...(formData.initialParalysisDegree && {
          initialParalysisDegree: parseInt(formData.initialParalysisDegree),
        }),
        ...(formData.clinicalNotes && { clinicalNotes: formData.clinicalNotes.trim() }),
        ...(formData.emergencyContactName && {
          emergencyContactName: formData.emergencyContactName.trim(),
        }),
        ...(formData.emergencyContactPhone && {
          emergencyContactPhone: formatPhoneForSave(formData.emergencyContactPhone),
        }),
      };

      await onSubmit(data);
      onClose();
      router.refresh();
    } catch (error) {
      console.error('Failed to save patient:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to save patient' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#0d1b1a]">
            {patient ? 'Edit Patient' : 'Add New Patient'}
          </h2>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-gray-500">close</span>
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
              {errors.submit}
            </div>
          )}

          {/* Personal Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] ${errors.firstName ? 'border-red-300' : 'border-gray-200'
                    }`}
                  placeholder="John"
                />
                {errors.firstName && (
                  <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] ${errors.lastName ? 'border-red-300' : 'border-gray-200'
                    }`}
                  placeholder="Doe"
                />
                {errors.lastName && (
                  <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] ${errors.email ? 'border-red-300' : 'border-gray-200'
                    }`}
                  placeholder="patient@email.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] ${errors.dateOfBirth ? 'border-red-300' : 'border-gray-200'
                    }`}
                />
                {errors.dateOfBirth && (
                  <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488]"
                >
                  <option value="">Select gender</option>
                  {genderOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handlePhoneChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] ${errors.phoneNumber ? 'border-red-300' : 'border-gray-200'
                    }`}
                  placeholder="xxx-xxx-xxxx"
                />
                {errors.phoneNumber && (
                  <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>
                )}
              </div>
            </div>
          </div>

          {/* Clinical Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
              Clinical Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Diagnosis
                </label>
                <textarea
                  name="diagnosis"
                  value={formData.diagnosis}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488]"
                  placeholder="E.g., Bell's Palsy, Ramsay Hunt Syndrome..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  House-Brackmann Scale
                </label>
                <select
                  name="initialParalysisDegree"
                  value={formData.initialParalysisDegree}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488]"
                >
                  <option value="">Select grade</option>
                  {paralysisOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clinical Notes
                </label>
                <textarea
                  name="clinicalNotes"
                  value={formData.clinicalNotes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488]"
                  placeholder="Additional notes about the patient..."
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
              Emergency Contact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Name
                </label>
                <input
                  type="text"
                  name="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488]"
                  placeholder="Emergency contact name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  name="emergencyContactPhone"
                  value={formData.emergencyContactPhone}
                  onChange={handlePhoneChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] ${errors.emergencyContactPhone ? 'border-red-300' : 'border-gray-200'
                    }`}
                  placeholder="xxx-xxx-xxxx"
                />
                {errors.emergencyContactPhone && (
                  <p className="text-red-500 text-xs mt-1">{errors.emergencyContactPhone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-sm font-medium text-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="px-6 text-sm font-bold text-white bg-[#0d9488] hover:bg-[#0b857a] shadow-sm"
            >
              {loading ? 'Saving...' : patient ? 'Save Changes' : 'Add Patient'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
