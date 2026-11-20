import { PrismaClient } from '@prisma/client';
import { planAccessCodeMigration } from '../src/auth/access-code-migration';

async function migrateAccessCodes(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');
  const secret = process.env.PIN_HMAC_SECRET?.trim();
  if (!secret) {
    throw new Error('PIN_HMAC_SECRET is required');
  }

  const prisma = new PrismaClient();
  try {
    const storedAccessCodes = await prisma.patient.findMany({
      where: { accessCodeHash: { not: null } },
      select: { id: true, accessCodeHash: true },
    });

    const plan = planAccessCodeMigration(
      storedAccessCodes.map(({ id, accessCodeHash }) => ({
        id,
        accessCodeHash: accessCodeHash as string,
      })),
      secret,
    );

    if (!dryRun) {
      await prisma.$transaction(
        plan.updates.map(({ id, accessCodeHash }) =>
          prisma.patient.update({ where: { id }, data: { accessCodeHash } }),
        ),
      );
    }

    console.log(
      JSON.stringify(
        {
          dryRun,
          patientsWithPin: storedAccessCodes.length,
          rehashed: plan.updates.length,
          alreadyMigrated: plan.alreadyMigratedIds.length,
          unrecognizedPatientIds: plan.unrecognizedIds,
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

migrateAccessCodes().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
