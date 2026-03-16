'use client';

import Link from 'next/link';
import React from 'react';
import { useTranslations } from 'next-intl';

export function DashboardActions() {
  const t = useTranslations('common');

  return (
    <div className="bg-white rounded-xl border border-[#e7f3f2] shadow-sm p-6">
      <h3 className="font-bold text-lg text-[#0d1b1a] mb-4">{t('dashboard.quickActions')}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Add Patient */}
        <Link href="/dashboard/patients?action=new" className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg border border-[#e7f3f2] hover:border-[#0d9488]/50 hover:bg-[#0d9488]/5 transition-all group h-24">
          <span className="material-symbols-outlined text-[#0d9488] group-hover:scale-110 transition-transform">person_add</span>
          <span className="text-xs font-medium text-gray-700">{t('buttons.addPatient')}</span>
        </Link>

        {/* Exercises Library */}
        <Link href="/dashboard/exercises" className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg border border-[#e7f3f2] hover:border-[#0d9488]/50 hover:bg-[#0d9488]/5 transition-all group h-24">
          <span className="material-symbols-outlined text-[#0d9488] group-hover:scale-110 transition-transform">fitness_center</span>
          <span className="text-xs font-medium text-gray-700">{t('dashboard.exercisesLibrary')}</span>
        </Link>

        {/* Active Routines */}
        <Link href="/dashboard/patients?filter=active" className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg border border-[#e7f3f2] hover:border-[#0d9488]/50 hover:bg-[#0d9488]/5 transition-all group h-24">
          <span className="material-symbols-outlined text-[#0d9488] group-hover:scale-110 transition-transform">monitor_heart</span>
          <span className="text-xs font-medium text-gray-700">{t('dashboard.activeRoutines')}</span>
        </Link>

        {/* Generate Mobile PIN / Access */}
        <Link href="/dashboard/patients?filter=mobile" className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg border border-[#e7f3f2] hover:border-[#0d9488]/50 hover:bg-[#0d9488]/5 transition-all group h-24">
          <span className="material-symbols-outlined text-[#0d9488] group-hover:scale-110 transition-transform">phonelink_lock</span>
          <span className="text-xs font-medium text-gray-700">{t('dashboard.mobileAccess')}</span>
        </Link>
      </div>
    </div>
  );
}
