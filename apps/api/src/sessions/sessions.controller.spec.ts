import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
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
    it('should delegate to sessionsService.create', async () => {
      const req = { user: { id: 'patient-1' } };
      const dto: CreateSessionDto = {
        routineId: 'routine-1',
        startTime: '2026-02-22T10:00:00.000Z',
        endTime: '2026-02-22T10:10:00.000Z',
        items: [],
      };
      const expected = { id: 'session-1' };

      mockSessionsService.create.mockResolvedValue(expected);

      await expect(controller.create(req, dto)).resolves.toEqual(expected);
      expect(mockSessionsService.create).toHaveBeenCalledWith('patient-1', dto);
    });
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
