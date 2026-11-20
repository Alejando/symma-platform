import type { Response } from 'supertest';
import { bearer, Fixtures } from './support/fixtures';
import { createTestApp, TestApp } from './support/test-app';

describe('accessCodeHash is never exposed (e2e)', () => {
  let testApp: TestApp;
  let fixtures: Fixtures;
  let therapistToken: string;
  let patientToken: string;
  let patientId: string;
  let routineId: string;
  let exerciseId: string;
  let storedHash: string;

  beforeAll(async () => {
    testApp = await createTestApp();
    fixtures = new Fixtures(testApp);
    const { therapist, token } = await fixtures.therapist();
    therapistToken = token;
    exerciseId = (await fixtures.exercise()).id;
    patientId = (await fixtures.patient(therapist.id)).id;
    routineId = (await fixtures.routine(patientId, [exerciseId])).id;
    patientToken = (await fixtures.patientCredentials(token, patientId)).token;

    const stored = await testApp.prisma.patient.findUniqueOrThrow({
      where: { id: patientId },
      select: { accessCodeHash: true },
    });
    storedHash = stored.accessCodeHash as string;
  });

  afterAll(async () => {
    await fixtures.cleanup();
    await testApp.app.close();
  });

  const expectNoHash = (response: Response) => {
    const body = JSON.stringify(response.body);
    expect(body).not.toContain('accessCodeHash');
    expect(body).not.toContain(storedHash);
  };

  const routineBody = () => ({
    patientId,
    name: 'Exposure routine',
    startDate: '2026-02-01T00:00:00.000Z',
    items: [{ exerciseId, sets: 1, repsPerSet: 5, targetHoldSeconds: 0 }],
  });

  it.each([
    ['GET', () => '/api/v1/patients'],
    ['GET', () => `/api/v1/patients/${patientId}`],
    ['GET', () => `/api/v1/patients/${patientId}/routines`],
    ['GET', () => `/api/v1/patients/${patientId}/access-code/status`],
    ['GET', () => '/api/v1/routines'],
    ['GET', () => `/api/v1/routines/${routineId}`],
    ['POST', () => `/api/v1/routines/${routineId}/clone`],
  ])('%s %s', async (method, path) => {
    const call =
      method === 'GET' ? fixtures.http.get(path()) : fixtures.http.post(path());
    const response = await call.set(...bearer(therapistToken));

    expect(response.status).toBeLessThan(300);
    expectNoHash(response);
  });

  it('POST /patients and PATCH /patients/:id', async () => {
    const created = await fixtures.http
      .post('/api/v1/patients')
      .set(...bearer(therapistToken))
      .send({
        firstName: 'Exposure',
        lastName: 'Check',
        email: 'exposure.check@e2e.test',
        dateOfBirth: '1990-01-01',
      })
      .expect(201);
    expectNoHash(created);

    const updated = await fixtures.http
      .patch(`/api/v1/patients/${patientId}`)
      .set(...bearer(therapistToken))
      .send({ diagnosis: 'Bell palsy' })
      .expect(200);
    expectNoHash(updated);
  });

  it('POST /routines and PUT /routines/:id', async () => {
    const created = await fixtures.http
      .post('/api/v1/routines')
      .set(...bearer(therapistToken))
      .send(routineBody())
      .expect(201);
    expectNoHash(created);

    const updated = await fixtures.http
      .put(`/api/v1/routines/${(created.body as { id: string }).id}`)
      .set(...bearer(therapistToken))
      .send({ name: 'Renamed' })
      .expect(200);
    expectNoHash(updated);
  });

  it('GET /mobile/routine/active', async () => {
    expectNoHash(
      await fixtures.http
        .get('/api/v1/mobile/routine/active')
        .set(...bearer(patientToken))
        .expect(200),
    );
  });

  it('DELETE /patients/:id', async () => {
    expectNoHash(
      await fixtures.http
        .delete(`/api/v1/patients/${patientId}`)
        .set(...bearer(therapistToken))
        .expect(204),
    );
  });
});
