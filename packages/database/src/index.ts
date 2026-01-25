// Re-export Prisma Client from the database package
export * from '@prisma/client';

import { PrismaClient } from '@prisma/client';

// Global Prisma client instance for development (prevents multiple instances)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
