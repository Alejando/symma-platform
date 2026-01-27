import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

describe('Mobile Gateway (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Setup Swagger for testing
    const config = new DocumentBuilder().setTitle('Test').build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    await app.init();
  });

  it('/api/docs (GET) - Swagger UI should load', () => {
    return request(app.getHttpServer())
      .get('/api/docs-json') // Check JSON spec instead of UI
      .expect(200);
  });

  // Note: Full auth testing requires seeding a patient and PIN hash which is complex in e2e without a test db.
  // We check that endpoints exist and handle unauthorized correctly.

  it('/auth/patient/login (POST) - Validates structure', () => {
    return request(app.getHttpServer())
      .post('/auth/patient/login')
      .send({ patientId: 'invalid-id', accessCode: '000000' })
      .expect(401);
  });

  it('/mobile/routine/active (GET) - Unauthorized without token', () => {
    return request(app.getHttpServer())
      .get('/mobile/routine/active')
      .expect(401);
  });

  afterAll(async () => {
    await app.close();
  });
});
