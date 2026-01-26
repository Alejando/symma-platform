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

  /**
   * Generate a 6-digit access PIN for patient mobile login.
   * The PIN is hashed before storage - the raw PIN is returned only once.
   */
  async generateAccessCode(therapistId: string, patientId: string): Promise<{ accessCode: string }> {
    // Verify ownership
    await this.findOne(therapistId, patientId);

    // Generate 6-digit PIN
    const accessCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the PIN using bcrypt
    const bcrypt = await import('bcrypt');
    const saltRounds = 10;
    const hashedCode = await bcrypt.hash(accessCode, saltRounds);

    // Update patient with hashed code
    await this.prisma.patient.update({
      where: { id: patientId },
      data: { authPinHash: hashedCode },
    });

    // Return raw PIN (shown only once to therapist)
    return { accessCode };
  }

  /**
   * Revoke patient's mobile access by removing the PIN hash.
   */
  async revokeAccessCode(therapistId: string, patientId: string): Promise<void> {
    // Verify ownership
    await this.findOne(therapistId, patientId);

    // Remove the access code hash
    await this.prisma.patient.update({
      where: { id: patientId },
      data: { authPinHash: null },
    });
  }

  /**
   * Check if patient has an active access code (without revealing it).
   */
  async hasAccessCode(therapistId: string, patientId: string): Promise<boolean> {
    const patient = await this.findOne(therapistId, patientId);
    return !!patient.authPinHash;
  }
}

