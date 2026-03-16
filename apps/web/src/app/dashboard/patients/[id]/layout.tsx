'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { getPatient, updatePatient } from '@/lib/api';
import { useAuthErrorHandler } from '@/hooks/use-auth-error-handler';
import type { Patient, UpdatePatientDto, CreatePatientDto } from '@symma/shared-types';
import { PatientDialog } from '@/components/patients';
import { PatientContext } from '@/components/patients/patient-context';
import { Button } from '@/components/ui/button';
import { EnumLabel } from '@/components/ui/enum-label';

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0]}${lastName[0]}`.toUpperCase();
}

function calculateAge(dateOfBirth: string) {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

import { use } from 'react';

export default function PatientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session } = useSession();
  const t = useTranslations('common');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleEditClick = () => {
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (data: CreatePatientDto | UpdatePatientDto) => {
    if (!session?.user?.accessToken || !patient) return;
    try {
      const updatedPatient = await updatePatient(session.user.accessToken, patient.id, data as UpdatePatientDto);
      setPatient(updatedPatient);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update patient:', error);
      throw error; // Re-throw to let dialog handle it via its own error state if needed, or just log
    }
  };

  const handleAuthError = useAuthErrorHandler();

  useEffect(() => {
    async function loadPatient() {
      if (session?.user?.accessToken) {
        try {
          const data = await getPatient(session.user.accessToken, id);
          setPatient(data);
        } catch (error) {
          if (!handleAuthError(error)) {
            console.error('Failed to load patient:', error);
          }
        } finally {
          setLoading(false);
        }
      }
    }
    loadPatient();
  }, [session, id, handleAuthError]);

  if (loading) {
    return <div className="p-8">{t('patientLayout.loading')}</div>;
  }

  if (!patient) {
    return <div className="p-8">{t('patientLayout.notFound')}</div>;
  }

  const tabs = [
    { name: t('patientLayout.overview'), href: `/dashboard/patients/${id}` },
    { name: t('nav.routines'), href: `/dashboard/patients/${id}/routines` },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Profile Header */}
      <div className="bg-white border-b border-[#e7f3f2] px-4 md:px-8 py-4 md:py-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          {/* Patient Info */}
          <div className="flex items-center gap-4 md:gap-6">
            <div className="h-14 w-14 md:h-20 md:w-20 rounded-full bg-[#0d9488]/10 flex items-center justify-center text-xl md:text-2xl font-bold text-[#0d9488] ring-4 ring-white shadow-sm shrink-0">
              {getInitials(patient.firstName, patient.lastName)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 md:gap-3 mb-1 flex-wrap">
                <h1 className="text-xl md:text-2xl font-bold text-[#0d1b1a] truncate">
                  {patient.firstName} {patient.lastName}
                </h1>
                <span className="bg-[#0D9488] text-white text-xs font-medium px-2 py-0.5 rounded-full shrink-0">
                  {t('routineDetail.active')}
                </span>
              </div>
              <div className="flex items-center gap-3 md:gap-4 text-sm text-gray-500 flex-wrap">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-base md:text-lg">calendar_today</span>
                  <span>{patient.dateOfBirth ? t('patientLayout.yrs', { age: calculateAge(patient.dateOfBirth) }) : t('patientDetail.na')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-base md:text-lg">wc</span>
                  <span className="capitalize">{patient.gender ? <EnumLabel enumName="Gender" value={patient.gender} /> : '-'}</span>
                </div>
                <div className="hidden sm:flex items-center gap-1">
                  <span className="material-symbols-outlined text-base md:text-lg">medical_services</span>
                  <span>{t('patientLayout.postOpRecovery')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 md:gap-3 shrink-0 justify-end">
            <Button
              variant="outline"
              onClick={handleEditClick}
              className="text-sm font-medium text-gray-700"
            >
              <span className="material-symbols-outlined text-lg">edit</span>
              <span className="inline">{t('buttons.edit')}</span>
            </Button>
            <Link
              href={`/dashboard/patients/${id}/routines/new`}
              className="flex items-center justify-center gap-1 md:gap-2 px-3 md:px-4 py-2 text-sm font-medium text-white bg-[#0d9488] rounded-lg hover:bg-[#0f766e] transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              <span className="inline">{t('patientLayout.assignRoutine')}</span>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 md:gap-8 mt-6 md:mt-8 -mb-[17px] md:-mb-[25px] overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`
                  pb-3 md:pb-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap
                  ${isActive
                    ? 'border-[#0d9488] text-[#0d9488]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-4 md:p-8">
        <PatientContext.Provider value={{ patient, loading, refreshPatient: async () => { /* no-op or re-fetch if needed */ } }}>
          {children}
        </PatientContext.Provider>
      </div>

      <PatientDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        patient={patient}
        onSubmit={handleEditSubmit}
      />
    </div>
  );
}
