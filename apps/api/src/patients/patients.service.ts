import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto, PatientStatus } from './dto/update-patient.dto';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(therapistId: string, createPatientDto: CreatePatientDto) {
    return this.prisma.patient.create({
      data: {
        ...createPatientDto,
        dateOfBirth: new Date(createPatientDto.dateOfBirth),
        therapistId,
      },
    });
  }

  async findAll(therapistId: string, search?: string) {
    const where = {
      therapistId,
      status: { not: 'ARCHIVED' as const },
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' as const } },
          { lastName: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    return this.prisma.patient.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(therapistId: string, id: string) {
    const patient = await this.prisma.patient.findFirst({
      where: {
        id,
        therapistId,
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return patient;
  }

  async update(
    therapistId: string,
    id: string,
    updatePatientDto: UpdatePatientDto,
  ) {
    // First verify ownership
    await this.findOne(therapistId, id);

    // Handle date conversion if present
    const data: Record<string, unknown> = { ...updatePatientDto };
    if ('dateOfBirth' in updatePatientDto && updatePatientDto.dateOfBirth) {
      data.dateOfBirth = new Date(updatePatientDto.dateOfBirth as string);
    }

    return this.prisma.patient.update({
      where: { id },
      data,
    });
  }

  async remove(therapistId: string, id: string) {
    // First verify ownership
    await this.findOne(therapistId, id);

    // Soft delete - set status to ARCHIVED
    return this.prisma.patient.update({
      where: { id },
      data: { status: PatientStatus.ARCHIVED },
    });
  }
}
