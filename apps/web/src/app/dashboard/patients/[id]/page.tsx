'use client';

import { useTranslations } from 'next-intl';
import { usePatient } from "@/components/patients/patient-context";
import { PatientAccessCard } from "@/components/patients/patient-access-card";
import { formatPhoneNumber } from "@/lib/utils";
import { EnumLabel } from "@/components/ui/enum-label";
import { useDateFormatter } from "@/hooks/use-date-formatter";

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#e7f3f2] rounded-xl p-4 md:p-6 shadow-sm">
      <h3 className="text-base md:text-lg font-semibold text-[#0d1b1a] mb-3 md:mb-4 flex items-center gap-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

function LabelValue({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="mb-3 last:mb-0">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <div className="text-gray-900 font-medium text-sm md:text-base break-words">{value || '-'}</div>
    </div>
  );
}

export default function PatientOverviewPage() {
  const t = useTranslations('common');
  const { patient, loading } = usePatient();
  const formatDate = useDateFormatter();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (!patient) {
    return <div className="text-gray-500">{t('patientDetail.notFound')}</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-5xl mx-auto">
      {/* Personal Information */}
      <InfoCard title={t('patients.personalInfo')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          <LabelValue label={t('labels.firstName')} value={patient.firstName} />
          <LabelValue label={t('labels.lastName')} value={patient.lastName} />
          <LabelValue label={t('labels.email')} value={patient.email} />
          <LabelValue label={t('patientDetail.phone')} value={formatPhoneNumber(patient.phoneNumber)} />
          <LabelValue
            label={t('labels.dateOfBirth')}
            value={patient.dateOfBirth ? formatDate.mediumDate(patient.dateOfBirth) : t('labels.notAvailable')}
          />
          <LabelValue 
            label={t('labels.gender')} 
            value={patient.gender ? <EnumLabel enumName="Gender" value={patient.gender} /> : '-'} 
          />
        </div>
      </InfoCard>

      {/* Emergency Contact */}
      <InfoCard title={t('patients.emergencyContact')}>
        <div className="space-y-4">
          <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex items-start gap-3">
            <span className="material-symbols-outlined text-red-600 mt-0.5">contact_emergency</span>
            <div>
              <LabelValue label={t('labels.name')} value={patient.emergencyContactName} />
              <div className="h-2"></div>
              <LabelValue label={t('patientDetail.phone')} value={formatPhoneNumber(patient.emergencyContactPhone)} />
            </div>
          </div>
          {!patient.emergencyContactName && (
            <p className="text-sm text-gray-500 italic">{t('patientDetail.noEmergencyContact')}</p>
          )}
        </div>
      </InfoCard>

      {/* Clinical Details */}
      <InfoCard title={t('patients.clinicalInfo')}>
        <div className="space-y-4">
          <LabelValue label={t('patientDetail.primaryDiagnosis')} value={patient.diagnosis} />
          <LabelValue
            label={t('patientDetail.initialParalysisDegree')}
            value={
              patient.initialParalysisDegree
                ? t('patientDetail.gradeValue', { value: patient.initialParalysisDegree })
                : undefined
            }
          />
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('patients.clinicalNotes')}</p>
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm text-gray-700 min-h-[80px]">
              {patient.clinicalNotes || t('patientDetail.noNotesAvailable')}
            </div>
          </div>
        </div>
      </InfoCard>

      {/* Mobile Access */}
      <PatientAccessCard patientId={patient.id} />
    </div>
  );
}
