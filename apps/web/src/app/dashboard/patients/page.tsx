'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { PatientDialog, PatientTable } from '@/components/patients';
import type { Patient, CreatePatientDto, UpdatePatientDto } from '@symma/shared-types';
import { getPatients, createPatient, updatePatient, deletePatient } from '@/lib/api';

export default function PatientsPage() {
  const { data: session } = useSession();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Patient | null>(null);

  const fetchPatients = useCallback(async () => {
    if (!session?.user?.accessToken) return;
    setLoading(true);
    try {
      const data = await getPatients(session.user.accessToken, search || undefined);
      setPatients(data);
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.accessToken, search]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleCreate = () => {
    setSelectedPatient(null);
    setDialogOpen(true);
  };

  const handleEdit = (patient: Patient) => {
    setSelectedPatient(patient);
    setDialogOpen(true);
  };

  const handleDelete = (patient: Patient) => {
    setDeleteConfirm(patient);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm || !session?.user?.accessToken) return;
    try {
      await deletePatient(session.user.accessToken, deleteConfirm.id);
      setDeleteConfirm(null);
      fetchPatients();
    } catch (error) {
      console.error('Failed to delete patient:', error);
    }
  };

  const handleSubmit = async (data: CreatePatientDto | UpdatePatientDto) => {
    if (!session?.user?.accessToken) return;

    if (selectedPatient) {
      await updatePatient(session.user.accessToken, selectedPatient.id, data);
    } else {
      await createPatient(session.user.accessToken, data as CreatePatientDto);
    }
    fetchPatients();
  };

  return (
    <div className="max-w-[1200px] mx-auto flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0d1b1a] tracking-tight">
            Patients
          </h1>
          <p className="text-[#4c9a93] mt-1 font-medium text-sm md:text-base">
            Manage your patient records and clinical information.
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0d9488] hover:bg-[#0b857a] text-white font-semibold rounded-lg transition-colors shadow-sm shrink-0"
        >
          <span className="material-symbols-outlined text-xl">person_add</span>
          <span>Add Patient</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-gray-400">search</span>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="block w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] text-sm transition"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-lg border border-gray-200">
          <span className="material-symbols-outlined text-lg">group</span>
          <span>
            <strong className="text-gray-900">{patients.length}</strong> patients
          </span>
        </div>
      </div>

      {/* Patient List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0d9488]"></div>
        </div>
      ) : (
        <PatientTable
          patients={patients}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Add/Edit Dialog */}
      <PatientDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        patient={selectedPatient}
        onSubmit={handleSubmit}
      />

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md m-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-600 text-2xl">warning</span>
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">Archive Patient</h3>
                <p className="text-sm text-gray-500">This action can be undone later.</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to archive{' '}
              <strong>
                {deleteConfirm.firstName} {deleteConfirm.lastName}
              </strong>
              ? They will be removed from your active patient list.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Archive Patient
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
