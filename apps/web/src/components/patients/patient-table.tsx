'use client';

import type { Patient } from '@symma/shared-types';

interface PatientTableProps {
  patients: Patient[];
  onEdit: (patient: Patient) => void;
  onDelete: (patient: Patient) => void;
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700',
    INACTIVE: 'bg-gray-100 text-gray-700',
    ARCHIVED: 'bg-red-100 text-red-700',
  };
  return styles[status] || styles.INACTIVE;
}

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '-';
  }
}

export function PatientTable({ patients, onEdit, onDelete }: PatientTableProps) {
  if (patients.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#e7f3f2] p-12 text-center">
        <span className="material-symbols-outlined text-4xl text-gray-300 mb-3">group_off</span>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">No patients yet</h3>
        <p className="text-gray-500 text-sm">Add your first patient to get started.</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-xl border border-[#e7f3f2] overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-[#e7f3f2]">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Patient
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                DOB
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Diagnosis
              </th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e7f3f2]">
            {patients.map((patient) => (
              <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#0d9488]/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-[#0d9488] font-bold text-sm">
                        {getInitials(patient.firstName, patient.lastName)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {patient.firstName} {patient.lastName}
                      </p>
                      {patient.phoneNumber && (
                        <p className="text-xs text-gray-500">{patient.phoneNumber}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">{patient.email}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">{formatDate(patient.dateOfBirth)}</span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                      patient.status
                    )}`}
                  >
                    {patient.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600 line-clamp-1">
                    {patient.diagnosis || '-'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(patient)}
                      className="p-2 hover:bg-[#0d9488]/10 rounded-lg transition-colors group"
                      title="Edit"
                    >
                      <span className="material-symbols-outlined text-gray-400 group-hover:text-[#0d9488] text-xl">
                        edit
                      </span>
                    </button>
                    <button
                      onClick={() => onDelete(patient)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                      title="Archive"
                    >
                      <span className="material-symbols-outlined text-gray-400 group-hover:text-red-600 text-xl">
                        archive
                      </span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {patients.map((patient) => (
          <div
            key={patient.id}
            className="bg-white rounded-xl border border-[#e7f3f2] p-4"
          >
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-full bg-[#0d9488]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[#0d9488] font-bold">
                  {getInitials(patient.firstName, patient.lastName)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {patient.firstName} {patient.lastName}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">{patient.email}</p>
                  </div>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                      patient.status
                    )}`}
                  >
                    {patient.status}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                  <span>{formatDate(patient.dateOfBirth)}</span>
                  {patient.diagnosis && (
                    <span className="truncate">{patient.diagnosis}</span>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => onEdit(patient)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#0d9488] hover:bg-[#0d9488]/10 rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">edit</span>
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(patient)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">archive</span>
                    Archive
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
