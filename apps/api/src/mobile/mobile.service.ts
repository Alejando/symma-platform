import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActiveRoutineResponseDto } from './dto/active-routine-response.dto';

@Injectable()
export class MobileService {
  constructor(private readonly prisma: PrismaService) { }

  async getActiveRoutine(patientId: string): Promise<ActiveRoutineResponseDto | null> {
    const routine = await this.prisma.routine.findFirst({
      where: {
        patientId,
        status: 'ACTIVE',
      },
      orderBy: { startDate: 'desc' },
      include: {
        items: {
          orderBy: { orderIndex: 'asc' },
          include: {
            exercise: true,
          },
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
}
