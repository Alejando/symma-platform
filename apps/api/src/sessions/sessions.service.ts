import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  SessionDetailResponse,
  SessionResponse,
} from '@symma/shared-types';
import { PrismaService } from '../prisma/prisma.service';
import {
  isPrismaError,
  PRISMA_UNIQUE_VIOLATION,
} from '../common/prisma/prisma-errors';
import { SnapshotStorage } from '../storage/snapshot-storage.service';
import { snapshotKeyFor } from '../storage/snapshot-key';
import { CreateSessionDto, SessionItemDto } from './dto/create-session.dto';
import {
  toCalibration,
  toSessionItemResponse,
  toSessionResponse,
} from './sessions.mapper';

export interface SessionCreationResult {
  session: SessionResponse;
  created: boolean;
}

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly snapshotStorage: SnapshotStorage,
  ) {}

  async findOne(
    sessionId: string,
    therapistId: string,
  ): Promise<SessionDetailResponse> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        items: { include: { exercise: { select: { name: true } } } },
        routine: { include: { patient: { select: { therapistId: true } } } },
      },
    });

    if (!session) {
      throw new NotFoundException('errors.sessions.notFound');
    }

    if (session.routine.patient.therapistId !== therapistId) {
      throw new ForbiddenException('errors.sessions.forbidden');
    }

    const [previous, next, items] = await Promise.all([
      this.prisma.session.findFirst({
        where: { routineId: session.routineId, date: { lt: session.date } },
        orderBy: { date: 'desc' },
        select: { id: true },
      }),
      this.prisma.session.findFirst({
        where: { routineId: session.routineId, date: { gt: session.date } },
        orderBy: { date: 'asc' },
        select: { id: true },
      }),
      Promise.all(
        session.items.map(async ({ exercise, ...item }) => ({
          ...toSessionItemResponse(item),
          exerciseName: exercise.name,
          snapshotUrl: await this.snapshotStorage.createReadUrl(
            item.snapshotKey,
          ),
        })),
      ),
    ]);

    return {
      id: session.id,
      routineId: session.routineId,
      date: session.date.toISOString(),
      durationSeconds: session.durationSeconds,
      score: Math.round(session.score),
      isSynced: session.isSynced,
      createdAt: session.createdAt.toISOString(),
      calibration: toCalibration(session.calibration),
      items,
      navigation: {
        previousSessionId: previous?.id ?? null,
        nextSessionId: next?.id ?? null,
      },
    };
  }

  async create(
    patientId: string,
    dto: CreateSessionDto,
  ): Promise<SessionCreationResult> {
    const replay = await this.findReplay(patientId, dto.id);
    if (replay) {
      return { session: replay, created: false };
    }

    await this.assertCanRecordOn(patientId, dto.routineId);
    await this.assertExercisesExist(dto.items);
    assertSnapshotKeysBelongTo(patientId, dto);

    try {
      const session = await this.prisma.session.create({
        data: toSessionCreateInput(dto),
        include: { items: true },
      });
      return { session: toSessionResponse(session), created: true };
    } catch (error) {
      if (isPrismaError(error, PRISMA_UNIQUE_VIOLATION)) {
        const concurrentReplay = await this.findReplay(patientId, dto.id);
        if (concurrentReplay) {
          return { session: concurrentReplay, created: false };
        }
      }
      throw error;
    }
  }

  private async findReplay(
    patientId: string,
    sessionId: string,
  ): Promise<SessionResponse | null> {
    const existing = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { items: true, routine: { select: { patientId: true } } },
    });

    if (!existing) {
      return null;
    }

    if (existing.routine.patientId !== patientId) {
      throw new ForbiddenException('errors.sessions.forbidden');
    }

    return toSessionResponse(existing);
  }

  private async assertCanRecordOn(
    patientId: string,
    routineId: string,
  ): Promise<void> {
    const routine = await this.prisma.routine.findUnique({
      where: { id: routineId },
      select: { patientId: true, status: true },
    });

    if (!routine) {
      throw new NotFoundException('errors.routines.notFound');
    }

    if (routine.patientId !== patientId) {
      throw new ForbiddenException('errors.sessions.routineForbidden');
    }

    if (routine.status !== 'ACTIVE') {
      throw new ConflictException('errors.sessions.routineNotActive');
    }
  }

  private async assertExercisesExist(items: SessionItemDto[]): Promise<void> {
    const exerciseIds = [...new Set(items.map((item) => item.exerciseId))];
    const found = await this.prisma.exercise.count({
      where: { id: { in: exerciseIds } },
    });

    if (found !== exerciseIds.length) {
      throw new BadRequestException('errors.sessions.unknownExercise');
    }
  }
}

function assertSnapshotKeysBelongTo(
  patientId: string,
  dto: CreateSessionDto,
): void {
  const foreignKey = dto.items.some(
    (item) =>
      item.snapshotKey !== undefined &&
      item.snapshotKey !== snapshotKeyFor(patientId, dto.id, item.exerciseId),
  );

  if (foreignKey) {
    throw new BadRequestException('errors.sessions.invalidSnapshotKey');
  }
}

function toSessionCreateInput(
  dto: CreateSessionDto,
): Prisma.SessionUncheckedCreateInput {
  const start = new Date(dto.startTime);
  const end = new Date(dto.endTime);

  return {
    id: dto.id,
    routineId: dto.routineId,
    date: start,
    durationSeconds: Math.floor((end.getTime() - start.getTime()) / 1000),
    score: averageAccuracyOf(dto.items),
    isSynced: true,
    calibration: dto.calibration
      ? {
          capturedAt: dto.calibration.capturedAt,
          values: dto.calibration.values,
        }
      : undefined,
    items: { create: dto.items.map(toSessionItemCreateInput) },
  };
}

function toSessionItemCreateInput(
  item: SessionItemDto,
): Prisma.SessionItemUncheckedCreateWithoutSessionInput {
  return {
    exerciseId: item.exerciseId,
    repsCompleted: item.repsCompleted,
    averageAccuracy: item.averageAccuracy,
    symmetryScore: item.symmetryScore,
    averageHoldSeconds: item.averageHoldSeconds,
    snapshotKey: item.snapshotKey,
    seriesData:
      item.seriesData === undefined
        ? undefined
        : item.seriesData === null
          ? Prisma.JsonNull
          : (item.seriesData as Prisma.InputJsonValue),
  };
}

function averageAccuracyOf(items: SessionItemDto[]): number {
  const accuracies = items
    .map((item) => item.averageAccuracy)
    .filter((accuracy): accuracy is number => accuracy !== undefined);

  return accuracies.length > 0
    ? accuracies.reduce((sum, accuracy) => sum + accuracy, 0) /
        accuracies.length
    : 0;
}
