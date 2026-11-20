import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../auth/types';

describe('SessionsController', () => {
  let controller: SessionsController;

  const mockSessionsService = {
    create: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionsController],
      providers: [
        {
          provide: SessionsService,
          useValue: mockSessionsService,
        },
      ],
    }).compile();

    controller = module.get<SessionsController>(SessionsController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const req = {
      user: { id: 'patient-1', firstName: 'Ana', lastName: 'Diaz' },
    };
    const dto: CreateSessionDto = {
      id: '3f0c8a52-6a55-4f8e-9a10-2b7a3d5c9e11',
      routineId: 'routine-1',
      startTime: '2026-02-22T10:00:00.000Z',
      endTime: '2026-02-22T10:10:00.000Z',
      items: [{ exerciseId: 'exercise-1', repsCompleted: 5 }],
    };

    it.each([
      [true, 201],
      [false, 200],
    ])(
      'answers %s-created sessions with HTTP %i',
      async (created, expectedStatus) => {
        const session = { id: dto.id };
        const response = { status: jest.fn() } as unknown as Response;
        mockSessionsService.create.mockResolvedValue({ session, created });

        await expect(controller.create(req, dto, response)).resolves.toBe(
          session,
        );
        expect(mockSessionsService.create).toHaveBeenCalledWith(
          'patient-1',
          dto,
        );
        expect(response.status).toHaveBeenCalledWith(expectedStatus);
      },
    );
  });

  describe('findOne', () => {
    const req = {
      user: {
        userId: 'therapist-1',
        email: 'therapist@example.com',
        role: 'THERAPIST',
      },
    } as AuthenticatedRequest;

    it('should delegate to sessionsService.findOne with therapist userId', async () => {
      const expected = { id: 'session-1' };
      mockSessionsService.findOne.mockResolvedValue(expected);

      await expect(controller.findOne(req, 'session-1')).resolves.toEqual(
        expected,
      );
      expect(mockSessionsService.findOne).toHaveBeenCalledWith(
        'session-1',
        'therapist-1',
      );
    });

    it('should propagate NotFoundException', async () => {
      mockSessionsService.findOne.mockRejectedValue(
        new NotFoundException('Session not found'),
      );

      await expect(controller.findOne(req, 'session-missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should propagate ForbiddenException', async () => {
      mockSessionsService.findOne.mockRejectedValue(
        new ForbiddenException('Forbidden'),
      );

      await expect(controller.findOne(req, 'session-foreign')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
