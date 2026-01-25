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

  // Create exercise catalog
  const exercises = [
    {
      keyName: 'exercise_smile_stretch',
      name: 'Smile Stretch',
      description: 'Gently pull the corners of the mouth towards the ears, hold, and release. Focus on relaxation.',
      type: 'AR_TRACKING' as const,
      category: 'CORE' as const,
      defaultConfig: { threshold: 0.5, holdTime: 5 },
    },
    {
      keyName: 'exercise_jaw_release',
      name: 'Jaw Release',
      description: 'Open the mouth wide to relax the jaw muscles, then slowly close. Repeat several times.',
      type: 'RELAXATION' as const,
      category: 'COOLDOWN' as const,
      defaultConfig: { threshold: 0.3, holdTime: 3 },
    },
    {
      keyName: 'exercise_brow_raise',
      name: 'Brow Raise',
      description: 'Raise the eyebrows as high as possible, hold, and relax. Focus on symmetry.',
      type: 'AR_TRACKING' as const,
      category: 'CORE' as const,
      defaultConfig: { threshold: 0.6, holdTime: 5 },
    },
    {
      keyName: 'exercise_eye_squeeze',
      name: 'Eye Squeeze',
      description: 'Close the eyes tightly, hold for a few seconds, then release. Helps strengthen eyelid muscles.',
      type: 'MANUAL' as const,
      category: 'WARMUP' as const,
      defaultConfig: { threshold: 0.4, holdTime: 3 },
    },
  ];

  for (const exercise of exercises) {
    await prisma.exercise.upsert({
      where: { keyName: exercise.keyName },
      update: exercise,
      create: exercise,
    });
  }

  console.log(`✅ Exercise catalog created: ${exercises.length} exercises`);
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
