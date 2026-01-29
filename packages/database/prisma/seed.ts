import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/es_MX';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Configuration
const NUM_PATIENTS = 10;
const SESSIONS_PER_ROUTINE = 14; // 2 weeks of sessions

// Deterministic UUIDs for seed data (allows idempotent upsert for core entities)
const SEED_IDS = {
  clinic: '00000000-0000-0000-0000-000000000001',
};

async function main(): Promise<void> {
  console.log('🌱 Seeding database with faker data...');

  // Set seed for reproducible data
  faker.seed(123);

  // Create default clinic
  const clinic = await prisma.clinic.upsert({
    where: { id: SEED_IDS.clinic },
    update: {},
    create: {
      id: SEED_IDS.clinic,
      name: 'Clínica de Rehabilitación Facial Symma',
      address: faker.location.streetAddress({ useFullAddress: true }),
      contactPhone: faker.phone.number({ style: 'national' }),
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
      name: 'Estiramiento de Sonrisa',
      description: 'Tira suavemente las comisuras de la boca hacia las orejas, mantén y suelta. Enfócate en la relajación.',
      type: 'AR_TRACKING' as const,
      category: 'CORE' as const,
      defaultConfig: { threshold: 0.5, holdTime: 5, restTime: 60 },
    },
    {
      keyName: 'exercise_jaw_release',
      name: 'Liberación de Mandíbula',
      description: 'Abre la boca ampliamente para relajar los músculos de la mandíbula, luego cierra lentamente. Repite varias veces.',
      type: 'RELAXATION' as const,
      category: 'COOLDOWN' as const,
      defaultConfig: { threshold: 0.3, holdTime: 3, restTime: 60 },
    },
    {
      keyName: 'exercise_brow_raise',
      name: 'Elevación de Cejas',
      description: 'Levanta las cejas lo más alto posible, mantén y relaja. Enfócate en la simetría.',
      type: 'AR_TRACKING' as const,
      category: 'CORE' as const,
      defaultConfig: { threshold: 0.6, holdTime: 5, restTime: 60 },
    },
    {
      keyName: 'exercise_eye_squeeze',
      name: 'Cierre de Ojos',
      description: 'Cierra los ojos con fuerza, mantén por unos segundos, luego suelta. Ayuda a fortalecer los músculos del párpado.',
      type: 'MANUAL' as const,
      category: 'WARMUP' as const,
      defaultConfig: { threshold: 0.4, holdTime: 3, restTime: 60 },
    },
    {
      keyName: 'exercise_cheek_puff',
      name: 'Inflar Mejillas',
      description: 'Infla las mejillas con aire, mantén la posición y luego suelta lentamente. Fortalece los músculos buccinador.',
      type: 'AR_TRACKING' as const,
      category: 'CORE' as const,
      defaultConfig: { threshold: 0.5, holdTime: 4, restTime: 45 },
    },
    {
      keyName: 'exercise_lip_pucker',
      name: 'Fruncir Labios',
      description: 'Frunce los labios como si fueras a dar un beso, mantén y relaja. Trabaja los músculos orbiculares.',
      type: 'AR_TRACKING' as const,
      category: 'CORE' as const,
      defaultConfig: { threshold: 0.55, holdTime: 5, restTime: 50 },
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

  // Clean up old test data before creating new patients
  console.log('🧹 Cleaning up old seed data...');
  await prisma.session.deleteMany({});
  await prisma.routineItem.deleteMany({});
  await prisma.routine.deleteMany({});
  await prisma.patient.deleteMany({});

  // Create multiple realistic patients
  const diagnoses = [
    'Parálisis Facial - Lado Izquierdo',
    'Parálisis Facial - Lado Derecho',
    'Parálisis de Bell',
    'Síndrome de Ramsay Hunt',
    'Parálisis Facial Bilateral',
    'Parálisis Facial Post-Quirúrgica',
  ];

  const routineNames = [
    'Fase 1 - Recuperación Inicial',
    'Fase 2 - Fortalecimiento',
    'Fase 3 - Coordinación',
    'Rehabilitación Facial Intensiva',
    'Protocolo de Mantenimiento',
  ];

  const createdPatients = [];

  for (let i = 0; i < NUM_PATIENTS; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const gender = faker.helpers.arrayElement(['MALE', 'FEMALE'] as const);

    const patient = await prisma.patient.create({
      data: {
        firstName,
        lastName,
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        therapistId: admin.id,
        status: faker.helpers.weightedArrayElement([
          { value: 'ACTIVE' as const, weight: 8 },
          { value: 'INACTIVE' as const, weight: 1 },
          { value: 'ARCHIVED' as const, weight: 1 },
        ]),
        dateOfBirth: faker.date.birthdate({ min: 25, max: 75, mode: 'age' }),
        gender,
        phoneNumber: faker.phone.number({ style: 'national' }),
        diagnosis: faker.helpers.arrayElement(diagnoses),
        initialParalysisDegree: faker.number.int({ min: 2, max: 6 }),
        clinicalNotes: faker.helpers.maybe(() => faker.lorem.paragraph(), { probability: 0.6 }),
        emergencyContactName: faker.person.fullName(),
        emergencyContactPhone: faker.phone.number({ style: 'national' }),
      },
    });

    createdPatients.push(patient);
    console.log(`✅ Patient created: ${patient.firstName} ${patient.lastName}`);

    // Create routine for this patient (80% chance)
    if (faker.datatype.boolean({ probability: 0.8 })) {
      const routine = await createPatientRoutine(
        patient.id,
        createdExercises,
        routineNames
      );

      // Create sessions for this routine (varies by patient)
      const numSessions = faker.number.int({ min: 5, max: SESSIONS_PER_ROUTINE });
      await seedPatientSessions(routine.id, numSessions);
    }
  }

  console.log(`🎉 Seeding completed! Created ${createdPatients.length} patients`);
}

async function createPatientRoutine(
  patientId: string,
  exercises: { id: string }[],
  routineNames: string[]
) {
  const startDate = faker.date.recent({ days: 30 });
  const hasEndDate = faker.datatype.boolean({ probability: 0.3 });

  const routine = await prisma.routine.create({
    data: {
      patientId,
      name: faker.helpers.arrayElement(routineNames),
      startDate,
      endDate: hasEndDate
        ? faker.date.soon({ days: 60, refDate: startDate })
        : null,
      status: faker.helpers.weightedArrayElement([
        { value: 'ACTIVE' as const, weight: 9 },
        { value: 'ARCHIVED' as const, weight: 1 },
      ]),
      therapistNotes: faker.helpers.maybe(
        () => faker.lorem.sentences({ min: 1, max: 3 }),
        { probability: 0.5 }
      ),
      items: {
        create: faker.helpers
          .arrayElements(exercises, { min: 2, max: 4 })
          .map((exercise, index) => ({
            exerciseId: exercise.id,
            orderIndex: index,
            targetRepetitions: faker.helpers.arrayElement([8, 10, 12, 15]),
            targetSets: faker.helpers.arrayElement([2, 3, 4]),
            holdTimeSeconds: faker.helpers.arrayElement([3, 5, 7, 10]),
            restBetweenSetsSeconds: faker.helpers.arrayElement([30, 45, 60, 90]),
          })),
      },
    },
  });

  console.log(`  ↳ Routine created: ${routine.name}`);
  return routine;
}

async function seedPatientSessions(routineId: string, numSessions: number) {
  const sessions = [];
  const today = new Date();

  for (let i = 0; i < numSessions; i++) {
    const daysAgo = numSessions - 1 - i;
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);

    // Progress simulation: scores improve over time
    let minScore = 0.3;
    let maxScore = 0.5;

    const progress = i / numSessions;
    if (progress > 0.7) {
      minScore = 0.7;
      maxScore = 0.9;
    } else if (progress > 0.4) {
      minScore = 0.5;
      maxScore = 0.7;
    }

    const score = faker.number.float({ min: minScore, max: maxScore, fractionDigits: 2 });

    sessions.push({
      routineId,
      date,
      durationSeconds: faker.number.int({ min: 300, max: 900 }), // 5-15 mins
      score,
      isSynced: true,
    });
  }

  await prisma.session.createMany({
    data: sessions,
  });

  console.log(`    ↳ Created ${sessions.length} sessions`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
