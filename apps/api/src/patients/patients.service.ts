import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import type {
  PaginatedResponse,
  PatientResponse,
  PatientStatus,
} from '@symma/shared-types';
import * as crypto from 'crypto';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(therapistId: string, createPatientDto: CreatePatientDto) {
    return this.prisma.patient.create({
      data: {
        ...createPatientDto,
        dateOfBirth: new Date(createPatientDto.dateOfBirth),
        therapistId,
      },
    });
  }

  async findAll(
    therapistId: string,
    options: { search?: string; page?: number; limit?: number } = {},
  ): Promise<PaginatedResponse<PatientResponse>> {
    const { search, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

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

    const [data, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.patient.count({ where }),
    ]);

    return {
      data: data.map((p) => this.toPatientResponse(p)),
      total,
      page,
      limit,
    };
  }

  private toPatientResponse(patient: {
    id: string;
    therapistId: string;
    firstName: string;
    lastName: string;
    dateOfBirth: Date | null;
    gender: string | null;
    phoneNumber: string | null;
    email: string | null;
    status: string;
    diagnosis: string | null;
    initialParalysisDegree: number | null;
    clinicalNotes: string | null;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
    avatarUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): PatientResponse {
    return {
      id: patient.id,
      therapistId: patient.therapistId,
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: patient.dateOfBirth?.toISOString().split('T')[0] ?? null,
      gender: patient.gender as PatientResponse['gender'],
      phoneNumber: patient.phoneNumber,
      email: patient.email,
      status: patient.status as PatientResponse['status'],
      diagnosis: patient.diagnosis,
      initialParalysisDegree: patient.initialParalysisDegree,
      clinicalNotes: patient.clinicalNotes,
      emergencyContactName: patient.emergencyContactName,
      emergencyContactPhone: patient.emergencyContactPhone,
      avatarUrl: patient.avatarUrl,
      createdAt: patient.createdAt.toISOString(),
      updatedAt: patient.updatedAt.toISOString(),
    };
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
      data.dateOfBirth = new Date(updatePatientDto.dateOfBirth);
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
      data: { status: 'ARCHIVED' as PatientStatus },
    });
  }

  /**
   * Generate a 6-digit access PIN for patient mobile login.
   * Uses SHA-256 for deterministic lookup + Bcrypt for legacy support.
   */
  async generateAccessCode(
    therapistId: string,
    patientId: string,
  ): Promise<{ accessCode: string }> {
    // Verify ownership
    await this.findOne(therapistId, patientId);

    let accessCode = '';
    let accessCodeHash = '';
    let isUnique = false;

    // Retry loop to ensure uniqueness
    while (!isUnique) {
      accessCode = Math.floor(100000 + Math.random() * 900000).toString();
      accessCodeHash = crypto
        .createHash('sha256')
        .update(accessCode)
        .digest('hex');

      // Check for collision
      const existing = await this.prisma.patient.findUnique({
        where: { accessCodeHash },
      });

      if (!existing) {
        isUnique = true;
      }
    }

    // Hash the PIN using bcrypt (keeping for backward compat if needed, though login uses SHA-256)
    const bcrypt = await import('bcrypt');
    const saltRounds = 10;
    const authPinHash = await bcrypt.hash(accessCode, saltRounds);

    // Update patient with BOTH hashes
    await this.prisma.patient.update({
      where: { id: patientId },
      data: {
        authPinHash,
        accessCodeHash,
      },
    });

    // Return raw PIN (shown only once to therapist)
    return { accessCode };
  }

  /**
   * Revoke patient's mobile access by removing the PIN hash.
   */
  async revokeAccessCode(
    therapistId: string,
    patientId: string,
  ): Promise<void> {
    // Verify ownership
    await this.findOne(therapistId, patientId);

    // Remove BOTH access code hashes
    await this.prisma.patient.update({
      where: { id: patientId },
      data: {
        authPinHash: null,
        accessCodeHash: null,
      },
    });
  }

  /**
   * Check if patient has an active access code.
   */
  async hasAccessCode(
    therapistId: string,
    patientId: string,
  ): Promise<boolean> {
    const patient = await this.findOne(therapistId, patientId);
    return !!patient.accessCodeHash; // Check the new field
  }
}
