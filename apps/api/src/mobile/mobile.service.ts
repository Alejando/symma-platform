import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MobileService {
  constructor(private readonly prisma: PrismaService) { }

  async getActiveRoutine(patientId: string) {
    // Fetch the active routine with ALL implementation details
    return this.prisma.routine.findFirst({
      where: {
        patientId,
        status: 'ACTIVE',
      },
      orderBy: { startDate: 'desc' }, // Latest one
      include: {
        items: {
          orderBy: { orderIndex: 'asc' },
          include: {
            exercise: true // Include full exercise details (animation, video, config)
          }
        }
      }
    });
  }
}
