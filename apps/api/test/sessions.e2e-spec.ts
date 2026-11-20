import { randomUUID } from 'crypto';
import type { Exercise, Routine } from '@prisma/client';
import {
  bearer,
  Fixtures,
  PatientCredentials,
  TherapistFixture,
} from './support/fixtures';
import { createTestApp, TestApp } from './support/test-app';

describe('Sessions (e2e)', () => {
  let testApp: TestApp;
  let fixtures: Fixtures;
  let owner: TherapistFixture;
  let otherTherapist: TherapistFixture;
  let exercise: Exercise;
  let routine: Routine;
  let foreignRoutine: Routine;
  let patient: PatientCredentials;
  let foreignPatient: PatientCredentials;

  const sessionBody = (routineId: string, id: string = randomUUID()) => ({
    id,
    routineId,
    startTime: '2026-03-01T10:00:00.000Z',
    endTime: '2026-03-01T10:15:00.000Z',
    items: [
      { exerciseId: exercise.id, repsCompleted: 10, averageAccuracy: 80 },
    ],
  });

  beforeAll(async () => {
    testApp = await createTestApp();
    fixtures = new Fixtures(testApp);
    owner = await fixtures.therapist();
    otherTherapist = await fixtures.therapist();
    exercise = await fixtures.exercise();

    const ownPatient = await fixtures.patient(owner.therapist.id);
    routine = await fixtures.routine(ownPatient.id, [exercise.id]);
    patient = await fixtures.patientCredentials(owner.token, ownPatient.id);

    const otherPatient = await fixtures.patient(owner.therapist.id);
    foreignRoutine = await fixtures.routine(otherPatient.id, [exercise.id]);
    foreignPatient = await fixtures.patientCredentials(
      owner.token,
      otherPatient.id,
    );
  });

  afterAll(async () => {
    await fixtures.cleanup();
    await testApp.app.close();
  });

  describe('POST /sessions ownership', () => {
    it('answers 403 when the routine belongs to another patient', async () => {
      await fixtures.http
        .post('/api/v1/sessions')
        .set(...bearer(patient.token))
        .send(sessionBody(foreignRoutine.id))
        .expect(403);

      expect(
        await testApp.prisma.session.count({
          where: { routineId: foreignRoutine.id },
        }),
      ).toBe(0);
    });

    it("answers 403 when replaying another patient's session id", async () => {
      const foreignSessionId = randomUUID();
      await fixtures.http
        .post('/api/v1/sessions')
        .set(...bearer(foreignPatient.token))
        .send(sessionBody(foreignRoutine.id, foreignSessionId))
        .expect(201);

      const response = await fixtures.http
        .post('/api/v1/sessions')
        .set(...bearer(patient.token))
        .send(sessionBody(routine.id, foreignSessionId))
        .expect(403);

      expect(JSON.stringify(response.body)).not.toContain(foreignRoutine.id);
    });

    it('answers 201 for a session on the patient own routine', async () => {
      await fixtures.http
        .post('/api/v1/sessions')
        .set(...bearer(patient.token))
        .send(sessionBody(routine.id))
        .expect(201);
    });

    it('answers 409 for an archived routine', async () => {
      const archived = await fixtures.routine(
        routine.patientId,
        [exercise.id],
        {
          status: 'ARCHIVED',
        },
      );
      await fixtures.http
        .post('/api/v1/sessions')
        .set(...bearer(patient.token))
        .send(sessionBody(archived.id))
        .expect(409);
    });

    it('answers 401 with a therapist token', async () => {
      await fixtures.http
        .post('/api/v1/sessions')
        .set(...bearer(owner.token))
        .send(sessionBody(routine.id))
        .expect(401);
    });
  });

  describe('GET /sessions/:id', () => {
    let sessionId: string;

    beforeAll(async () => {
      sessionId = randomUUID();
      await fixtures.http
        .post('/api/v1/sessions')
        .set(...bearer(patient.token))
        .send(sessionBody(routine.id, sessionId))
        .expect(201);
    });

    it('answers 200 with items to the owning therapist', async () => {
      const response = await fixtures.http
        .get(`/api/v1/sessions/${sessionId}`)
        .set(...bearer(owner.token))
        .expect(200);

      expect(response.body).toMatchObject({
        id: sessionId,
        items: [{ exerciseName: exercise.name, repsCompleted: 10 }],
      });
    });

    it('answers 401 without a token', async () => {
      await fixtures.http.get(`/api/v1/sessions/${sessionId}`).expect(401);
    });

    it('answers 404 for an unknown session', async () => {
      await fixtures.http
        .get(`/api/v1/sessions/${randomUUID()}`)
        .set(...bearer(owner.token))
        .expect(404);
    });

    it("answers 403 with another therapist's token", async () => {
      await fixtures.http
        .get(`/api/v1/sessions/${sessionId}`)
        .set(...bearer(otherTherapist.token))
        .expect(403);
    });
  });
});
