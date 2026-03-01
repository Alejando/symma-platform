import type {
  Patient,
  CreatePatientDto,
  UpdatePatientDto,
  Exercise,
  CreateExerciseRequest,
  UpdateExerciseRequest,
  CreateRoutineDto,
  UpdateRoutineDto,
  Routine,
  RoutineHistoryResponse,
  RoutineStatsResponse,
  SessionDetailResponse,
  DashboardStatsResponse,
} from '@symma/shared-types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

async function fetchWithAuth(
  url: string,
  token: string,
  options: RequestInit = {}
): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response;
}

export async function getPatients(token: string, search?: string): Promise<Patient[]> {
  const url = new URL(`${API_URL}/api/v1/patients`);
  if (search) {
    url.searchParams.set('search', search);
  }
  const response = await fetchWithAuth(url.toString(), token);
  const result = await response.json();
  // API returns PaginatedResponse { data, total, page, limit }
  return result.data ?? result;
}

export async function getPatient(token: string, id: string): Promise<Patient> {
  const response = await fetchWithAuth(`${API_URL}/api/v1/patients/${id}`, token);
  return response.json();
}

export async function createPatient(
  token: string,
  data: CreatePatientDto
): Promise<Patient> {
  const response = await fetchWithAuth(`${API_URL}/api/v1/patients`, token, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function updatePatient(
  token: string,
  id: string,
  data: UpdatePatientDto
): Promise<Patient> {
  const response = await fetchWithAuth(`${API_URL}/api/v1/patients/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function deletePatient(token: string, id: string): Promise<Patient> {
  const response = await fetchWithAuth(`${API_URL}/api/v1/patients/${id}`, token, {
    method: 'DELETE',
  });
  return response.json();
}

export async function getExercises(token: string): Promise<Exercise[]> {
  const response = await fetchWithAuth(`${API_URL}/api/v1/exercises`, token);
  const result = await response.json();
  // API returns PaginatedResponse { data, total, page, limit }
  return result.data ?? result;
}

export async function createRoutine(
  token: string,
  data: CreateRoutineDto
): Promise<Routine> {
  const response = await fetchWithAuth(`${API_URL}/api/v1/routines`, token, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function getPatientRoutines(token: string, patientId: string): Promise<Routine[]> {
  const response = await fetchWithAuth(`${API_URL}/api/v1/patients/${patientId}/routines`, token);
  return response.json();
}

export async function getRoutineStats(token: string, routineId: string): Promise<RoutineStatsResponse> {
  const response = await fetchWithAuth(`${API_URL}/api/v1/routines/${routineId}/stats`, token);
  return response.json();
}

export async function getRoutineHistory(token: string, routineId: string): Promise<RoutineHistoryResponse> {
  const response = await fetchWithAuth(`${API_URL}/api/v1/routines/${routineId}/history`, token);
  return response.json();
}

export async function getSessionDetail(token: string, sessionId: string): Promise<SessionDetailResponse> {
  const response = await fetchWithAuth(`${API_URL}/api/v1/sessions/${sessionId}`, token);
  return response.json();
}
export async function createExercise(token: string, data: CreateExerciseRequest): Promise<Exercise> {
  const response = await fetchWithAuth(`${API_URL}/api/v1/exercises`, token, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function updateExercise(token: string, id: string, data: UpdateExerciseRequest): Promise<Exercise> {
  const response = await fetchWithAuth(`${API_URL}/api/v1/exercises/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function deleteExercise(token: string, id: string): Promise<Exercise> {
  const response = await fetchWithAuth(`${API_URL}/api/v1/exercises/${id}`, token, {
    method: 'DELETE',
  });
  return response.json();
}

// Routine Lifecycle Functions

export async function getRoutine(token: string, routineId: string): Promise<Routine> {
  const response = await fetchWithAuth(`${API_URL}/api/v1/routines/${routineId}`, token);
  return response.json();
}

export async function updateRoutine(
  token: string,
  routineId: string,
  data: UpdateRoutineDto
): Promise<Routine> {
  const response = await fetchWithAuth(`${API_URL}/api/v1/routines/${routineId}`, token, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function deleteRoutine(token: string, routineId: string): Promise<Routine> {
  const response = await fetchWithAuth(`${API_URL}/api/v1/routines/${routineId}`, token, {
    method: 'DELETE',
  });
  return response.json();
}

export async function cloneRoutine(token: string, routineId: string): Promise<Routine> {
  const response = await fetchWithAuth(`${API_URL}/api/v1/routines/${routineId}/clone`, token, {
    method: 'POST',
  });
  return response.json();
}

// ============================================
// Patient Access Code (Mobile PIN)
// ============================================

export async function generatePatientAccessCode(
  token: string,
  patientId: string
): Promise<{ accessCode: string }> {
  const response = await fetchWithAuth(`${API_URL}/api/v1/patients/${patientId}/access-code`, token, {
    method: 'POST',
  });
  return response.json();
}

export async function revokePatientAccessCode(
  token: string,
  patientId: string
): Promise<void> {
  await fetchWithAuth(`${API_URL}/api/v1/patients/${patientId}/access-code`, token, {
    method: 'DELETE',
  });
}

export async function getPatientAccessCodeStatus(
  token: string,
  patientId: string
): Promise<{ hasAccessCode: boolean }> {
  const response = await fetchWithAuth(`${API_URL}/api/v1/patients/${patientId}/access-code/status`, token);
  return response.json();
}


export async function getDashboardStats(token: string): Promise<DashboardStatsResponse> {
  const response = await fetchWithAuth(`${API_URL}/api/v1/dashboard/stats`, token);
  return response.json();
}
