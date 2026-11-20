import { randomUUID } from 'crypto';
import { bearer, Fixtures, TherapistFixture } from './support/fixtures';
import { createTestApp, TestApp } from './support/test-app';

describe('Exercise catalog (e2e)', () => {
  let testApp: TestApp;
  let fixtures: Fixtures;
  let admin: TherapistFixture;
  let therapist: TherapistFixture;

  beforeAll(async () => {
    testApp = await createTestApp();
    fixtures = new Fixtures(testApp);
    admin = await fixtures.therapist({ role: 'ADMIN' });
    therapist = await fixtures.therapist();
  });

  afterAll(async () => {
    await fixtures.cleanup();
    await testApp.app.close();
  });

  const exerciseBody = () => ({
    keyName: `e2e_catalog_${randomUUID()}`,
    name: 'Catalog exercise',
    type: 'ISOMETRIC',
    category: 'CORE',
    mobileModule: 'BROWS',
  });

  const routineUsing = async (
    exerciseId: string,
    status: 'ACTIVE' | 'ARCHIVED',
  ) => {
    const patient = await fixtures.patient(therapist.therapist.id);
    return fixtures.routine(patient.id, [exerciseId], { status });
  };

  describe('only ADMIN modifies the catalog', () => {
    it('answers 403 to a therapist on create, update and delete', async () => {
      const exercise = await fixtures.exercise();
      const auth = bearer(therapist.token);

      await fixtures.http
        .post('/api/v1/exercises')
        .set(...auth)
        .send(exerciseBody())
        .expect(403);
      await fixtures.http
        .patch(`/api/v1/exercises/${exercise.id}`)
        .set(...auth)
        .send({ name: 'Renamed' })
        .expect(403);
      await fixtures.http
        .delete(`/api/v1/exercises/${exercise.id}`)
        .set(...auth)
        .expect(403);
    });

    it('lets every therapist read the catalog', async () => {
      const exercise = await fixtures.exercise();
      await fixtures.http
        .get(`/api/v1/exercises/${exercise.id}`)
        .set(...bearer(therapist.token))
        .expect(200);
    });

    it('lets an ADMIN create, update and delete (204)', async () => {
      const auth = bearer(admin.token);
      const created = await fixtures.http
        .post('/api/v1/exercises')
        .set(...auth)
        .send(exerciseBody())
        .expect(201);
      const id = (created.body as { id: string }).id;

      await fixtures.http
        .patch(`/api/v1/exercises/${id}`)
        .set(...auth)
        .send({ name: 'Renamed' })
        .expect(200);
      const deleted = await fixtures.http
        .delete(`/api/v1/exercises/${id}`)
        .set(...auth)
        .expect(204);
      expect(deleted.text).toBe('');
    });
  });

  describe('exercise in use', () => {
    it('answers 409 with a descriptive message to update or delete an exercise of an ACTIVE routine', async () => {
      const exercise = await fixtures.exercise();
      await routineUsing(exercise.id, 'ACTIVE');
      const auth = bearer(admin.token);

      const update = await fixtures.http
        .patch(`/api/v1/exercises/${exercise.id}`)
        .set(...auth)
        .set('Accept-Language', 'en')
        .send({ name: 'Renamed' })
        .expect(409);
      const removal = await fixtures.http
        .delete(`/api/v1/exercises/${exercise.id}`)
        .set(...auth)
        .set('Accept-Language', 'en')
        .expect(409);

      for (const { body } of [update, removal]) {
        expect(body.statusCode).toBe(409);
        expect(body.message).toMatch(/active routine/i);
        expect(body.message).not.toMatch(/^errors\./);
      }
    });

    it('allows editing an exercise used only by archived routines', async () => {
      const exercise = await fixtures.exercise();
      await routineUsing(exercise.id, 'ARCHIVED');

      await fixtures.http
        .patch(`/api/v1/exercises/${exercise.id}`)
        .set(...bearer(admin.token))
        .send({ name: 'Renamed' })
        .expect(200);
    });

    it('answers 409, not 500, to delete an exercise still referenced by an archived routine', async () => {
      const exercise = await fixtures.exercise();
      await routineUsing(exercise.id, 'ARCHIVED');

      await fixtures.http
        .delete(`/api/v1/exercises/${exercise.id}`)
        .set(...bearer(admin.token))
        .expect(409);
    });
  });

  describe('Prisma errors and missing records', () => {
    it('answers 404 to GET, PATCH and DELETE of an unknown id', async () => {
      const auth = bearer(admin.token);
      const path = `/api/v1/exercises/${randomUUID()}`;

      await fixtures.http
        .get(path)
        .set(...auth)
        .expect(404);
      await fixtures.http
        .patch(path)
        .set(...auth)
        .send({ name: 'x' })
        .expect(404);
      await fixtures.http
        .delete(path)
        .set(...auth)
        .expect(404);
    });

    it('answers 409 to a duplicate keyName', async () => {
      const existing = await fixtures.exercise();

      await fixtures.http
        .post('/api/v1/exercises')
        .set(...bearer(admin.token))
        .send({ ...exerciseBody(), keyName: existing.keyName })
        .expect(409);
    });
  });
});
