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
  RoutineHistoryQuery,
  RoutineHistoryItem,
  RoutineHistoryResponse,
  RoutineStatsResponse,
  SessionDetailResponse,
  PaginatedResponse,
  PaginationQuery,
  PatientStatsResponse,
  AccessCodeResponse,
  AccessCodeStatusResponse,
} from '@symma/shared-types';

import { NetworkError, throwIfNotOk } from './errors';

export const BACKEND_PROXY_PATH = '/api/backend';

function currentPortalLanguage(): Record<string, string> {
  return typeof document !== 'undefined' && document.documentElement.lang
    ? { 'Accept-Language': document.documentElement.lang }
    : {};
}

async function fetchFromProxy(path: string, options: RequestInit): Promise<Response> {
  try {
    return await fetch(`${BACKEND_PROXY_PATH}${path}`, {
      ...options,
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        ...currentPortalLanguage(),
        ...options.headers,
      },
    });
  } catch (cause) {
    throw new NetworkError(cause);
  }
}

async function requestApi(path: string, options: RequestInit = {}): Promise<Response> {
  const response = await fetchFromProxy(path, options);
  await throwIfNotOk(response);
  return response;
}

async function requestJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await requestApi(path, options);
  return response.json();
}

function withJsonBody(method: string, data: unknown): RequestInit {
  return { method, body: JSON.stringify(data) };
}

const MAX_PAGE_SIZE = 100;

function withQuery(path: string, query: PaginationQuery): string {
  const params = new URLSearchParams();
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.search) params.set('search', query.search);
  const search = params.toString();
  return search ? `${path}?${search}` : path;
}

export function getPatients(query: PaginationQuery = {}): Promise<PaginatedResponse<Patient>> {
  return requestJson(withQuery('/patients', query));
}

export function getPatient(id: string): Promise<Patient> {
  return requestJson(`/patients/${id}`);
}

export function getPatientStats(id: string): Promise<PatientStatsResponse> {
  return requestJson(`/patients/${id}/stats`);
}

export function createPatient(data: CreatePatientDto): Promise<Patient> {
  return requestJson('/patients', withJsonBody('POST', data));
}

export function updatePatient(id: string, data: UpdatePatientDto): Promise<Patient> {
  return requestJson(`/patients/${id}`, withJsonBody('PATCH', data));
}

export async function deletePatient(id: string): Promise<void> {
  await requestApi(`/patients/${id}`, { method: 'DELETE' });
}

export function getExercises(query: PaginationQuery = {}): Promise<PaginatedResponse<Exercise>> {
  return requestJson(withQuery('/exercises', query));
}

async function collectAllPages<T>(
  fetchPage: (query: { page: number; limit: number }) => Promise<PaginatedResponse<T>>,
): Promise<T[]> {
  const collected: T[] = [];
  for (let page = 1; ; page++) {
    const result = await fetchPage({ page, limit: MAX_PAGE_SIZE });
    collected.push(...result.data);
    if (result.data.length === 0 || collected.length >= result.total) {
      return collected;
    }
  }
}

export function getAllExercises(): Promise<Exercise[]> {
  return collectAllPages(getExercises);
}

export function createExercise(data: CreateExerciseRequest): Promise<Exercise> {
  return requestJson('/exercises', withJsonBody('POST', data));
}

export function updateExercise(id: string, data: UpdateExerciseRequest): Promise<Exercise> {
  return requestJson(`/exercises/${id}`, withJsonBody('PATCH', data));
}

export async function deleteExercise(id: string): Promise<void> {
  await requestApi(`/exercises/${id}`, { method: 'DELETE' });
}

export function createRoutine(data: CreateRoutineDto): Promise<Routine> {
  return requestJson('/routines', withJsonBody('POST', data));
}

export function getPatientRoutines(patientId: string): Promise<Routine[]> {
  return requestJson(`/patients/${patientId}/routines`);
}

export function getRoutine(routineId: string): Promise<Routine> {
  return requestJson(`/routines/${routineId}`);
}

export function updateRoutine(routineId: string, data: UpdateRoutineDto): Promise<Routine> {
  return requestJson(`/routines/${routineId}`, withJsonBody('PUT', data));
}

export async function deleteRoutine(routineId: string): Promise<void> {
  await requestApi(`/routines/${routineId}`, { method: 'DELETE' });
}

export function cloneRoutine(routineId: string): Promise<Routine> {
  return requestJson(`/routines/${routineId}/clone`, { method: 'POST' });
}

export function activateRoutine(routineId: string): Promise<Routine> {
  return requestJson(`/routines/${routineId}/activate`, { method: 'POST' });
}

export function getRoutineStats(routineId: string): Promise<RoutineStatsResponse> {
  return requestJson(`/routines/${routineId}/stats`);
}

export function getRoutineHistory(
  routineId: string,
  query: RoutineHistoryQuery = {},
): Promise<RoutineHistoryResponse> {
  return requestJson(withQuery(`/routines/${routineId}/history`, query));
}

export function getAllRoutineHistory(routineId: string): Promise<RoutineHistoryItem[]> {
  return collectAllPages((query) => getRoutineHistory(routineId, query));
}

export function getSessionDetail(sessionId: string): Promise<SessionDetailResponse> {
  return requestJson(`/sessions/${sessionId}`);
}

export function generatePatientAccessCode(patientId: string): Promise<AccessCodeResponse> {
  return requestJson(`/patients/${patientId}/access-code`, { method: 'POST' });
}

export async function revokePatientAccessCode(patientId: string): Promise<void> {
  await requestApi(`/patients/${patientId}/access-code`, { method: 'DELETE' });
}

export function getPatientAccessCodeStatus(patientId: string): Promise<AccessCodeStatusResponse> {
  return requestJson(`/patients/${patientId}/access-code/status`);
}
