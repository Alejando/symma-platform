import { describe, it, expect } from 'vitest';
import type {
  // Enums
  Gender,
  PatientStatus,
  Role,
  ExerciseType,
  ExerciseCategory,
  RoutineStatus,
  MobileModule,
  // Common
  PaginationQuery,
  PaginatedResponse,
  ApiError,
  // Auth
  LoginRequest,
  LoginResponse,
  TherapistProfileResponse,
  MobileLoginRequest,
  MobileLoginResponse,
  // Patients
  CreatePatientRequest,
  UpdatePatientRequest,
  PatientResponse,
  AccessCodeResponse,
  AccessCodeStatusResponse,
  // Routines
  RoutineItemRequest,
  CreateRoutineRequest,
  UpdateRoutineRequest,
  RoutineItemResponse,
  RoutineResponse,
  // Exercises
  ExerciseDefaultConfig,
  CreateExerciseRequest,
  UpdateExerciseRequest,
  ExerciseResponse,
  // Sessions
  SessionItemRequest,
  CreateSessionRequest,
  SessionItemResponse,
  SessionResponse,
  // Mobile
  ActiveRoutineExerciseResponse,
  ActiveRoutineItemResponse,
  ActiveRoutineResponse,
  // Analytics
  RoutineChartPoint,
  RoutineStatsResponse,
  RoutineHistoryResponse,
  // Dashboard
  DashboardMetric,
  AtRiskPatientResponse,
  DashboardStatsResponse,
  // Legacy aliases
  Patient,
  Routine,
  RoutineItem,
  Exercise,
  CreatePatientDto,
  UpdatePatientDto,
  CreateRoutineDto,
  UpdateRoutineDto,
  CreateRoutineItemDto,
  Therapist,
} from './index';

