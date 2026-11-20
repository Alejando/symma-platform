import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { SnapshotUploadUrlResponse } from '@symma/shared-types';
import { PrismaService } from '../prisma/prisma.service';
import {
  SNAPSHOT_URL_TTL_SECONDS,
  SnapshotStorage,
} from '../storage/snapshot-storage.service';
import { snapshotKeyFor } from '../storage/snapshot-key';
import { ActiveRoutineResponseDto } from './dto/active-routine-response.dto';
import { SnapshotUploadUrlDto } from './dto/snapshot-upload-url.dto';

@Injectable()
export class MobileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly snapshotStorage: SnapshotStorage,
  ) {}

  async getActiveRoutine(
    patientId: string,
  ): Promise<ActiveRoutineResponseDto | null> {
    const routine = await this.prisma.routine.findFirst({
      where: { patientId, status: 'ACTIVE' },
      orderBy: { startDate: 'desc' },
      include: {
        items: {
          orderBy: { orderIndex: 'asc' },
          include: { exercise: true },
        },
      },
    });

    if (!routine) return null;

    return {
      id: routine.id,
      name: routine.name,
      startDate: routine.startDate.toISOString(),
      endDate: routine.endDate?.toISOString() ?? null,
      status: routine.status,
      items: routine.items.map((item) => ({
        id: item.id,
        orderIndex: item.orderIndex,
        sets: item.sets,
        repsPerSet: item.repsPerSet,
        targetHoldSeconds: item.targetHoldSeconds,
        restBetweenSets: item.restBetweenSets,
        difficultyLevel: item.difficultyLevel,
        strictMode: item.strictMode,
        exercise: {
          id: item.exercise.id,
          name: item.exercise.name,
          keyName: item.exercise.keyName,
          description: item.exercise.description,
          type: item.exercise.type,
          category: item.exercise.category,
          mobileModule: item.exercise.mobileModule,
          assetAnimationUrl: item.exercise.assetAnimationUrl,
          assetTutorialVideoUrl: item.exercise.assetTutorialVideoUrl,
        },
      })),
    };
  }

  async createSnapshotUploadUrl(
    patientId: string,
    dto: SnapshotUploadUrlDto,
  ): Promise<SnapshotUploadUrlResponse> {
    if (!this.snapshotStorage.isAvailable()) {
      throw new ServiceUnavailableException('errors.storage.unavailable');
    }

    const [exercise, existingSession] = await Promise.all([
      this.prisma.exercise.findUnique({
        where: { id: dto.exerciseId },
        select: { id: true },
      }),
      this.prisma.session.findUnique({
        where: { id: dto.sessionId },
        select: { routine: { select: { patientId: true } } },
      }),
    ]);

    if (!exercise) {
      throw new NotFoundException('errors.exercises.notFound');
    }

    if (existingSession && existingSession.routine.patientId !== patientId) {
      throw new ForbiddenException('errors.sessions.forbidden');
    }

    const snapshotKey = snapshotKeyFor(patientId, dto.sessionId, exercise.id);
    return {
      uploadUrl: await this.snapshotStorage.createUploadUrl(
        snapshotKey,
        dto.contentType,
      ),
      snapshotKey,
      expiresInSeconds: SNAPSHOT_URL_TTL_SECONDS,
    };
  }
}
