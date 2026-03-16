import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoutineDto } from './dto/create-routine.dto';
import { UpdateRoutineDto } from './dto/update-routine.dto';
import type { PaginatedResponse } from '@symma/shared-types';

@Injectable()
export class RoutinesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(therapistId: string, createRoutineDto: CreateRoutineDto) {
    // Validate dates
    const startDate = new Date(createRoutineDto.startDate);
    if (createRoutineDto.endDate) {
      const endDate = new Date(createRoutineDto.endDate);
      if (startDate >= endDate) {
        throw new BadRequestException('Start date must be before end date');
      }
    }

    // Verify patient belongs to therapist
    const patient = await this.prisma.patient.findFirst({
      where: {
        id: createRoutineDto.patientId,
        therapistId,
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Create routine with nested items using Prisma nested writes
    return this.prisma.routine.create({
      data: {
        patientId: createRoutineDto.patientId,
        name: createRoutineDto.name,
        startDate,
        endDate: createRoutineDto.endDate
          ? new Date(createRoutineDto.endDate)
          : null,
        therapistNotes: createRoutineDto.therapistNotes,
        items: {
          create: createRoutineDto.items.map((item, index) => ({
            exerciseId: item.exerciseId,
            orderIndex: index,
            sets: item.sets,
            repsPerSet: item.repsPerSet,
            targetHoldSeconds: item.targetHoldSeconds,
            difficultyLevel: item.difficultyLevel ?? 1.0,
            restBetweenSets: item.restBetweenSets ?? 60,
            strictMode: item.strictMode ?? false,
            allowSkip: item.allowSkip ?? true,
          })),
        },
      },
      include: {
        items: {
          include: { exercise: true },
          orderBy: { orderIndex: 'asc' },
        },
        patient: true,
      },
    });
  }

  async findAll(
    therapistId: string,
    options: { page?: number; limit?: number } = {},
  ): Promise<PaginatedResponse<unknown>> {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where = { patient: { therapistId } };

    const [data, total] = await Promise.all([
      this.prisma.routine.findMany({
        where,
        include: {
          patient: {
            select: { firstName: true, lastName: true },
          },
          items: {
            include: { exercise: true },
            orderBy: { orderIndex: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.routine.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findAllByPatient(therapistId: string, patientId: string) {
    // Verify patient belongs to therapist
    const patient = await this.prisma.patient.findFirst({
      where: {
        id: patientId,
        therapistId,
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return this.prisma.routine.findMany({
      where: {
        patientId,
      },
      include: {
        items: {
          include: { exercise: true },
          orderBy: { orderIndex: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(therapistId: string, id: string) {
    const routine = await this.prisma.routine.findFirst({
      where: {
        id,
        patient: { therapistId },
      },
      include: {
        patient: true,
        items: {
          include: { exercise: true },
          orderBy: { orderIndex: 'asc' },
        },
        _count: {
          select: { sessions: true },
        },
      },
    });

    if (!routine) {
      throw new NotFoundException('Routine not found');
    }

    // Transform _count to sessionsCount for frontend compatibility
    return {
      ...routine,
      sessionsCount: routine._count.sessions,
      _count: undefined,
    };
  }

  async update(
    therapistId: string,
    id: string,
    updateRoutineDto: UpdateRoutineDto,
  ) {
    // Verify ownership
    await this.findOne(therapistId, id);

    // Check if routine has sessions (data integrity guard)
    const sessionCount = await this.prisma.session.count({
      where: { routineId: id },
    });

    // If routine has sessions, block changes to items (exercises)
    if (sessionCount > 0 && updateRoutineDto.items) {
      throw new ForbiddenException(
        'Cannot modify exercises for a routine with existing sessions. Clone the routine to make changes.',
      );
    }

    // Validate dates if both provided
    if (updateRoutineDto.startDate && updateRoutineDto.endDate) {
      const startDate = new Date(updateRoutineDto.startDate);
      const endDate = new Date(updateRoutineDto.endDate);
      if (startDate >= endDate) {
        throw new BadRequestException('Start date must be before end date');
      }
    }

    // Build update data (metadata only if locked)
    const updateData: Record<string, unknown> = {};

    if (updateRoutineDto.name) updateData.name = updateRoutineDto.name;
    if (updateRoutineDto.startDate)
      updateData.startDate = new Date(updateRoutineDto.startDate);
    if (updateRoutineDto.endDate)
      updateData.endDate = new Date(updateRoutineDto.endDate);
    if (updateRoutineDto.therapistNotes !== undefined)
      updateData.therapistNotes = updateRoutineDto.therapistNotes;

    // If items are provided (and allowed), replace all items with new ones
    if (updateRoutineDto.items) {
      // Delete existing items and create new ones in a transaction
      await this.prisma.$transaction([
        this.prisma.routineItem.deleteMany({ where: { routineId: id } }),
        ...updateRoutineDto.items.map((item, index) =>
          this.prisma.routineItem.create({
            data: {
              routineId: id,
              exerciseId: item.exerciseId,
              orderIndex: index,
              sets: item.sets,
              repsPerSet: item.repsPerSet,
              targetHoldSeconds: item.targetHoldSeconds,
              difficultyLevel: item.difficultyLevel ?? 1.0,
              restBetweenSets: item.restBetweenSets ?? 60,
              strictMode: item.strictMode ?? false,
              allowSkip: item.allowSkip ?? true,
            },
          }),
        ),
      ]);
    }

    // Update routine itself
    return this.prisma.routine.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: { exercise: true },
          orderBy: { orderIndex: 'asc' },
        },
        patient: true,
      },
    });
  }

  async remove(therapistId: string, id: string) {
    // Verify ownership
    const routine = await this.findOne(therapistId, id);

    // Check if routine has sessions
    const sessionCount = await this.prisma.session.count({
      where: { routineId: id },
    });

    if (sessionCount > 0) {
      // Soft delete: Archive the routine to preserve historical data
      return this.prisma.routine.update({
        where: { id },
        data: { status: 'ARCHIVED' },
      });
    }

    // Hard delete: No sessions, safe to remove completely
    return this.prisma.routine.delete({
      where: { id },
    });
  }

  async clone(therapistId: string, id: string) {
    // Fetch original routine with items
    const original = await this.findOne(therapistId, id);

    // Create a deep copy with new ID and reset stats
    return this.prisma.routine.create({
      data: {
        patientId: original.patientId,
        name: `${original.name} (Copy)`,
        startDate: new Date(), // Reset to today
        endDate: null,
        status: 'ACTIVE',
        therapistNotes: original.therapistNotes,
        items: {
          create: original.items.map((item, index) => ({
            exerciseId: item.exerciseId,
            orderIndex: index,
            sets: item.sets,
            repsPerSet: item.repsPerSet,
            targetHoldSeconds: item.targetHoldSeconds,
            difficultyLevel: item.difficultyLevel,
            restBetweenSets: item.restBetweenSets,
            strictMode: item.strictMode,
            allowSkip: item.allowSkip,
          })),
        },
      },
      include: {
        items: {
          include: { exercise: true },
          orderBy: { orderIndex: 'asc' },
        },
        patient: true,
      },
    });
  }
}
