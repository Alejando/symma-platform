import request from 'supertest';
import { createTestApp, TestApp } from './support/test-app';

describe('AppController (e2e)', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  it('GET /api/v1 answers the health greeting', () => {
    return request(testApp.app.getHttpServer())
      .get('/api/v1')
      .expect(200)
      .expect('Hello World!');
  });
});
