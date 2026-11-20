import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import type { Exercise, Routine } from '@prisma/client';
import { SnapshotStorage } from '../src/storage/snapshot-storage.service';
import { bearer, Fixtures, TherapistFixture } from './support/fixtures';
import { createTestApp, TestApp } from './support/test-app';

const MINIO_SETTINGS: Record<string, string> = {
  S3_ENDPOINT: 'http://localhost:9000',
  S3_REGION: 'us-east-1',
  S3_BUCKET: 'symma-snapshots',
  S3_ACCESS_KEY_ID: 'e2e-access-key',
  S3_SECRET_ACCESS_KEY: 'e2e-secret-key',
  S3_FORCE_PATH_STYLE: 'true',
};

describe('Best-attempt snapshots (e2e)', () => {
  describe('without storage configuration', () => {
    let testApp: TestApp;
    let fixtures: Fixtures;

    beforeAll(async () => {
      testApp = await createTestApp();
      fixtures = new Fixtures(testApp);
    });

    afterAll(async () => {
      await fixtures.cleanup();
      await testApp.app.close();
    });

    it('starts and answers 503 on the upload endpoint', async () => {
      const { therapist, token } = await fixtures.therapist();
      const patient = await fixtures.patient(therapist.id);
      const exercise = await fixtures.exercise();
      const patientToken = (
        await fixtures.patientCredentials(token, patient.id)
      ).token;

      await fixtures.http
        .post('/api/v1/mobile/snapshots/upload-url')
        .set(...bearer(patientToken))
        .send({
          sessionId: randomUUID(),
          exerciseId: exercise.id,
          contentType: 'image/jpeg',
        })
        .expect(503);
    });
  });

  describe('with S3 configured', () => {
    let testApp: TestApp;
    let fixtures: Fixtures;
    let therapist: TherapistFixture;
    let exercise: Exercise;
    let routine: Routine;
    let patientId: string;
    let patientToken: string;

    beforeAll(async () => {
      testApp = await createTestApp((builder) =>
        builder.overrideProvider(SnapshotStorage).useValue(
          new SnapshotStorage({
            get: (name: string) => MINIO_SETTINGS[name],
          } as unknown as ConfigService),
        ),
      );
      fixtures = new Fixtures(testApp);
      therapist = await fixtures.therapist();
      exercise = await fixtures.exercise();
      patientId = (await fixtures.patient(therapist.therapist.id)).id;
      routine = await fixtures.routine(patientId, [exercise.id]);
      patientToken = (
        await fixtures.patientCredentials(therapist.token, patientId)
      ).token;
    });

    afterAll(async () => {
      await fixtures.cleanup();
      await testApp.app.close();
    });

    const requestUpload = (body: Record<string, unknown>) =>
      fixtures.http
        .post('/api/v1/mobile/snapshots/upload-url')
        .set(...bearer(patientToken))
        .send(body);

    it('issues an upload URL, accepts the key on sync and signs it for the therapist', async () => {
      const sessionId = randomUUID();

      const upload = await requestUpload({
        sessionId,
        exerciseId: exercise.id,
        contentType: 'image/jpeg',
      }).expect(201);

      expect(upload.body).toEqual({
        uploadUrl: expect.stringContaining('X-Amz-Signature='),
        snapshotKey: `snapshots/${patientId}/${sessionId}/${exercise.id}.jpg`,
        expiresInSeconds: 300,
      });

      await fixtures.http
        .post('/api/v1/sessions')
        .set(...bearer(patientToken))
        .send({
          id: sessionId,
          routineId: routine.id,
          startTime: '2026-03-01T10:00:00.000Z',
          endTime: '2026-03-01T10:05:00.000Z',
          items: [
            {
              exerciseId: exercise.id,
              repsCompleted: 4,
              snapshotKey: upload.body.snapshotKey,
            },
          ],
        })
        .expect(201);

      const detail = await fixtures.http
        .get(`/api/v1/sessions/${sessionId}`)
        .set(...bearer(therapist.token))
        .expect(200);
      const [item] = detail.body.items as Record<string, unknown>[];

      expect(item).not.toHaveProperty('snapshotKey');
      const snapshotUrl = new URL(item.snapshotUrl as string);
      expect(snapshotUrl.pathname).toBe(
        `/symma-snapshots/${upload.body.snapshotKey}`,
      );
      expect(snapshotUrl.searchParams.get('X-Amz-Expires')).toBe('300');
    });

    it.each([
      ['a content type other than JPEG', { contentType: 'image/png' }],
      ['a session id that is not a UUID', { sessionId: 'abc' }],
    ])('answers 400 for %s', async (_case, overrides) => {
      await requestUpload({
        sessionId: randomUUID(),
        exerciseId: exercise.id,
        contentType: 'image/jpeg',
        ...overrides,
      }).expect(400);
    });

    it('answers 404 for an unknown exercise', async () => {
      await requestUpload({
        sessionId: randomUUID(),
        exerciseId: randomUUID(),
        contentType: 'image/jpeg',
      }).expect(404);
    });

    it("rejects a session that uses another patient's snapshot key", async () => {
      const sessionId = randomUUID();
      await fixtures.http
        .post('/api/v1/sessions')
        .set(...bearer(patientToken))
        .send({
          id: sessionId,
          routineId: routine.id,
          startTime: '2026-03-01T10:00:00.000Z',
          endTime: '2026-03-01T10:05:00.000Z',
          items: [
            {
              exerciseId: exercise.id,
              repsCompleted: 4,
              snapshotKey: `snapshots/${randomUUID()}/${sessionId}/${exercise.id}.jpg`,
            },
          ],
        })
        .expect(400);
    });

    it('answers 401 without a patient token', async () => {
      await fixtures.http
        .post('/api/v1/mobile/snapshots/upload-url')
        .set(...bearer(therapist.token))
        .send({
          sessionId: randomUUID(),
          exerciseId: exercise.id,
          contentType: 'image/jpeg',
        })
        .expect(401);
    });
  });
});
