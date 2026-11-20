import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Exercise } from '@prisma/client';
import type { PaginatedResponse } from '@symma/shared-types';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';

@Injectable()
export class ExercisesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    options: { search?: string; page?: number; limit?: number } = {},
  ): Promise<PaginatedResponse<Exercise>> {
    const { search, page = 1, limit = 20 } = options;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { keyName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.exercise.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.exercise.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Exercise> {
    const exercise = await this.prisma.exercise.findUnique({ where: { id } });

    if (!exercise) {
      throw new NotFoundException('errors.exercises.notFound');
    }

    return exercise;
  }

  create(dto: CreateExerciseDto): Promise<Exercise> {
    return this.prisma.exercise.create({ data: dto });
  }

  async update(id: string, dto: UpdateExerciseDto): Promise<Exercise> {
    await this.findOne(id);
    await this.assertNotInActiveRoutine(id);

    return this.prisma.exercise.update({ where: { id }, data: dto });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.assertNotInActiveRoutine(id);

    await this.prisma.exercise.delete({ where: { id } });
  }

  /** Changing an exercise would silently alter what patients are doing today. */
  private async assertNotInActiveRoutine(exerciseId: string): Promise<void> {
    const activeRoutines = await this.prisma.routine.count({
      where: { status: 'ACTIVE', items: { some: { exerciseId } } },
    });

    if (activeRoutines > 0) {
      throw new ConflictException({
        message: 'errors.exercises.inUse',
        args: { routines: activeRoutines },
      });
    }
  }
}
