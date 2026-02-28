import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) { }

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
    const durationSeconds = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));

    // Calculate overall session score (average of item accuracies) for the Session entity
    // If no accuracy data, default to 0
    const itemsWithAccuracy = createSessionDto.items.filter(item => item.averageAccuracy !== undefined);
    const sessionScore = itemsWithAccuracy.length > 0
      ? itemsWithAccuracy.reduce((acc, item) => acc + (item.averageAccuracy || 0), 0) / itemsWithAccuracy.length
      : 0;

    return this.prisma.session.create({
      data: {
        ...(createSessionDto.id && { id: createSessionDto.id }),
        routineId: createSessionDto.routineId,
        date: start,
        durationSeconds,
        score: sessionScore, // Persistent record of overall performance
        isSynced: true, // Created directly from online app
        items: {
          create: createSessionDto.items.map(item => ({
            exerciseId: item.exerciseId,
            repsCompleted: item.repsCompleted,
            difficulty: item.difficulty || 0,
            averageAccuracy: item.averageAccuracy,
            seriesData: item.seriesData ?? null,
          }))
        }
      },
      include: { items: true },
    });
  }
}
