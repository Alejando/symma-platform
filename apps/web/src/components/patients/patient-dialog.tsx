'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { Patient, CreatePatientDto, UpdatePatientDto, Gender } from '@symma/shared-types';
import { Button } from '@/components/ui/button';
import { ErrorAlert } from '@/components/ui/error-alert';
import { useApiErrorHandler } from '@/hooks/use-api-error-handler';
import { patientFormSchema, type PatientFormValues } from '@/lib/validation/patient-form';
import { toFieldErrors } from '@/lib/validation/field-errors';

interface PatientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: Patient | null;
  onSubmit: (data: CreatePatientDto | UpdatePatientDto) => Promise<void>;
}

const getGenderOptions = (t: ReturnType<typeof useTranslations<'common'>>): { value: Gender; label: string }[] => [
  { value: 'MALE', label: t('gender.male') },
  { value: 'FEMALE', label: t('gender.female') },
  { value: 'OTHER', label: t('gender.other') },
];

const getParalysisOptions = (t: ReturnType<typeof useTranslations<'common'>>) => [
  { value: 1, label: t('paralysis.grade1') },
  { value: 2, label: t('paralysis.grade2') },
  { value: 3, label: t('paralysis.grade3') },
  { value: 4, label: t('paralysis.grade4') },
  { value: 5, label: t('paralysis.grade5') },
  { value: 6, label: t('paralysis.grade6') },
];

const MEXICO_COUNTRY_CODE = '52';
const LOCAL_PHONE_DIGITS = 10;

function formatPhoneDisplay(value: string): string {
  const digits = value.replace(/\D/g, '');
  const localDigits = (
    digits.startsWith(MEXICO_COUNTRY_CODE) && digits.length > LOCAL_PHONE_DIGITS
      ? digits.substring(MEXICO_COUNTRY_CODE.length)
      : digits
  ).slice(0, LOCAL_PHONE_DIGITS);

  if (localDigits.length <= 3) return localDigits;
  if (localDigits.length <= 6) return `${localDigits.slice(0, 3)}-${localDigits.slice(3)}`;
  return `${localDigits.slice(0, 3)}-${localDigits.slice(3, 6)}-${localDigits.slice(6)}`;
}

function toStoredPhone(displayPhone: string): string {
  return `+${MEXICO_COUNTRY_CODE}${displayPhone.replace(/\D/g, '')}`;
}

function toFormValues(patient?: Patient | null): PatientFormValues {
  return {
    firstName: patient?.firstName ?? '',
    lastName: patient?.lastName ?? '',
    email: patient?.email ?? '',
    dateOfBirth: patient?.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : '',
    gender: patient?.gender ?? '',
    phoneNumber: formatPhoneDisplay(patient?.phoneNumber ?? ''),
    diagnosis: patient?.diagnosis ?? '',
    initialParalysisDegree: patient?.initialParalysisDegree?.toString() ?? '',
    clinicalNotes: patient?.clinicalNotes ?? '',
    emergencyContactName: patient?.emergencyContactName ?? '',
    emergencyContactPhone: formatPhoneDisplay(patient?.emergencyContactPhone ?? ''),
  };
}

