'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

interface DashboardMetrics {
  activePatients: { value: number; trend: number };
  complianceAlerts: { value: number; trend: number };
  avgEfficacy: { value: number; trend: number };
}

export function DashboardKPIs({ metrics }: { metrics: DashboardMetrics }) {
  const t = useTranslations('common');
  const hasAlerts = metrics.complianceAlerts.value > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Active Patients */}
      <div className="bg-white rounded-xl p-6 border border-[#e7f3f2] shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
        <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-[#0d9488]/5 to-transparent"></div>
        <div className="flex justify-between items-start z-10">
          <div>
            <p className="text-sm font-medium text-gray-500">{t('dashboard.activePatients')}</p>
            <h3 className="text-3xl font-bold text-[#0d1b1a] mt-2">{metrics.activePatients.value}</h3>
          </div>
          <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">trending_up</span> {metrics.activePatients.trend > 0 ? '+' : ''}{metrics.activePatients.trend}%
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-auto z-10">{t('time.vsLastMonth')}</p>
      </div>

      {/* Compliance Alerts */}
      <div className={`bg-white rounded-xl p-6 border shadow-sm flex flex-col justify-between h-32 relative overflow-hidden ${hasAlerts ? 'border-red-100 ring-1 ring-[#E11D48]/10' : 'border-[#e7f3f2]'}`}>
        {hasAlerts && <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-[#E11D48]/5 to-transparent"></div>}
        <div className="flex justify-between items-start z-10">
          <div>
            <p className="text-sm font-medium text-gray-500">{t('dashboard.complianceAlerts')}</p>
            <h3 className={`text-3xl font-bold mt-2 ${hasAlerts ? 'text-[#E11D48]' : 'text-[#0d1b1a]'}`}>
              {metrics.complianceAlerts.value} <span className="text-base font-normal text-gray-400">{t('labels.patients')}</span>
            </h3>
          </div>
          {hasAlerts ? (
            <div className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center text-[#E11D48]">
              <span className="material-symbols-outlined">warning</span>
            </div>
          ) : (
            <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
              <span className="material-symbols-outlined">check_circle</span>
            </div>
          )}
        </div>
        <p className={`text-xs font-medium mt-auto z-10 flex items-center gap-1 ${hasAlerts ? 'text-[#E11D48]' : 'text-green-600'}`}>
          {hasAlerts ? t('dashboard.actionRequired') : t('dashboard.allClear')}
        </p>
      </div>

      {/* Avg Efficacy */}
      <div className="bg-white rounded-xl p-6 border border-[#e7f3f2] shadow-sm flex flex-col justify-between h-32 relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-[#0d9488]/5 to-transparent"></div>
        <div className="flex justify-between items-start z-10">
          <div>
            <p className="text-sm font-medium text-gray-500">{t('dashboard.avgEfficacy')}</p>
            <h3 className="text-3xl font-bold text-[#0d1b1a] mt-2">{metrics.avgEfficacy.value}%</h3>
          </div>
          <span className="bg-[#0d9488]/10 text-[#0d9488] text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">show_chart</span> {metrics.avgEfficacy.trend > 0 ? '+' : ''}{metrics.avgEfficacy.trend}%
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-auto">
          <div className="bg-[#0d9488] h-1.5 rounded-full" style={{ width: `${Math.min(100, Math.max(0, metrics.avgEfficacy.value))}%` }}></div>
        </div>
      </div>
    </div>
  );
}
