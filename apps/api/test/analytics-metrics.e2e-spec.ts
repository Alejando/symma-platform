import { randomUUID } from 'crypto';
import type { Exercise, Routine } from '@prisma/client';
import { bearer, Fixtures, TherapistFixture } from './support/fixtures';
import { createTestApp, TestApp } from './support/test-app';

const DAY = 24 * 60 * 60 * 1000;

describe('Analytics metrics, pagination and dashboard parity (e2e)', () => {
  let testApp: TestApp;
  let fixtures: Fixtures;
  let therapist: TherapistFixture;
  let exercise: Exercise;
  let routine: Routine;
  let patientId: string;
  let patientToken: string;

  const sessionsAgo = [2, 1, 0];
  const accuracies = [40, 60, 81];
  const symmetries = [70, null, 90];

  beforeAll(async () => {
    testApp = await createTestApp();
    fixtures = new Fixtures(testApp);
    therapist = await fixtures.therapist();
    exercise = await fixtures.exercise();
    patientId = (await fixtures.patient(therapist.therapist.id)).id;
    routine = await fixtures.routine(patientId, [exercise.id], {
      startDate: new Date(Date.now() - 9 * DAY),
    });
    patientToken = (
      await fixtures.patientCredentials(therapist.token, patientId)
    ).token;

    for (const [index, daysAgo] of sessionsAgo.entries()) {
      const start = new Date(Date.now() - daysAgo * DAY - 60_000);
      await fixtures.http
        .post('/api/v1/sessions')
        .set(...bearer(patientToken))
        .send({
          id: randomUUID(),
          routineId: routine.id,
          startTime: start.toISOString(),
          endTime: new Date(start.getTime() + 30_000).toISOString(),
          items: [
            {
              exerciseId: exercise.id,
              repsCompleted: 5,
              averageAccuracy: accuracies[index],
              ...(symmetries[index] !== null && {
                symmetryScore: symmetries[index],
              }),
              averageHoldSeconds: 1.5,
            },
          ],
        })
        .expect(201);
    }
  });

  afterAll(async () => {
    await fixtures.cleanup();
    await testApp.app.close();
  });

  const get = (path: string) =>
    fixtures.http.get(`/api/v1${path}`).set(...bearer(therapist.token));

  it('reports stats on the stored 0–100 scale with symmetry, oldest first', async () => {
    const { body } = await get(`/routines/${routine.id}/stats`).expect(200);

    expect(body).toMatchObject({
      summary: { totalSessions: 3, avgScore: 60 },
      averageSymmetry: 80,
    });
    expect(body.summary.currentStreak).toBeGreaterThanOrEqual(2);
    expect(
      (body.chartData as { score: number; symmetry: number | null }[]).map(
        ({ score, symmetry }) => [score, symmetry],
      ),
    ).toEqual([
      [40, 70],
      [60, null],
      [81, 90],
    ]);
  });

  it('shows the same efficacy percentage on the dashboard and in analytics', async () => {
    const dashboard = await get('/dashboard/stats').expect(200);
    const stats = await get(`/routines/${routine.id}/stats`).expect(200);

    expect(dashboard.body.metrics.avgEfficacy.value).toBe(
      stats.body.summary.avgScore,
    );
  });

  it('pages the history newest first with per-item metrics', async () => {
    const firstPage = await get(
      `/routines/${routine.id}/history?page=1&limit=2`,
    ).expect(200);
    const secondPage = await get(
      `/routines/${routine.id}/history?page=2&limit=2`,
    ).expect(200);

    expect(firstPage.body).toMatchObject({ total: 3, page: 1, limit: 2 });
    expect(
      (firstPage.body.data as { score: number }[]).map(({ score }) => score),
    ).toEqual([81, 60]);
    expect(secondPage.body.data).toHaveLength(1);
    expect(secondPage.body.data[0].items[0]).toMatchObject({
      averageAccuracy: 40,
      symmetryScore: 70,
      averageHoldSeconds: 1.5,
      exerciseName: exercise.name,
    });
  });

  it('returns patient stats', async () => {
    const { body } = await get(`/patients/${patientId}/stats`).expect(200);

    expect(body).toEqual({
      adherencePercent: expect.any(Number),
      sessionsCompleted: 3,
      lastSessionAt: expect.any(String),
    });
    expect(body.adherencePercent).toBeGreaterThanOrEqual(20);
    expect(body.adherencePercent).toBeLessThanOrEqual(40);
  });

  it("answers 404 for another therapist's patient stats", async () => {
    const other = await fixtures.therapist();
    await fixtures.http
      .get(`/api/v1/patients/${patientId}/stats`)
      .set(...bearer(other.token))
      .expect(404);
  });

  describe('page and limit validation', () => {
    const lists = () => [
      '/patients',
      '/exercises',
      '/routines',
      `/routines/${routine.id}/history`,
    ];

    it.each([
      'page=0',
      'page=abc',
      'page=1.5',
      'limit=0',
      'limit=101',
      'limit=ten',
    ])('answers 400 for %s on every list', async (query) => {
      for (const path of lists()) {
        await get(`${path}?${query}`).expect(400);
      }
    });

    it('accepts limit=100 on every list', async () => {
      for (const path of lists()) {
        const { body } = await get(`${path}?page=1&limit=100`).expect(200);
        expect(body).toMatchObject({ page: 1, limit: 100 });
      }
    });
  });
});