export function PatientDialog({ isOpen, onClose, patient, onSubmit }: PatientDialogProps) {
  const router = useRouter();
  const t = useTranslations('common');
  const tVal = useTranslations('validation');
  const handleApiError = useApiErrorHandler();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const genderOptions = getGenderOptions(t);
  const paralysisOptions = getParalysisOptions(t);

  const [formData, setFormData] = useState<PatientFormValues>(() => toFormValues(patient));

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: formatPhoneDisplay(value) }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  useEffect(() => {
    if (isOpen) {
      setFormData(toFormValues(patient));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = patientFormSchema.safeParse(formData);
    if (!validation.success) {
      setErrors(toFieldErrors(validation.error, (key) => tVal(key)));
      return;
    }

    const values = validation.data;
    const data: CreatePatientDto = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      dateOfBirth: values.dateOfBirth,
      ...(values.gender && { gender: values.gender as Gender }),
      ...(values.phoneNumber && { phoneNumber: toStoredPhone(values.phoneNumber) }),
      ...(values.diagnosis.trim() && { diagnosis: values.diagnosis.trim() }),
      ...(values.initialParalysisDegree && {
        initialParalysisDegree: parseInt(values.initialParalysisDegree, 10),
      }),
      ...(values.clinicalNotes.trim() && { clinicalNotes: values.clinicalNotes.trim() }),
      ...(values.emergencyContactName.trim() && {
        emergencyContactName: values.emergencyContactName.trim(),
      }),
      ...(values.emergencyContactPhone && {
        emergencyContactPhone: toStoredPhone(values.emergencyContactPhone),
      }),
    };

    setLoading(true);
    try {
      await onSubmit(data);
      onClose();
      router.refresh();
    } catch (error) {
      const message = handleApiError(error);
      if (message) setErrors({ submit: message });
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
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#0d1b1a]">
            {patient ? t('patients.editPatient') : t('patients.addNewPatient')}
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
          <ErrorAlert message={errors.submit ?? null} />

          {/* Personal Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
              {t('patients.personalInfo')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="patient-firstName">
                  {t('labels.firstName')} <span className="text-red-600">*</span>
                </label>
                <input
                  id="patient-firstName"
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand ${errors.firstName ? 'border-red-300' : 'border-gray-200'
                    }`}
                  placeholder={t('patients.firstNamePlaceholder')}
                />
                {errors.firstName && (
                  <p className="text-red-600 text-xs mt-1">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="patient-lastName">
                  {t('labels.lastName')} <span className="text-red-600">*</span>
                </label>
                <input
                  id="patient-lastName"
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand ${errors.lastName ? 'border-red-300' : 'border-gray-200'
                    }`}
                  placeholder={t('patients.lastNamePlaceholder')}
                />
                {errors.lastName && (
                  <p className="text-red-600 text-xs mt-1">{errors.lastName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="patient-email">
                  {t('labels.email')} <span className="text-red-600">*</span>
                </label>
                <input
                  id="patient-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand ${errors.email ? 'border-red-300' : 'border-gray-200'
                    }`}
                  placeholder={t('patients.emailPlaceholder')}
                />
                {errors.email && (
                  <p className="text-red-600 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="patient-dateOfBirth">
                  {t('labels.dateOfBirth')} <span className="text-red-600">*</span>
                </label>
                <input
                  id="patient-dateOfBirth"
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand ${errors.dateOfBirth ? 'border-red-300' : 'border-gray-200'
                    }`}
                />
                {errors.dateOfBirth && (
                  <p className="text-red-600 text-xs mt-1">{errors.dateOfBirth}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="patient-gender">
                  {t('labels.gender')}
                </label>
                <select
                  id="patient-gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand"
                >
                  <option value="">{t('labels.selectGender')}</option>
                  {genderOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="patient-phoneNumber">
                  {t('labels.phoneNumber')}
                </label>
                <input
                  id="patient-phoneNumber"
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handlePhoneChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand ${errors.phoneNumber ? 'border-red-300' : 'border-gray-200'
                    }`}
                  placeholder={t('patients.phonePlaceholder')}
                />
                {errors.phoneNumber && (
                  <p className="text-red-600 text-xs mt-1">{errors.phoneNumber}</p>
                )}
              </div>
            </div>
          </div>

          {/* Clinical Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
              {t('patients.clinicalInfo')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="patient-diagnosis">
                  {t('labels.diagnosis')}
                </label>
                <textarea
                  id="patient-diagnosis"
                  name="diagnosis"
                  value={formData.diagnosis}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  placeholder={t('patients.diagnosisPlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="patient-initialParalysisDegree">
                  {t('patients.houseBrackmann')}
                </label>
                <select
                  id="patient-initialParalysisDegree"
                  name="initialParalysisDegree"
                  value={formData.initialParalysisDegree}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand"
                >
                  <option value="">{t('labels.selectGrade')}</option>
                  {paralysisOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="patient-clinicalNotes">
                  {t('patients.clinicalNotes')}
                </label>
                <textarea
                  id="patient-clinicalNotes"
                  name="clinicalNotes"
                  value={formData.clinicalNotes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  placeholder={t('patients.notesPlaceholder')}
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
              {t('patients.emergencyContact')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="patient-emergencyContactName">
                  {t('patients.contactName')}
                </label>
                <input
                  id="patient-emergencyContactName"
                  type="text"
                  name="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  placeholder={t('patients.contactName')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="patient-emergencyContactPhone">
                  {t('patients.contactPhone')}
                </label>
                <input
                  id="patient-emergencyContactPhone"
                  type="tel"
                  name="emergencyContactPhone"
                  value={formData.emergencyContactPhone}
                  onChange={handlePhoneChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand ${errors.emergencyContactPhone ? 'border-red-300' : 'border-gray-200'
                    }`}
                  placeholder={t('patients.phonePlaceholder')}
                />
                {errors.emergencyContactPhone && (
                  <p className="text-red-600 text-xs mt-1">{errors.emergencyContactPhone}</p>
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
              {t('buttons.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="px-6 text-sm font-bold text-white bg-brand hover:bg-brand-hover shadow-sm"
            >
              {loading ? t('buttons.saving') : patient ? t('buttons.saveChanges') : t('buttons.addPatient')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
