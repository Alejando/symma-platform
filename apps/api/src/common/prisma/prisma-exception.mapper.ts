import {
  ConflictException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  PRISMA_FOREIGN_KEY_VIOLATION,
  PRISMA_RECORD_NOT_FOUND,
  PRISMA_UNIQUE_VIOLATION,
} from './prisma-errors';

export function httpExceptionForPrismaError(
  error: unknown,
): HttpException | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return null;
  }

  switch (error.code) {
    case PRISMA_UNIQUE_VIOLATION:
      return new ConflictException('errors.database.uniqueConstraint');
    case PRISMA_FOREIGN_KEY_VIOLATION:
      return new ConflictException('errors.database.foreignKeyConstraint');
    case PRISMA_RECORD_NOT_FOUND:
      return new NotFoundException('errors.server.notFound');
    default:
      return null;
  }
}
