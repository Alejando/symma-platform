import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExercisesService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll() {
    return this.prisma.exercise.findMany({
      orderBy: { name: 'asc' },
    });
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
