import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import type {
  Exercise,
  Patient,
  PatientStatus,
  Role,
  Routine,
  RoutineStatus,
  Therapist,
} from '@prisma/client';
import type { TestApp } from './test-app';

export const THERAPIST_PASSWORD = 'Password123!';

export interface TherapistFixture {
  therapist: Therapist;
  token: string;
}

export interface PatientCredentials {
  accessCode: string;
  token: string;
}

export class Fixtures {
  private readonly clinicId = randomUUID();
  private readonly exerciseIds: string[] = [];
  private clinicCreated = false;

  constructor(private readonly testApp: TestApp) {}

  get http() {
    return request(this.testApp.app.getHttpServer());
  }

  async therapist(
    options: { role?: Role; isActive?: boolean } = {},
  ): Promise<TherapistFixture> {
    await this.ensureClinic();
    const therapist = await this.testApp.prisma.therapist.create({
      data: {
        clinicId: this.clinicId,
        email: `therapist.${randomUUID()}@e2e.test`,
        passwordHash: await bcrypt.hash(THERAPIST_PASSWORD, 4),
        firstName: 'E2E',
        lastName: 'Therapist',
        role: options.role ?? 'THERAPIST',
      },
    });

    const token = await this.therapistToken(therapist.email);

    if (options.isActive === false) {
      await this.testApp.prisma.therapist.update({
        where: { id: therapist.id },
        data: { isActive: false },
      });
    }

    return { therapist, token };
  }

  async therapistToken(email: string): Promise<string> {
    const response = await this.http
      .post('/api/v1/auth/login')
      .send({ email, password: THERAPIST_PASSWORD })
      .expect(200);
    return (response.body as { accessToken: string }).accessToken;
  }

  async patient(
    therapistId: string,
    options: { status?: PatientStatus } = {},
  ): Promise<Omit<Patient, 'accessCodeHash'>> {
    return this.testApp.prisma.patient.create({
      data: {
        therapistId,
        firstName: 'E2E',
        lastName: `Patient ${randomUUID().slice(0, 8)}`,
        email: `patient.${randomUUID()}@e2e.test`,
        status: options.status ?? 'ACTIVE',
      },
    });
  }

  async exercise(): Promise<Exercise> {
    const exercise = await this.testApp.prisma.exercise.create({
      data: {
        keyName: `e2e_${randomUUID()}`,
        name: 'E2E Smile',
        type: 'ISOTONIC',
        category: 'CORE',
        mobileModule: 'SMILE',
      },
    });
    this.exerciseIds.push(exercise.id);
    return exercise;
  }

  async routine(
    patientId: string,
    exerciseIds: string[],
    options: { status?: RoutineStatus; startDate?: Date } = {},
  ): Promise<Routine> {
    return this.testApp.prisma.routine.create({
      data: {
        patientId,
        name: 'E2E Routine',
        startDate: options.startDate ?? new Date('2026-01-01T00:00:00Z'),
        status: options.status ?? 'ACTIVE',
        items: {
          create: exerciseIds.map((exerciseId, orderIndex) => ({
            exerciseId,
            orderIndex,
            sets: 2,
            repsPerSet: 5,
          })),
        },
      },
    });
  }

  async patientCredentials(
    therapistToken: string,
    patientId: string,
  ): Promise<PatientCredentials> {
    const accessCodeResponse = await this.http
      .post(`/api/v1/patients/${patientId}/access-code`)
      .set('Authorization', `Bearer ${therapistToken}`)
      .expect(201);
    const { accessCode } = accessCodeResponse.body as { accessCode: string };

    const loginResponse = await this.http
      .post('/api/v1/auth/patient/login')
      .send({ accessCode })
      .expect(200);

    return {
      accessCode,
      token: (loginResponse.body as { accessToken: string }).accessToken,
    };
  }

  async cleanup(): Promise<void> {
    const { prisma } = this.testApp;
    const ownedByClinic = {
      patient: { therapist: { clinicId: this.clinicId } },
    };
    await prisma.routine.deleteMany({ where: ownedByClinic });
    await prisma.patient.deleteMany({
      where: { therapist: { clinicId: this.clinicId } },
    });
    await prisma.therapist.deleteMany({ where: { clinicId: this.clinicId } });
    await prisma.clinic.deleteMany({ where: { id: this.clinicId } });
    await prisma.exercise.deleteMany({
      where: { id: { in: this.exerciseIds } },
    });
  }

  private async ensureClinic(): Promise<void> {
    if (this.clinicCreated) return;
    await this.testApp.prisma.clinic.create({
      data: { id: this.clinicId, name: 'E2E Clinic' },
    });
    this.clinicCreated = true;
  }
}

export function bearer(token: string): [string, string] {
  return ['Authorization', `Bearer ${token}`];
}
