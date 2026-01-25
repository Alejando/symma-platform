import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Seeding database...');

  // Create default clinic
  const clinic = await prisma.clinic.upsert({
    where: { id: 'default-clinic-id' },
    update: {},
    create: {
      id: 'default-clinic-id',
      name: 'Symma Default Clinic',
      address: 'Virtual Clinic',
      contactPhone: '+52 55 1234 5678',
    },
  });

  console.log(`✅ Clinic created: ${clinic.name}`);

  // Hash admin password
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash('admin123', saltRounds);

  // Create admin user
  const admin = await prisma.therapist.upsert({
    where: { email: 'admin@symma.com' },
    update: {
      passwordHash,
    },
    create: {
      email: 'admin@symma.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'Symma',
      role: 'ADMIN',
      isActive: true,
      clinicId: clinic.id,
    },
  });

  console.log(`✅ Admin user created: ${admin.email}`);
  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
