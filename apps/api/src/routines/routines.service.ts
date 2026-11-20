import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { PaginatedResponse } from '@symma/shared-types';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateRoutineDto,
  CreateRoutineItemDto,
} from './dto/create-routine.dto';
import { UpdateRoutineDto } from './dto/update-routine.dto';
import {
  type PublicPatient,
  toPatientResponse,
} from '../patients/patient-response';

const DEFAULT_REST_BETWEEN_SETS_SECONDS = 60;

const routineDetailInclude = {
  items: {
    include: { exercise: true },
    orderBy: { orderIndex: 'asc' },
  },
  patient: true,
} satisfies Prisma.RoutineInclude;

type TransactionClient = Prisma.TransactionClient;

@Injectable()
export class RoutinesService {
  constructor(private readonly prisma: PrismaService) {}

  /** A newly created routine becomes the patient's only ACTIVE routine. */
  async create(therapistId: string, dto: CreateRoutineDto) {
    assertStartBeforeEnd(dto.startDate, dto.endDate);
    await this.assertPatientOwnedBy(therapistId, dto.patientId);

    const routine = await this.prisma.$transaction(async (tx) => {
      await archiveActiveRoutines(tx, dto.patientId);
      return tx.routine.create({
        data: {
          patientId: dto.patientId,
          name: dto.name,
          startDate: new Date(dto.startDate),
          endDate: dto.endDate ? new Date(dto.endDate) : null,
          status: 'ACTIVE',
          therapistNotes: dto.therapistNotes,
          items: { create: dto.items.map(toRoutineItemInput) },
        },
        include: routineDetailInclude,
      });
    });
    return withPatientResponse(routine);
  }

  async findAll(
    therapistId: string,
    options: { page?: number; limit?: number } = {},
  ): Promise<PaginatedResponse<unknown>> {
    const { page = 1, limit = 20 } = options;
    const where = { patient: { therapistId } };

    const [data, total] = await Promise.all([
      this.prisma.routine.findMany({
        where,
        include: {
          patient: { select: { firstName: true, lastName: true } },
          items: {
            include: { exercise: true },
            orderBy: { orderIndex: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.routine.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findAllByPatient(therapistId: string, patientId: string) {
    await this.assertPatientOwnedBy(therapistId, patientId);

    return this.prisma.routine.findMany({
      where: { patientId },
      include: {
        items: { include: { exercise: true }, orderBy: { orderIndex: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(therapistId: string, id: string) {
    const routine = await this.prisma.routine.findFirst({
      where: { id, patient: { therapistId } },
      include: {
        ...routineDetailInclude,
        _count: { select: { sessions: true } },
      },
    });

    if (!routine) {
      throw new NotFoundException('errors.routines.notFound');
    }

    const { _count, ...rest } = routine;
    return { ...withPatientResponse(rest), sessionsCount: _count.sessions };
  }

  async update(therapistId: string, id: string, dto: UpdateRoutineDto) {
    const routine = await this.findOne(therapistId, id);

    if (dto.items && routine.sessionsCount > 0) {
      throw new ConflictException('errors.routines.itemsLocked');
    }

    assertStartBeforeEnd(
      dto.startDate ?? routine.startDate.toISOString(),
      dto.endDate ?? routine.endDate?.toISOString(),
    );

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.items) {
        await tx.routineItem.deleteMany({ where: { routineId: id } });
        await tx.routineItem.createMany({
          data: dto.items.map((item, index) => ({
            ...toRoutineItemInput(item, index),
            routineId: id,
          })),
        });
      }

      return tx.routine.update({
        where: { id },
        data: {
          name: dto.name,
          startDate: dto.startDate ? new Date(dto.startDate) : undefined,
          endDate: dto.endDate ? new Date(dto.endDate) : undefined,
          therapistNotes: dto.therapistNotes,
        },
        include: routineDetailInclude,
      });
    });
    return withPatientResponse(updated);
  }

  /** Routines with recorded sessions are archived to preserve clinical history. */
  async remove(therapistId: string, id: string): Promise<void> {
    const routine = await this.findOne(therapistId, id);

    if (routine.sessionsCount > 0) {
      await this.prisma.routine.update({
        where: { id },
        data: { status: 'ARCHIVED' },
      });
      return;
    }

    await this.prisma.routine.delete({ where: { id } });
  }

  /** The copy stays DRAFT, so the patient keeps the original until it is activated. */
  async clone(therapistId: string, id: string) {
    const original = await this.findOne(therapistId, id);

    const copy = await this.prisma.routine.create({
      data: {
        patientId: original.patientId,
        name: `${original.name} (Copy)`,
        startDate: new Date(),
        endDate: null,
        status: 'DRAFT',
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
      include: routineDetailInclude,
    });
    return withPatientResponse(copy);
  }

  async activate(therapistId: string, id: string) {
    const routine = await this.findOne(therapistId, id);

    if (routine.status === 'ACTIVE') {
      return routine;
    }

    const activated = await this.prisma.$transaction(async (tx) => {
      await archiveActiveRoutines(tx, routine.patientId);
      return tx.routine.update({
        where: { id },
        data: { status: 'ACTIVE' },
        include: routineDetailInclude,
      });
    });
    return withPatientResponse(activated);
  }

  private async assertPatientOwnedBy(
    therapistId: string,
    patientId: string,
  ): Promise<void> {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, therapistId },
      select: { id: true },
    });

    if (!patient) {
      throw new NotFoundException('errors.patients.notFound');
    }
  }
}

function withPatientResponse<T extends { patient: PublicPatient }>(routine: T) {
  return { ...routine, patient: toPatientResponse(routine.patient) };
}

function archiveActiveRoutines(tx: TransactionClient, patientId: string) {
  return tx.routine.updateMany({
    where: { patientId, status: 'ACTIVE' },
    data: { status: 'ARCHIVED' },
  });
}

function assertStartBeforeEnd(startDate: string, endDate?: string): void {
  if (endDate && new Date(startDate) >= new Date(endDate)) {
    throw new BadRequestException('errors.routines.invalidDateRange');
  }
}

function toRoutineItemInput(
  item: CreateRoutineItemDto,
  orderIndex: number,
): Prisma.RoutineItemUncheckedCreateWithoutRoutineInput {
  return {
    exerciseId: item.exerciseId,
    orderIndex,
    sets: item.sets,
    repsPerSet: item.repsPerSet,
    targetHoldSeconds: item.targetHoldSeconds,
    difficultyLevel: item.difficultyLevel ?? 1.0,
    restBetweenSets: item.restBetweenSets ?? DEFAULT_REST_BETWEEN_SETS_SECONDS,
    strictMode: item.strictMode ?? false,
    allowSkip: item.allowSkip ?? true,
  };
}
