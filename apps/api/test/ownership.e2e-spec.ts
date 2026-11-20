import { bearer, Fixtures, TherapistFixture } from './support/fixtures';
import { createTestApp, TestApp } from './support/test-app';

describe("Another therapist's token (e2e, RNF-014)", () => {
  let testApp: TestApp;
  let fixtures: Fixtures;
  let owner: TherapistFixture;
  let intruder: TherapistFixture;
  let patientId: string;
  let routineId: string;
  let exerciseId: string;

  beforeAll(async () => {
    testApp = await createTestApp();
    fixtures = new Fixtures(testApp);
    owner = await fixtures.therapist();
    intruder = await fixtures.therapist();
    exerciseId = (await fixtures.exercise()).id;
    patientId = (await fixtures.patient(owner.therapist.id)).id;
    routineId = (await fixtures.routine(patientId, [exerciseId])).id;
  });

  afterAll(async () => {
    await fixtures.cleanup();
    await testApp.app.close();
  });

  it.each([
    ['GET', () => `/api/v1/patients/${patientId}`],
    ['PATCH', () => `/api/v1/patients/${patientId}`],
    ['DELETE', () => `/api/v1/patients/${patientId}`],
    ['GET', () => `/api/v1/patients/${patientId}/routines`],
    ['GET', () => `/api/v1/patients/${patientId}/stats`],
    ['POST', () => `/api/v1/patients/${patientId}/access-code`],
    ['DELETE', () => `/api/v1/patients/${patientId}/access-code`],
    ['GET', () => `/api/v1/patients/${patientId}/access-code/status`],
    ['GET', () => `/api/v1/routines/${routineId}`],
    ['PUT', () => `/api/v1/routines/${routineId}`],
    ['DELETE', () => `/api/v1/routines/${routineId}`],
    ['POST', () => `/api/v1/routines/${routineId}/clone`],
    ['POST', () => `/api/v1/routines/${routineId}/activate`],
    ['GET', () => `/api/v1/routines/${routineId}/stats`],
    ['GET', () => `/api/v1/routines/${routineId}/history`],
  ])('%s %s answers 404', async (method, path) => {
    const verb = method.toLowerCase() as
      | 'get'
      | 'post'
      | 'put'
      | 'patch'
      | 'delete';
    await fixtures.http[verb](path())
      .set(...bearer(intruder.token))
      .send({ name: 'Intrusion' })
      .expect(404);
  });

  it('does not let a routine be created for a foreign patient', async () => {
    await fixtures.http
      .post('/api/v1/routines')
      .set(...bearer(intruder.token))
      .send({
        patientId,
        name: 'Intrusion',
        startDate: '2026-01-01T00:00:00.000Z',
        items: [{ exerciseId, sets: 1, repsPerSet: 1, targetHoldSeconds: 0 }],
      })
      .expect(404);
  });

  it('lists none of the foreign patients', async () => {
    const { body } = await fixtures.http
      .get('/api/v1/patients')
      .set(...bearer(intruder.token))
      .expect(200);
    expect(body.total).toBe(0);
  });

  it('leaves the data untouched', async () => {
    await expect(
      testApp.prisma.patient.findUniqueOrThrow({ where: { id: patientId } }),
    ).resolves.toMatchObject({ status: 'ACTIVE' });
    await expect(
      testApp.prisma.routine.findUniqueOrThrow({ where: { id: routineId } }),
    ).resolves.toMatchObject({ status: 'ACTIVE', name: 'E2E Routine' });
  });
});
