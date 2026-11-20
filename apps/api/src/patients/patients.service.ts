import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import type {
  AccessCodeResponse,
  PaginatedResponse,
  PatientResponse,
} from '@symma/shared-types';
import { AccessCodeHasher } from '../auth/access-code-hasher.service';
import { generateAccessCode } from '../auth/access-code';
import { type PublicPatient, toPatientResponse } from './patient-response';

const MAX_ACCESS_CODE_GENERATION_ATTEMPTS = 20;

@Injectable()
export class PatientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessCodeHasher: AccessCodeHasher,
  ) {}

  async create(
    therapistId: string,
    createPatientDto: CreatePatientDto,
  ): Promise<PatientResponse> {
    const patient = await this.prisma.patient.create({
      data: {
        ...createPatientDto,
        dateOfBirth: new Date(createPatientDto.dateOfBirth),
        therapistId,
      },
    });
    return toPatientResponse(patient);
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
      data: data.map((p) => toPatientResponse(p)),
      total,
      page,
      limit,
    };
  }

  async findOne(therapistId: string, id: string): Promise<PatientResponse> {
    return toPatientResponse(await this.findOwnedPatient(therapistId, id));
  }

  async update(
    therapistId: string,
    id: string,
    updatePatientDto: UpdatePatientDto,
  ): Promise<PatientResponse> {
    await this.findOwnedPatient(therapistId, id);

    const { dateOfBirth, ...fields } = updatePatientDto;
    const patient = await this.prisma.patient.update({
      where: { id },
      data: {
        ...fields,
        ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
      },
    });
    return toPatientResponse(patient);
  }

  async remove(therapistId: string, id: string): Promise<PatientResponse> {
    await this.findOwnedPatient(therapistId, id);

    const patient = await this.prisma.patient.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
    return toPatientResponse(patient);
  }

  /** The plain PIN is returned only here, once; only its HMAC is stored. */
  async generateAccessCode(
    therapistId: string,
    patientId: string,
  ): Promise<AccessCodeResponse> {
    await this.findOwnedPatient(therapistId, patientId);

    for (
      let attempt = 0;
      attempt < MAX_ACCESS_CODE_GENERATION_ATTEMPTS;
      attempt++
    ) {
      const accessCode = generateAccessCode();
      const accessCodeHash = this.accessCodeHasher.hash(accessCode);
      const collision = await this.prisma.patient.findUnique({
        where: { accessCodeHash },
        select: { id: true },
      });

      if (!collision) {
        await this.prisma.patient.update({
          where: { id: patientId },
          data: { accessCodeHash },
        });
        return { accessCode, patientId };
      }
    }

    throw new ServiceUnavailableException(
      'errors.patients.accessCodeExhausted',
    );
  }

  async revokeAccessCode(
    therapistId: string,
    patientId: string,
  ): Promise<void> {
    await this.findOwnedPatient(therapistId, patientId);

    await this.prisma.patient.update({
      where: { id: patientId },
      data: { accessCodeHash: null },
    });
  }

  async hasAccessCode(
    therapistId: string,
    patientId: string,
  ): Promise<boolean> {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, therapistId },
      select: { accessCodeHash: true },
    });

    if (!patient) {
      throw new NotFoundException('errors.patients.notFound');
    }

    return patient.accessCodeHash !== null;
  }

  private async findOwnedPatient(
    therapistId: string,
    id: string,
  ): Promise<PublicPatient> {
    const patient = await this.prisma.patient.findFirst({
      where: { id, therapistId },
    });

    if (!patient) {
      throw new NotFoundException('errors.patients.notFound');
    }

    return patient;
  }
}
