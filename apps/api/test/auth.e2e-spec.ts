import { JwtService } from '@nestjs/jwt';
import { bearer, Fixtures, TherapistFixture } from './support/fixtures';
import { createTestApp, TestApp } from './support/test-app';

describe('Authentication and revocation (e2e)', () => {
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

  const activeRoutine = (token: string) =>
    fixtures.http.get('/api/v1/mobile/routine/active').set(...bearer(token));

  describe('therapist', () => {
    it('answers 401 to wrong credentials', async () => {
      await fixtures.http
        .post('/api/v1/auth/login')
        .send({ email: therapist.therapist.email, password: 'wrong-password' })
        .expect(401);
    });

    it('returns the profile for a valid token', async () => {
      const response = await fixtures.http
        .get('/api/v1/auth/profile')
        .set(...bearer(therapist.token))
        .expect(200);
      expect(response.body).toMatchObject({ id: therapist.therapist.id });
    });

    it('answers 401 to POST /patients without a token', async () => {
      await fixtures.http
        .post('/api/v1/patients')
        .send({
          firstName: 'No',
          lastName: 'Token',
          email: 'no.token@e2e.test',
          dateOfBirth: '1990-01-01',
        })
        .expect(401);
    });

    it('rejects the token of a therapist deactivated after login', async () => {
      const deactivated = await fixtures.therapist({ isActive: false });
      await fixtures.http
        .get('/api/v1/auth/profile')
        .set(...bearer(deactivated.token))
        .expect(401);
    });

    it('rejects a patient token on therapist endpoints', async () => {
      const patient = await fixtures.patient(therapist.therapist.id);
      const { token } = await fixtures.patientCredentials(
        therapist.token,
        patient.id,
      );
      await fixtures.http
        .get('/api/v1/patients')
        .set(...bearer(token))
        .expect(401);
    });
  });

  describe('patient', () => {
    it('rejects a therapist token on patient endpoints', async () => {
      await activeRoutine(therapist.token).expect(401);
    });

    it('returns the patient with the token on login', async () => {
      const patient = await fixtures.patient(therapist.therapist.id);
      const { accessCode } = await fixtures.patientCredentials(
        therapist.token,
        patient.id,
      );

      const response = await fixtures.http
        .post('/api/v1/auth/patient/login')
        .send({ accessCode })
        .expect(200);

      expect(response.body).toEqual({
        accessToken: expect.any(String),
        patient: {
          id: patient.id,
          firstName: patient.firstName,
          lastName: patient.lastName,
        },
      });
    });

    it('rejects the previous token after the PIN is revoked', async () => {
      const patient = await fixtures.patient(therapist.therapist.id);
      const { token } = await fixtures.patientCredentials(
        therapist.token,
        patient.id,
      );
      await activeRoutine(token).expect(200);

      await fixtures.http
        .delete(`/api/v1/patients/${patient.id}/access-code`)
        .set(...bearer(therapist.token))
        .expect(204);

      await activeRoutine(token).expect(401);
    });

    it('rejects the previous token after the PIN is regenerated', async () => {
      const patient = await fixtures.patient(therapist.therapist.id);
      const first = await fixtures.patientCredentials(
        therapist.token,
        patient.id,
      );
      const second = await fixtures.patientCredentials(
        therapist.token,
        patient.id,
      );

      await activeRoutine(first.token).expect(401);
      await activeRoutine(second.token).expect(200);
      await fixtures.http
        .post('/api/v1/auth/patient/login')
        .send({ accessCode: first.accessCode })
        .expect(first.accessCode === second.accessCode ? 200 : 401);
    });

    it('rejects an archived patient, both the token and a new login', async () => {
      const patient = await fixtures.patient(therapist.therapist.id);
      const { token, accessCode } = await fixtures.patientCredentials(
        therapist.token,
        patient.id,
      );

      await fixtures.http
        .delete(`/api/v1/patients/${patient.id}`)
        .set(...bearer(therapist.token))
        .expect(204);

      await activeRoutine(token).expect(401);
      await fixtures.http
        .post('/api/v1/auth/patient/login')
        .send({ accessCode })
        .expect(401);
    });
  });

  describe('token lifetimes', () => {
    const lifetimeSeconds = (token: string) => {
      const { iat, exp } = new JwtService().decode<{
        iat: number;
        exp: number;
      }>(token);
      return exp - iat;
    };

    it('issues therapist and patient tokens with separate expiries', async () => {
      const patient = await fixtures.patient(therapist.therapist.id);
      const { token } = await fixtures.patientCredentials(
        therapist.token,
        patient.id,
      );

      expect(lifetimeSeconds(therapist.token)).toBe(8 * 60 * 60);
      expect(lifetimeSeconds(token)).toBe(7 * 24 * 60 * 60);
    });
  });
});
