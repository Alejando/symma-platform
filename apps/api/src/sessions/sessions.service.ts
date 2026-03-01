import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import type { SessionDetailResponse } from '@symma/shared-types';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(
    sessionId: string,
    therapistId: string,
  ): Promise<SessionDetailResponse> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        items: {
          include: {
            exercise: {
              select: {
                name: true,
              },
            },
          },
        },
        routine: {
          include: {
            patient: {
              select: {
                therapistId: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.routine.patient.therapistId !== therapistId) {
      throw new ForbiddenException(
        'You are not allowed to access this session',
      );
    }

    const sessions = await this.prisma.session.findMany({
      where: { routineId: session.routineId },
      orderBy: { date: 'asc' },
      select: {
        id: true,
      },
    });

    const currentIndex = sessions.findIndex((s) => s.id === session.id);
    const previousSessionId =
      currentIndex > 0 ? sessions[currentIndex - 1].id : null;
    const nextSessionId =
      currentIndex >= 0 && currentIndex < sessions.length - 1
        ? sessions[currentIndex + 1].id
        : null;

    return {
      id: session.id,
      routineId: session.routineId,
      date: session.date.toISOString(),
      durationSeconds: session.durationSeconds,
      score: Math.round(session.score * 100),
      isSynced: session.isSynced,
      createdAt: session.createdAt.toISOString(),
      items: session.items.map((item) => ({
        id: item.id,
        sessionId: item.sessionId,
        exerciseId: item.exerciseId,
        exerciseName: item.exercise.name,
        repsCompleted: item.repsCompleted,
        difficulty: item.difficulty,
        averageAccuracy: item.averageAccuracy,
        seriesData: item.seriesData,
      })),
      navigation: {
        previousSessionId,
        nextSessionId,
      },
    };
  }

  async create(patientId: string, createSessionDto: CreateSessionDto) {
    // Idempotency check: if client provided an id, check if session already exists
    if (createSessionDto.id) {
      const existingSession = await this.prisma.session.findUnique({
        where: { id: createSessionDto.id },
        include: { items: true },
      });

      if (existingSession) {
        // Return existing session for idempotency (client can treat this as success)
        return existingSession;
      }
    }

    // Basic validations
    const routine = await this.prisma.routine.findUnique({
      where: { id: createSessionDto.routineId },
    });

    if (!routine) {
      throw new NotFoundException('Routine not found');
    }

    // Calculate duration
    const start = new Date(createSessionDto.startTime);
    const end = new Date(createSessionDto.endTime);
    const durationSeconds = Math.max(
      0,
      Math.floor((end.getTime() - start.getTime()) / 1000),
    );

    // Calculate overall session score (average of item accuracies) for the Session entity
    // If no accuracy data, default to 0
    const itemsWithAccuracy = createSessionDto.items.filter(
      (item) => item.averageAccuracy !== undefined,
    );
    const sessionScore =
      itemsWithAccuracy.length > 0
        ? itemsWithAccuracy.reduce(
            (acc, item) => acc + (item.averageAccuracy || 0),
            0,
          ) / itemsWithAccuracy.length
        : 0;

    const sessionItemsData: Prisma.SessionItemUncheckedCreateWithoutSessionInput[] =
      createSessionDto.items.map((item) => ({
        exerciseId: item.exerciseId,
        repsCompleted: item.repsCompleted,
        difficulty: item.difficulty || 0,
        averageAccuracy: item.averageAccuracy,
        seriesData:
          item.seriesData === undefined
            ? undefined
            : item.seriesData === null
              ? Prisma.JsonNull
              : (item.seriesData as Prisma.InputJsonValue),
      }));

    return this.prisma.session.create({
      data: {
        ...(createSessionDto.id && { id: createSessionDto.id }),
        routineId: createSessionDto.routineId,
        date: start,
        durationSeconds,
        score: sessionScore, // Persistent record of overall performance
        isSynced: true, // Created directly from online app
        items: {
          create: sessionItemsData,
        },
      },
      include: { items: true },
    });
  }
}
