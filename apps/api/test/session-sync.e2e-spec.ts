import { randomUUID } from 'crypto';
import type { Exercise, Routine } from '@prisma/client';
import { bearer, Fixtures, TherapistFixture } from './support/fixtures';
import { createTestApp, TestApp } from './support/test-app';

describe('Session sync: idempotency, validation and metrics (e2e)', () => {
  let testApp: TestApp;
  let fixtures: Fixtures;
  let therapist: TherapistFixture;
  let exercise: Exercise;
  let routine: Routine;
  let patientToken: string;

  beforeAll(async () => {
    testApp = await createTestApp();
    fixtures = new Fixtures(testApp);
    therapist = await fixtures.therapist();
    exercise = await fixtures.exercise();
    const patient = await fixtures.patient(therapist.therapist.id);
    routine = await fixtures.routine(patient.id, [exercise.id]);
    patientToken = (
      await fixtures.patientCredentials(therapist.token, patient.id)
    ).token;
  });

  afterAll(async () => {
    await fixtures.cleanup();
    await testApp.app.close();
  });

  const validBody = (overrides: Record<string, unknown> = {}) => ({
    id: randomUUID(),
    routineId: routine.id,
    startTime: '2026-03-01T10:00:00.000Z',
    endTime: '2026-03-01T10:12:30.000Z',
    items: [
      {
        exerciseId: exercise.id,
        repsCompleted: 10,
        averageAccuracy: 82.5,
        symmetryScore: 91,
        averageHoldSeconds: 2.4,
      },
    ],
    ...overrides,
  });

  const postSession = (body: object) =>
    fixtures.http
      .post('/api/v1/sessions')
      .set(...bearer(patientToken))
      .send(body);

  describe('idempotency (RNF-009)', () => {
    it('answers 201 then 200 for the same UUID and stores one session', async () => {
      const body = validBody();

      const first = await postSession(body).expect(201);
      const replay = await postSession(body).expect(200);

      expect(replay.body).toEqual(first.body);
      expect(
        await testApp.prisma.session.count({ where: { id: body.id } }),
      ).toBe(1);
    });

    it('answers one 201 and 200s to concurrent submissions, never 500', async () => {
      const body = validBody();

      const statuses = (
        await Promise.all(Array.from({ length: 5 }, () => postSession(body)))
      )
        .map((response) => response.status)
        .sort();

      expect(statuses).toEqual([200, 200, 200, 200, 201]);
      expect(
        await testApp.prisma.session.count({ where: { id: body.id } }),
      ).toBe(1);
    });
  });

  describe('validation', () => {
    it.each([
      ['a missing id', { id: undefined }],
      ['an id that is not a UUID', { id: 'session-1' }],
      ['endTime before startTime', { endTime: '2026-03-01T09:59:59.000Z' }],
      ['no items', { items: [] }],
      [
        'negative repetitions',
        { items: [{ exerciseId: 'x', repsCompleted: -1 }] },
      ],
      [
        'averageAccuracy above 100',
        {
          items: [{ exerciseId: 'x', repsCompleted: 1, averageAccuracy: 101 }],
        },
      ],
      [
        'averageAccuracy below 0',
        { items: [{ exerciseId: 'x', repsCompleted: 1, averageAccuracy: -1 }] },
      ],
      [
        'symmetryScore above 100',
        {
          items: [{ exerciseId: 'x', repsCompleted: 1, symmetryScore: 100.5 }],
        },
      ],
      [
        'a negative hold time',
        {
          items: [
            { exerciseId: 'x', repsCompleted: 1, averageHoldSeconds: -2 },
          ],
        },
      ],
      [
        'non-numeric calibration values',
        {
          calibration: {
            capturedAt: '2026-03-01T09:00:00Z',
            values: { smile: 'x' },
          },
        },
      ],
    ])('answers 400 for %s', async (_case, overrides) => {
      await postSession(validBody(overrides)).expect(400);
    });

    it('answers 400 for an exercise that does not exist', async () => {
      await postSession(
        validBody({ items: [{ exerciseId: randomUUID(), repsCompleted: 3 }] }),
      ).expect(400);
    });
  });

  describe('metrics', () => {
    it('stores symmetry, hold time and calibration and returns them to the therapist', async () => {
      const calibration = {
        capturedAt: '2026-03-02T09:55:00.000Z',
        values: { smileMax: 0.82, browsMax: 0.41 },
      };
      const body = validBody({
        startTime: '2026-03-02T10:00:00.000Z',
        endTime: '2026-03-02T10:10:00.000Z',
        calibration,
      });
      await postSession(body).expect(201);

      const detail = await fixtures.http
        .get(`/api/v1/sessions/${body.id}`)
        .set(...bearer(therapist.token))
        .expect(200);

      expect(detail.body).toMatchObject({
        score: 83,
        durationSeconds: 600,
        calibration,
        items: [
          {
            averageAccuracy: 82.5,
            symmetryScore: 91,
            averageHoldSeconds: 2.4,
            snapshotUrl: null,
          },
        ],
      });
    });
  });
});
