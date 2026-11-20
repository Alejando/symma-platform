import type { Exercise, Patient } from '@prisma/client';
import { bearer, Fixtures, TherapistFixture } from './support/fixtures';
import { createTestApp, TestApp } from './support/test-app';

describe('Routine lifecycle (e2e)', () => {
  let testApp: TestApp;
  let fixtures: Fixtures;
  let owner: TherapistFixture;
  let exercise: Exercise;
  let patient: Omit<Patient, 'accessCodeHash'>;
  let patientToken: string;

  beforeAll(async () => {
    testApp = await createTestApp();
    fixtures = new Fixtures(testApp);
    owner = await fixtures.therapist();
    exercise = await fixtures.exercise();
    patient = await fixtures.patient(owner.therapist.id);
    patientToken = (await fixtures.patientCredentials(owner.token, patient.id))
      .token;
  });

  afterAll(async () => {
    await fixtures.cleanup();
    await testApp.app.close();
  });

  const activeRoutineId = async () => {
    const response = await fixtures.http
      .get('/api/v1/mobile/routine/active')
      .set(...bearer(patientToken))
      .expect(200);
    return (response.body as { id: string } | null)?.id;
  };

  const activeRoutineCount = () =>
    testApp.prisma.routine.count({
      where: { patientId: patient.id, status: 'ACTIVE' },
    });

  it('keeps serving the original until the clone is activated', async () => {
    const original = await fixtures.routine(patient.id, [exercise.id]);

    const clone = await fixtures.http
      .post(`/api/v1/routines/${original.id}/clone`)
      .set(...bearer(owner.token))
      .expect(201);
    const cloneId = (clone.body as { id: string; status: string }).id;

    expect((clone.body as { status: string }).status).toBe('DRAFT');
    expect(await activeRoutineId()).toBe(original.id);

    const activated = await fixtures.http
      .post(`/api/v1/routines/${cloneId}/activate`)
      .set(...bearer(owner.token))
      .expect(200);

    expect((activated.body as { status: string }).status).toBe('ACTIVE');
    expect(await activeRoutineId()).toBe(cloneId);
    expect(await activeRoutineCount()).toBe(1);
    await expect(
      testApp.prisma.routine.findUniqueOrThrow({ where: { id: original.id } }),
    ).resolves.toMatchObject({ status: 'ARCHIVED' });
  });

  it('keeps a single ACTIVE routine when a new one is created', async () => {
    await fixtures.http
      .post('/api/v1/routines')
      .set(...bearer(owner.token))
      .send({
        patientId: patient.id,
        name: 'Brand new',
        startDate: '2026-04-01T00:00:00.000Z',
        items: [
          {
            exerciseId: exercise.id,
            sets: 1,
            repsPerSet: 5,
            targetHoldSeconds: 0,
          },
        ],
      })
      .expect(201);

    expect(await activeRoutineCount()).toBe(1);
  });

  it('answers 404 when another therapist activates the routine', async () => {
    const other = await fixtures.therapist();
    const draft = await fixtures.routine(patient.id, [exercise.id], {
      status: 'DRAFT',
    });

    await fixtures.http
      .post(`/api/v1/routines/${draft.id}/activate`)
      .set(...bearer(other.token))
      .expect(404);
  });

  it('answers 204 on delete', async () => {
    const draft = await fixtures.routine(patient.id, [exercise.id], {
      status: 'DRAFT',
    });

    await fixtures.http
      .delete(`/api/v1/routines/${draft.id}`)
      .set(...bearer(owner.token))
      .expect(204);
  });
});
