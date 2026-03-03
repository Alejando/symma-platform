import Link from 'next/link';
import React from 'react';

interface AtRiskPatient {
  id: string;
  name: string;
  daysInactive: number;
}

export function RiskList({ patients }: { patients: AtRiskPatient[] }) {
  if (patients.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#e7f3f2] shadow-sm p-6 flex flex-col items-center justify-center text-center py-12">
        <div className="h-12 w-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-3">
          <span className="material-symbols-outlined">celebration</span>
        </div>
        <h3 className="text-[#0d1b1a] font-bold text-lg">All active patients are compliant</h3>
        <p className="text-gray-500 text-sm mt-1">No alerts at this time. Great job!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-red-100 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-red-50 bg-red-50/30 flex justify-between items-center">
        <h3 className="font-bold text-[#E11D48] flex items-center gap-2">
          <span className="material-symbols-outlined">warning</span>
          Attention Required
        </h3>
        <span className="text-xs font-medium bg-red-100 text-[#E11D48] px-2 py-1 rounded-md">
          {patients.length} Patient{patients.length !== 1 ? 's' : ''} at Risk
        </span>
      </div>

      <div className="divide-y divide-gray-100">
        {patients.map((patient) => (
          <Link
            key={patient.id}
            href={`/dashboard/patients/${patient.id}`}
            className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 font-bold text-sm border border-teal-100">
                {patient.name.split(' ').map((n) => n.charAt(0)).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-[#0d1b1a] group-hover:text-[#0d9488] transition-colors">{patient.name}</p>
                <p className="text-xs text-gray-500">Active Routine</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-bold text-[#E11D48]">{patient.daysInactive} Days</p>
                <p className="text-xs text-gray-400">Inactive</p>
              </div>
              <span className="material-symbols-outlined text-gray-300 group-hover:text-[#0d9488]">chevron_right</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
