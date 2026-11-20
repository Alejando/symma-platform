import { Fixtures } from './support/fixtures';
import { createTestApp, TestApp } from './support/test-app';

describe('Patient login attempt limit (e2e)', () => {
  let testApp: TestApp;
  let fixtures: Fixtures;
  let validAccessCode: string;

  beforeAll(async () => {
    testApp = await createTestApp();
    fixtures = new Fixtures(testApp);
    const { therapist, token } = await fixtures.therapist();
    const patient = await fixtures.patient(therapist.id);
    validAccessCode = (await fixtures.patientCredentials(token, patient.id))
      .accessCode;
  });

  afterAll(async () => {
    await fixtures.cleanup();
    await testApp.app.close();
  });

  const login = (accessCode: string) =>
    fixtures.http.post('/api/v1/auth/patient/login').send({ accessCode });

  it('answers 429 after 5 failed attempts, even for the right PIN', async () => {
    const wrongAccessCode = validAccessCode === '000000' ? '000001' : '000000';

    for (let attempt = 1; attempt <= 5; attempt++) {
      await login(wrongAccessCode).expect(401);
    }

    const blocked = await login(validAccessCode).expect(429);
    expect(blocked.body).toMatchObject({ statusCode: 429 });
    expect(typeof blocked.body.message).toBe('string');
  });
});
