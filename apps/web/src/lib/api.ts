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
  PaginatedResponse,
  PaginationQuery,
} from '@symma/shared-types';

import { ApiError, AuthenticationError, extractApiMessage } from './errors';

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
      ...(typeof document !== 'undefined' && document.documentElement.lang
        ? { 'Accept-Language': document.documentElement.lang }
        : {}),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    throw new AuthenticationError();
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(response.status, extractApiMessage(body));
  }

  return response;
}

const MAX_PAGE_SIZE = 100;

function withPagination(path: string, { page, limit, search }: PaginationQuery): string {
  const url = new URL(`${API_URL}${path}`);
  if (page) url.searchParams.set('page', String(page));
  if (limit) url.searchParams.set('limit', String(limit));
  if (search) url.searchParams.set('search', search);
  return url.toString();
}

export async function getPatients(
  token: string,
  query: PaginationQuery = {},
): Promise<PaginatedResponse<Patient>> {
  const response = await fetchWithAuth(withPagination('/api/v1/patients', query), token);
  return response.json();
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

export async function getExercises(
  token: string,
  query: PaginationQuery = {},
): Promise<PaginatedResponse<Exercise>> {
  const response = await fetchWithAuth(withPagination('/api/v1/exercises', query), token);
  return response.json();
}

export async function getAllExercises(token: string): Promise<Exercise[]> {
  const exercises: Exercise[] = [];
  for (let page = 1; ; page++) {
    const result = await getExercises(token, { page, limit: MAX_PAGE_SIZE });
    exercises.push(...result.data);
    if (result.data.length === 0 || exercises.length >= result.total) {
      return exercises;
    }
  }
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
