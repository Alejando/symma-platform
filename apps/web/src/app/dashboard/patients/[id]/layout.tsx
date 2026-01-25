'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getPatient } from '@/lib/api';
import type { Patient } from '@symma/shared-types';

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
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    async function loadPatient() {
      if (session?.user?.accessToken) {
        try {
          const data = await getPatient(session.user.accessToken, id);
          setPatient(data);
        } catch (error) {
          console.error('Failed to load patient:', error);
        } finally {
          setLoading(false);
        }
      }
    }
    loadPatient();
  }, [session, id]);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!patient) {
    return <div className="p-8">Patient not found</div>;
  }

  const tabs = [
    { name: 'Overview', href: `/dashboard/patients/${id}` },
    { name: 'Routines', href: `/dashboard/patients/${id}/routines` },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Profile Header */}
      <div className="bg-white border-b border-[#e7f3f2] px-8 py-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-full bg-[#0d9488]/10 flex items-center justify-center text-2xl font-bold text-[#0d9488] ring-4 ring-white shadow-sm">
              {getInitials(patient.firstName, patient.lastName)}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-[#0d1b1a]">
                  {patient.firstName} {patient.lastName}
                </h1>
                <span className="bg-[#0D9488] text-white text-xs font-medium px-2.5 py-0.5 rounded-full">
                  Active
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-lg">calendar_today</span>
                  <span>{calculateAge(patient.dateOfBirth)} yrs</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-lg">wc</span>
                  <span className="capitalize">{patient.gender}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-lg">medical_services</span>
                  <span>Post-Op Recovery</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="material-symbols-outlined text-lg">edit</span>
              Edit Profile
            </button>
            <Link
              href={`/dashboard/patients/${id}/routines/new`}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#0d9488] rounded-lg hover:bg-[#0f766e] transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Assign Routine
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-8 mt-8 -mb-[25px]">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`
                  pb-4 text-sm font-medium transition-colors border-b-2
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
      <div className="flex-1 overflow-auto p-8">
        {children}
      </div>
    </div>
  );
}
