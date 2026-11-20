import { bearer, Fixtures, TherapistFixture } from './support/fixtures';
import { createTestApp, TestApp } from './support/test-app';

describe('Routine analytics (e2e)', () => {
  let testApp: TestApp;
  let fixtures: Fixtures;
  let owner: TherapistFixture;
  let otherTherapist: TherapistFixture;
  let routineId: string;

  beforeAll(async () => {
    testApp = await createTestApp();
    fixtures = new Fixtures(testApp);
    owner = await fixtures.therapist();
    otherTherapist = await fixtures.therapist();
    const exercise = await fixtures.exercise();
    const patient = await fixtures.patient(owner.therapist.id);
    routineId = (await fixtures.routine(patient.id, [exercise.id])).id;
  });

  afterAll(async () => {
    await fixtures.cleanup();
    await testApp.app.close();
  });

  describe.each(['stats', 'history'])('GET /routines/:id/%s', (endpoint) => {
    const path = () => `/api/v1/routines/${routineId}/${endpoint}`;

    it('answers 401 without a token', async () => {
      await fixtures.http.get(path()).expect(401);
    });

    it("answers 404 with another therapist's token", async () => {
      await fixtures.http
        .get(path())
        .set(...bearer(otherTherapist.token))
        .expect(404);
    });

    it('answers 200 to the therapist who owns the patient', async () => {
      await fixtures.http
        .get(path())
        .set(...bearer(owner.token))
        .expect(200);
    });
  });
});
