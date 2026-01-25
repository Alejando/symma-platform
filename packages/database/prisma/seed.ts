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
      defaultConfig: { threshold: 0.5, holdTime: 5, restTime: 60 },
    },
    {
      keyName: 'exercise_jaw_release',
      name: 'Jaw Release',
      description: 'Open the mouth wide to relax the jaw muscles, then slowly close. Repeat several times.',
      type: 'RELAXATION' as const,
      category: 'COOLDOWN' as const,
      defaultConfig: { threshold: 0.3, holdTime: 3, restTime: 60 },
    },
    {
      keyName: 'exercise_brow_raise',
      name: 'Brow Raise',
      description: 'Raise the eyebrows as high as possible, hold, and relax. Focus on symmetry.',
      type: 'AR_TRACKING' as const,
      category: 'CORE' as const,
      defaultConfig: { threshold: 0.6, holdTime: 5, restTime: 60 },
    },
    {
      keyName: 'exercise_eye_squeeze',
      name: 'Eye Squeeze',
      description: 'Close the eyes tightly, hold for a few seconds, then release. Helps strengthen eyelid muscles.',
      type: 'MANUAL' as const,
      category: 'WARMUP' as const,
      defaultConfig: { threshold: 0.4, holdTime: 3, restTime: 60 },
    },
  ];

  const createdExercises = [];
  for (const exercise of exercises) {
    const e = await prisma.exercise.upsert({
      where: { keyName: exercise.keyName },
      update: exercise,
      create: exercise,
    });
    createdExercises.push(e);
  }

  console.log(`✅ Exercise catalog created: ${exercises.length} exercises`);

  // Create Test Patient
  const patient = await prisma.patient.upsert({
    where: { id: 'test-patient-id' },
    update: {},
    create: {
      id: 'test-patient-id',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      therapistId: admin.id,
      status: 'ACTIVE',
      dateOfBirth: new Date('1985-01-01'),
      gender: 'MALE',
      diagnosis: 'Facial Palsy - Left Side',
      initialParalysisDegree: 4,
    },
  });
  console.log(`✅ Patient created: ${patient.firstName} ${patient.lastName}`);

  // Create Test Routine
  const routine = await prisma.routine.upsert({
    where: { id: 'test-routine-id' },
    update: {},
    create: {
      id: 'test-routine-id',
      patientId: patient.id,
      name: 'Facial Recovery Phase 1',
      startDate: new Date(),
      isActive: true,
      therapistNotes: 'Focus on slow movements.',
      items: {
        create: [
          {
            exerciseId: createdExercises[0].id, // Smile Stretch
            orderIndex: 0,
            targetRepetitions: 10,
            targetSets: 3,
            holdTimeSeconds: 5,
            restBetweenSetsSeconds: 60,
          },
          {
            exerciseId: createdExercises[2].id, // Brow Raise
            orderIndex: 1,
            targetRepetitions: 10,
            targetSets: 3,
            holdTimeSeconds: 5,
            restBetweenSetsSeconds: 60,
          },
        ],
      },
    },
  });
  console.log(`✅ Routine created: ${routine.name}`);

  // Seed Sessions (Idempotent check inside or delete previous?)
  // Let's delete previous sessions for this routine to avoid duplicates if run multiple times
  await prisma.session.deleteMany({ where: { routineId: routine.id } });
  await seedPatientSessions(routine.id);

  console.log('🎉 Seeding completed!');
}

async function seedPatientSessions(routineId: string) {
  console.log('🌱 Seeding sessions...');
  const sessions = [];
  const today = new Date();

  for (let i = 0; i < 14; i++) {
    const daysAgo = 13 - i; // 13, 12... 0
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);

    let minScore = 0.3;
    let maxScore = 0.5;

    if (daysAgo < 4) { // 3, 2, 1, 0 (Last 4 days) -> High score
      minScore = 0.7;
      maxScore = 0.9;
    } else if (daysAgo < 9) { // 8, 7, 6, 5, 4 -> Mid score
      minScore = 0.5;
      maxScore = 0.7;
    }
    // Else (13, 12, 11, 10, 9) -> Low score (default)

    const score = Math.random() * (maxScore - minScore) + minScore;

    sessions.push({
      routineId,
      date,
      durationSeconds: Math.floor(Math.random() * (600 - 300) + 300), // 5-10 mins
      score: parseFloat(score.toFixed(2)),
      isSynced: true,
    });
  }

  await prisma.session.createMany({
    data: sessions,
  });
  console.log(`✅ Created ${sessions.length} sessions for routine ${routineId}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
