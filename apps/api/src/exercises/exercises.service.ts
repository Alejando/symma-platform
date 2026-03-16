import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { PaginatedResponse } from '@symma/shared-types';

@Injectable()
export class ExercisesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    options: { search?: string; page?: number; limit?: number } = {},
  ): Promise<PaginatedResponse<unknown>> {
    const { search, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

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
        skip,
        take: limit,
      }),
      this.prisma.exercise.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string) {
    return this.prisma.exercise.findUnique({
      where: { id },
    });
  }

  async create(data: any) {
    return this.prisma.exercise.create({
      data,
    });
  }

  async update(id: string, data: any) {
    return this.prisma.exercise.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.exercise.delete({
      where: { id },
    });
  }
}
