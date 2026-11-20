import { randomUUID } from 'crypto';
import { bearer, Fixtures, TherapistFixture } from './support/fixtures';
import { createTestApp, TestApp } from './support/test-app';

describe('Translated error messages (e2e)', () => {
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

  const unknownPatient = (acceptLanguage?: string) => {
    const call = fixtures.http
      .get(`/api/v1/patients/${randomUUID()}`)
      .set(...bearer(therapist.token));
    return (
      acceptLanguage ? call.set('Accept-Language', acceptLanguage) : call
    ).expect(404);
  };

  it('answers the same request in Spanish or English according to Accept-Language', async () => {
    const spanish = await unknownPatient('es-MX,es;q=0.9');
    const english = await unknownPatient('en-US,en;q=0.9');

    expect(spanish.body).toMatchObject({
      statusCode: 404,
      error: 'Not Found',
      message: 'Paciente no encontrado',
    });
    expect(english.body).toMatchObject({
      statusCode: 404,
      error: 'Not Found',
      message: 'Patient not found',
    });
    expect(typeof english.body.timestamp).toBe('string');
  });

  it('falls back to Spanish', async () => {
    expect((await unknownPatient()).body.message).toBe(
      'Paciente no encontrado',
    );
    expect((await unknownPatient('fr-FR')).body.message).toBe(
      'Paciente no encontrado',
    );
  });

  it('translates errors raised by the auth guard', async () => {
    const response = await fixtures.http
      .get('/api/v1/patients')
      .set('Accept-Language', 'en')
      .expect(401);

    expect(response.body.message).toBe('Unauthorized');
  });

  it('translates each validation message with the field name', async () => {
    const spanish = await fixtures.http
      .post('/api/v1/patients')
      .set(...bearer(therapist.token))
      .set('Accept-Language', 'es')
      .send({
        lastName: 'Doe',
        email: 'not-an-email',
        dateOfBirth: '1990-01-01',
      })
      .expect(400);
    const english = await fixtures.http
      .post('/api/v1/patients')
      .set(...bearer(therapist.token))
      .set('Accept-Language', 'en')
      .send({
        lastName: 'Doe',
        email: 'not-an-email',
        dateOfBirth: '1990-01-01',
      })
      .expect(400);

    expect(spanish.body.message).toEqual(
      expect.arrayContaining([
        'El campo firstName es obligatorio',
        'email debe ser un correo electrónico válido',
      ]),
    );
    expect(english.body.message).toEqual(
      expect.arrayContaining([
        'firstName is required',
        'email must be a valid email address',
      ]),
    );
  });

  it('translates unknown routes', async () => {
    const response = await fixtures.http
      .get('/api/v1/does-not-exist')
      .set('Accept-Language', 'en')
      .expect(404);

    expect(response.body.message).toBe('Resource not found');
  });
});
