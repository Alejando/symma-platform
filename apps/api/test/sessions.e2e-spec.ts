import {
  ForbiddenException,
  INestApplication,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AnalyticsController } from '../src/analytics/analytics.controller';
import { JwtStrategy } from '../src/auth/jwt.strategy';
import { PrismaService } from '../src/prisma/prisma.service';
import { SessionsController } from '../src/sessions/sessions.controller';
import { SessionsService } from '../src/sessions/sessions.service';

describe('Sessions & Analytics (e2e)', () => {
  let app: INestApplication<App>;
  const jwtService = new JwtService({ secret: 'test-secret' });

  const createAuthToken = () =>
    jwtService.sign({
      sub: 'therapist-1',
      email: 'therapist@example.com',
      role: 'THERAPIST',
    });

  const sessionsServiceMock = {
    create: jest.fn(),
    findOne: jest.fn(),
  };

  const prismaMock = {
    routine: {
      findUnique: jest.fn(),
    },
    session: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PassportModule],
      controllers: [SessionsController, AnalyticsController],
      providers: [
        {
          provide: SessionsService,
          useValue: sessionsServiceMock,
        },
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) =>
              key === 'JWT_SECRET' ? 'test-secret' : undefined,
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  it('GET /sessions/:id returns 200 for valid therapist access', async () => {
    sessionsServiceMock.findOne.mockResolvedValue({
      id: 'session-1',
      routineId: 'routine-1',
      date: '2026-02-22T10:00:00.000Z',
      durationSeconds: 900,
      score: 85,
      isSynced: true,
      createdAt: '2026-02-22T10:15:00.000Z',
      items: [
        {
          id: 'item-1',
          sessionId: 'session-1',
          exerciseId: 'exercise-1',
          exerciseName: 'Smile Stretch',
          repsCompleted: 10,
          difficulty: 1,
          averageAccuracy: 88.5,
          seriesData: { reps: [82, 85, 90] },
        },
      ],
      navigation: {
        previousSessionId: null,
        nextSessionId: null,
      },
    });

    const response = await request(app.getHttpServer())
      .get('/sessions/session-1')
      .set('Authorization', `Bearer ${createAuthToken()}`)
      .expect(200);

    expect(response.body).toMatchObject({
      id: 'session-1',
      items: [{ exerciseName: 'Smile Stretch' }],
    });
  });

  it('GET /sessions/:id returns 401 when auth token is missing', async () => {
    await request(app.getHttpServer()).get('/sessions/session-1').expect(401);
  });

  it('GET /sessions/:id returns 404 for missing session', async () => {
    sessionsServiceMock.findOne.mockRejectedValue(
      new NotFoundException('Session not found'),
    );

    await request(app.getHttpServer())
      .get('/sessions/missing')
      .set('Authorization', `Bearer ${createAuthToken()}`)
      .expect(404);
  });

  it('GET /sessions/:id returns 403 for unauthorized therapist', async () => {
    sessionsServiceMock.findOne.mockRejectedValue(
      new ForbiddenException('Forbidden'),
    );

    await request(app.getHttpServer())
      .get('/sessions/foreign')
      .set('Authorization', `Bearer ${createAuthToken()}`)
      .expect(403);
  });

  it('GET /routines/:id/history returns enriched items array', async () => {
    prismaMock.routine.findUnique.mockResolvedValue({ id: 'routine-1' });
    prismaMock.session.findMany.mockResolvedValue([
      {
        id: 'session-1',
        date: new Date('2026-02-22T10:00:00.000Z'),
        durationSeconds: 900,
        score: 0.85,
        isSynced: true,
        items: [{ exerciseId: 'exercise-1', averageAccuracy: 88.5 }],
      },
    ]);

    const response = await request(app.getHttpServer())
      .get('/routines/routine-1/history')
      .expect(200);

    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          items: [{ exerciseId: 'exercise-1', averageAccuracy: 88.5 }],
        }),
      ]),
    );
  });
});
