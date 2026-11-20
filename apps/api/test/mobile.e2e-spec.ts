import { bearer, Fixtures, TherapistFixture } from './support/fixtures';
import { createTestApp, TestApp } from './support/test-app';

describe('Mobile gateway (e2e)', () => {
  let testApp: TestApp;
  let fixtures: Fixtures;
  let therapist: TherapistFixture;

  beforeAll(async () => {
    testApp = await createTestApp();
    fixtures = new Fixtures(testApp);
    therapist = await fixtures.therapist();
  });

  afterAll(async () => {
    await fixtures.cleanup();
    await testApp.app.close();
  });

  const loggedInPatient = async () => {
    const patient = await fixtures.patient(therapist.therapist.id);
    const { token } = await fixtures.patientCredentials(
      therapist.token,
      patient.id,
    );
    return { patient, token };
  };

  const activeRoutine = (token: string) =>
    fixtures.http.get('/api/v1/mobile/routine/active').set(...bearer(token));

  it('POST /auth/patient/login answers 401 for an unknown PIN', async () => {
    await fixtures.http
      .post('/api/v1/auth/patient/login')
      .send({ accessCode: '000000' })
      .expect(401);
  });

  it.each([['12345'], ['1234567'], ['12a456'], ['']])(
    'POST /auth/patient/login answers 400 for the malformed PIN "%s"',
    async (accessCode) => {
      await fixtures.http
        .post('/api/v1/auth/patient/login')
        .send({ accessCode })
        .expect(400);
    },
  );

  it('GET /mobile/routine/active answers 401 without a token', async () => {
    await fixtures.http.get('/api/v1/mobile/routine/active').expect(401);
  });

  it('serves the ACTIVE routine with its exercises', async () => {
    const { patient, token } = await loggedInPatient();
    const exercise = await fixtures.exercise();
    const routine = await fixtures.routine(patient.id, [exercise.id]);

    const { body } = await activeRoutine(token).expect(200);

    expect(body).toMatchObject({
      id: routine.id,
      status: 'ACTIVE',
      items: [
        {
          orderIndex: 0,
          sets: 2,
          repsPerSet: 5,
          exercise: { id: exercise.id, mobileModule: 'SMILE' },
        },
      ],
    });
  });

  it('never serves DRAFT or ARCHIVED routines', async () => {
    const { patient, token } = await loggedInPatient();
    const exercise = await fixtures.exercise();
    await fixtures.routine(patient.id, [exercise.id], { status: 'DRAFT' });
    await fixtures.routine(patient.id, [exercise.id], { status: 'ARCHIVED' });

    const response = await activeRoutine(token).expect(200);

    expect(response.text).toBe('');
  });
});