describe('@symma/shared-types barrel exports', () => {
  it('exports all enum types', () => {
    const gender: Gender = 'MALE';
    const status: PatientStatus = 'ACTIVE';
    const role: Role = 'THERAPIST';
    const exerciseType: ExerciseType = 'ISOTONIC';
    const category: ExerciseCategory = 'CORE';
    const routineStatus: RoutineStatus = 'ACTIVE';
    const mobileModule: MobileModule = 'SMILE';

    expect(gender).toBe('MALE');
    expect(status).toBe('ACTIVE');
    expect(role).toBe('THERAPIST');
    expect(exerciseType).toBe('ISOTONIC');
    expect(category).toBe('CORE');
    expect(routineStatus).toBe('ACTIVE');
    expect(mobileModule).toBe('SMILE');
  });

  it('exports common types', () => {
    const query: PaginationQuery = { page: 1, limit: 20 };
    const response: PaginatedResponse<string> = {
      data: ['a', 'b'],
      total: 2,
      page: 1,
      limit: 20,
    };
    const error: ApiError = { statusCode: 400, message: 'Bad request' };

    expect(query.page).toBe(1);
    expect(response.data).toHaveLength(2);
    expect(error.statusCode).toBe(400);
  });

  it('exports auth contracts', () => {
    const loginReq: LoginRequest = { email: 'test@example.com', password: 'secret' };
    const loginRes: LoginResponse = { accessToken: 'jwt-token' };
    const profile: TherapistProfileResponse = {
      id: '1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'THERAPIST',
      clinicId: 'clinic-1',
    };
    const mobileLoginReq: MobileLoginRequest = { accessCode: '123456' };
    const mobileLoginRes: MobileLoginResponse = {
      accessToken: 'jwt-token',
      patient: { id: '1', firstName: 'Jane', lastName: 'Doe' },
    };

    expect(loginReq.email).toBe('test@example.com');
    expect(loginRes.accessToken).toBe('jwt-token');
    expect(profile.role).toBe('THERAPIST');
    expect(mobileLoginReq.accessCode).toBe('123456');
    expect(mobileLoginRes.patient.firstName).toBe('Jane');
  });

  it('exports patient contracts', () => {
    const createReq: CreatePatientRequest = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      dateOfBirth: '1990-01-01',
    };
    const updateReq: UpdatePatientRequest = { firstName: 'Jane' };
    const patientRes: PatientResponse = {
      id: '1',
      therapistId: 't1',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1990-01-01',
      gender: 'MALE',
      phoneNumber: null,
      email: 'john@example.com',
      status: 'ACTIVE',
      diagnosis: null,
      initialParalysisDegree: null,
      clinicalNotes: null,
      emergencyContactName: null,
      emergencyContactPhone: null,
      avatarUrl: null,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };
    const accessCode: AccessCodeResponse = { accessCode: '123456', patientId: '1' };
    const accessStatus: AccessCodeStatusResponse = { hasAccessCode: true };

    expect(createReq.firstName).toBe('John');
    expect(updateReq.firstName).toBe('Jane');
    expect(patientRes.status).toBe('ACTIVE');
    expect(accessCode.accessCode).toBe('123456');
    expect(accessStatus.hasAccessCode).toBe(true);
  });

  it('exports routine contracts', () => {
    const itemReq: RoutineItemRequest = {
      exerciseId: 'e1',
      sets: 3,
      repsPerSet: 10,
      targetHoldSeconds: 5,
    };
    const createReq: CreateRoutineRequest = {
      patientId: 'p1',
      name: 'Morning Routine',
      startDate: '2024-01-01',
      items: [itemReq],
    };
    const updateReq: UpdateRoutineRequest = { name: 'Evening Routine' };

    expect(itemReq.sets).toBe(3);
    expect(createReq.name).toBe('Morning Routine');
    expect(updateReq.name).toBe('Evening Routine');
  });

  it('exports exercise contracts', () => {
    const config: ExerciseDefaultConfig = { threshold: 0.5, holdTime: 3 };
    const createReq: CreateExerciseRequest = {
      keyName: 'smile_hold',
      name: 'Smile Hold',
      type: 'ISOMETRIC',
      category: 'CORE',
    };
    const updateReq: UpdateExerciseRequest = { name: 'Updated Smile Hold' };

    expect(config.threshold).toBe(0.5);
    expect(createReq.type).toBe('ISOMETRIC');
    expect(updateReq.name).toBe('Updated Smile Hold');
  });

  it('exports session contracts', () => {
    const itemReq: SessionItemRequest = {
      exerciseId: 'e1',
      repsCompleted: 8,
      averageAccuracy: 85,
    };
    const createReq: CreateSessionRequest = {
      routineId: 'r1',
      startTime: '2024-01-01T10:00:00Z',
      endTime: '2024-01-01T10:30:00Z',
      items: [itemReq],
    };

    expect(itemReq.repsCompleted).toBe(8);
    expect(createReq.routineId).toBe('r1');
  });

  it('exports mobile contracts', () => {
    const exercise: ActiveRoutineExerciseResponse = {
      id: 'e1',
      name: 'Smile',
      keyName: 'smile',
      description: null,
      type: 'ISOMETRIC',
      category: 'CORE',
      mobileModule: 'SMILE',
      assetAnimationUrl: null,
      assetTutorialVideoUrl: null,
    };
    const item: ActiveRoutineItemResponse = {
      id: 'i1',
      orderIndex: 0,
      sets: 3,
      repsPerSet: 10,
      targetHoldSeconds: 5,
      restBetweenSets: 10,
      difficultyLevel: 1.0,
      strictMode: false,
      exercise,
    };
    const routine: ActiveRoutineResponse = {
      id: 'r1',
      name: 'Morning Routine',
      startDate: '2024-01-01',
      endDate: null,
      status: 'ACTIVE',
      items: [item],
    };

    expect(routine.items[0].sets).toBe(3);
    expect(routine.items[0].exercise.mobileModule).toBe('SMILE');
  });

  it('exports analytics contracts', () => {
    const chartPoint: RoutineChartPoint = { date: '2024-01-01', score: 85 };
    const stats: RoutineStatsResponse = {
      summary: { totalSessions: 10, currentStreak: 5, avgScore: 80 },
      chartData: [chartPoint],
    };
    const history: RoutineHistoryResponse = [];

    expect(chartPoint.score).toBe(85);
    expect(stats.summary.currentStreak).toBe(5);
    expect(history).toHaveLength(0);
  });

  it('exports dashboard contracts', () => {
    const metric: DashboardMetric = { value: 42, trend: 5 };
    const atRisk: AtRiskPatientResponse = {
      id: 'p1',
      name: 'John Doe',
      daysInactive: 7,
      avatarUrl: null,
    };
    const dashboard: DashboardStatsResponse = {
      metrics: {
        activePatients: metric,
        complianceAlerts: { value: 3, trend: -10 },
        avgEfficacy: { value: 75, trend: 2 },
      },
      atRiskPatients: [atRisk],
    };

    expect(dashboard.metrics.activePatients.value).toBe(42);
    expect(dashboard.atRiskPatients[0].daysInactive).toBe(7);
  });

  it('exports legacy type aliases for backward compatibility', () => {
    // These are aliases to the new contract types
    const patient: Patient = {
      id: '1',
      patientId: '1',
      therapistId: 't1',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1990-01-01',
      gender: 'MALE',
      phoneNumber: null,
      email: 'john@example.com',
      status: 'ACTIVE',
      diagnosis: null,
      initialParalysisDegree: null,
      clinicalNotes: null,
      emergencyContactName: null,
      emergencyContactPhone: null,
      avatarUrl: null,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      name: 'Morning',
      startDate: '2024-01-01',
      endDate: null,
      therapistNotes: null,
    } as unknown as Patient;

    const createDto: CreatePatientDto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      dateOfBirth: '1990-01-01',
    };

    const therapist: Therapist = {
      id: 't1',
      clinicId: 'c1',
      email: 'therapist@example.com',
      firstName: 'Dr',
      lastName: 'Smith',
      role: 'THERAPIST',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
    };

    expect(createDto.firstName).toBe('John');
    expect(therapist.role).toBe('THERAPIST');
  });
});
