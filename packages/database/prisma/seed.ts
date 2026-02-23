import { PrismaClient, ExerciseType, MobileModule, RoutineStatus } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/es_MX';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Configuration
const NUM_PATIENTS = 10;
const SESSIONS_PER_ROUTINE = 14;

// Deterministic UUIDs
const SEED_IDS = {
  clinic: '00000000-0000-0000-0000-000000000001',
};

// Typed Exercise Data for Seeding
interface SeedExercise {
  keyName: string;
  name: string;
  description: string;
  type: ExerciseType;
  category: 'WARMUP' | 'CORE' | 'COOLDOWN';
  defaultConfig: { threshold?: number; holdTime?: number; restTime?: number };
  mobileModule: MobileModule;
}

const exercises: SeedExercise[] = [
  {
    keyName: 'exercise_smile_stretch',
    name: 'Estiramiento de Sonrisa',
    description: 'Tira suavemente las comisuras de la boca hacia las orejas, mantén y suelta.',
    type: 'ISOMETRIC',
    category: 'CORE',
    defaultConfig: { threshold: 0.5, holdTime: 5, restTime: 60 },
    mobileModule: 'SMILE',
  },
  {
    keyName: 'exercise_jaw_release',
    name: 'Liberación de Mandíbula',
    description: 'Abre la boca ampliamente para relajar los músculos de la mandíbula.',
    type: 'RELAXATION',
    category: 'COOLDOWN',
    defaultConfig: { threshold: 0.3, holdTime: 3, restTime: 60 },
    mobileModule: 'JAW',
  },
  {
    keyName: 'exercise_brow_raise',
    name: 'Elevación de Cejas',
    description: 'Levanta las cejas lo más alto posible, mantén y relaja.',
    type: 'ISOMETRIC',
    category: 'CORE',
    defaultConfig: { threshold: 0.6, holdTime: 5, restTime: 60 },
    mobileModule: 'BROWS',
  },
  {
    keyName: 'exercise_eye_squeeze',
    name: 'Cierre de Ojos',
    description: 'Cierra los ojos con fuerza, mantén por unos segundos, luego suelta.',
    type: 'MANUAL',
    category: 'WARMUP',
    defaultConfig: { threshold: 0.4, holdTime: 3, restTime: 60 },
    mobileModule: 'EYES',
  },
  {
    keyName: 'exercise_cheek_puff',
    name: 'Inflar Mejillas',
    description: 'Infla las mejillas con aire, mantén y suelta.',
    type: 'ISOMETRIC',
    category: 'CORE',
    defaultConfig: { threshold: 0.5, holdTime: 5, restTime: 60 },
    mobileModule: 'SMILE',
  },
  {
    keyName: 'exercise_lip_pucker',
    name: 'Fruncir Labios',
    description: 'Frunce los labios como si fueras a dar un beso.',
    type: 'ISOMETRIC',
    category: 'CORE',
    defaultConfig: { threshold: 0.55, holdTime: 5, restTime: 50 },
    mobileModule: 'KISS',
  },
];

async function main(): Promise<void> {
  console.log('🌱 Seeding database with faker data...');
  faker.seed(123);

  // 1. Clinic
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
  console.log(`✅ Clinic: ${clinic.name}`);

  // 2. Admin Therapist
  const passwordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.therapist.upsert({
    where: { email: 'admin@symma.com' },
    update: { passwordHash },
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
  console.log(`✅ Admin: ${admin.email}`);

  // 3. Exercises
  const createdExercises = [];
  for (const ex of exercises) {
    const e = await prisma.exercise.upsert({
      where: { keyName: ex.keyName },
      update: ex,
      create: ex,
    });
    createdExercises.push({ ...e, mobileModule: ex.mobileModule }); // Keep track of module
  }
  console.log(`✅ Exercises: ${createdExercises.length}`);

  // Clean old data
  console.log('🧹 Cleaning old data...');
  await prisma.session.deleteMany({});
  await prisma.routineItem.deleteMany({});
  await prisma.routine.deleteMany({});
  // Only delete random patients, keep specific test ones managed in separate functions if possible
  await prisma.patient.deleteMany({
    where: {
      NOT: {
        email: { in: ['patient@symma.com', 'eyes@symma.com', 'allmodules@symma.com'] }
      }
    }
  });

  // 4. Patients
  const patients = [];
  for (let i = 0; i < NUM_PATIENTS; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const sex = faker.person.sexType();
    const gender = sex === 'female' ? 'FEMALE' : 'MALE';

    const p = await prisma.patient.create({
      data: {
        firstName,
        lastName,
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        therapistId: admin.id,
        status: faker.helpers.arrayElement(['ACTIVE', 'INACTIVE', 'ARCHIVED']),
        dateOfBirth: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }),
        gender,
        phoneNumber: faker.phone.number({ style: 'national' }),
        diagnosis: faker.helpers.arrayElement(['Parálisis de Bell', 'Síndrome de Ramsay Hunt', 'Parálisis Facial']),
        initialParalysisDegree: faker.number.int({ min: 1, max: 6 }),
        clinicalNotes: faker.lorem.sentence(),
        emergencyContactName: faker.person.fullName(),
        emergencyContactPhone: faker.phone.number({ style: 'national' }),
      },
    });
    patients.push(p);

    // Routines for 80% of patients
    if (faker.datatype.boolean(0.8)) {
      await createRandomRoutine(p.id, createdExercises);
    }
  }
  console.log(`✅ Created ${patients.length} random patients`);

  // 5. Special RFC Scenarios
  await seedMobileRFC029(admin.id);
  await seedMobileRFC030(admin.id);
  await seedAllModulesTest(admin.id);
}

async function createRandomRoutine(patientId: string, availableExercises: (SeedExercise & { id: string })[]) {
  const startDate = faker.date.recent({ days: 30 });

  const selectedExercises = faker.helpers.arrayElements(availableExercises, { min: 2, max: 5 });

  const routine = await prisma.routine.create({
    data: {
      patientId,
      name: faker.helpers.arrayElement(['Fase 1', 'Fase 2', 'Mantenimiento', 'Recuperación']),
      startDate,
      status: 'ACTIVE',
      items: {
        create: selectedExercises.map((ex, idx) => ({
          exerciseId: ex.id,
          orderIndex: idx,
          // RFC-030 Fields
          sets: faker.number.int({ min: 1, max: 3 }),
          repsPerSet: faker.helpers.arrayElement([8, 10, 12, 15]),
          targetHoldSeconds: ex.defaultConfig.holdTime || 5,
          restBetweenSets: ex.defaultConfig.restTime || 60,
          difficultyLevel: faker.number.float({ min: 0.5, max: 1.5, fractionDigits: 1 }),
          strictMode: faker.datatype.boolean(),
          allowSkip: faker.datatype.boolean(),

        })),
      },
    },
  });

  // Sessions
  if (faker.datatype.boolean(0.7)) {
    const numSessions = faker.number.int({ min: 1, max: 10 });
    const sessionsData = [];
    for (let i = 0; i < numSessions; i++) {
      sessionsData.push({
        routineId: routine.id,
        date: faker.date.recent({ days: 20, refDate: new Date() }),
        durationSeconds: faker.number.int({ min: 300, max: 1200 }),
        score: faker.number.float({ min: 0.1, max: 0.9, fractionDigits: 2 }),
        isSynced: true
      });
    }
    await prisma.session.createMany({ data: sessionsData });
  }

  return routine;
}

async function seedMobileRFC029(therapistId: string) {
  console.log('📱 Seeding RFC-029 (Calibration)...');
  const PATIENT_ID = 'rfc-029-patient-test-id';
  const accessCodeHash = await bcrypt.hash('123456', 10);

  const patient = await prisma.patient.upsert({
    where: { id: PATIENT_ID },
    update: { accessCodeHash },
    create: {
      id: PATIENT_ID,
      email: 'patient@symma.com',
      firstName: 'Test',
      lastName: 'Patient',
      therapistId,
      status: 'ACTIVE',
      accessCodeHash,
      diagnosis: 'RFC-029 Test',
    }
  });

  // Ensure exercises exist for RFC-029 (using upsert in loop)
  const exercises = [
    { id: 'smile_teeth', variable: 'SMILE', name: 'Smile Teeth' },
    { id: 'brows_up', variable: 'BROWS', name: 'Brows Up' },
    { id: 'jaw_open', variable: 'JAW', name: 'Jaw Open' },
    { id: 'kiss', variable: 'KISS', name: 'Kiss' },
    { id: 'blink', variable: 'EYES', name: 'Blink' },
  ];

  for (const ex of exercises) {
    await prisma.exercise.upsert({
      where: { id: ex.id },
      create: {
        id: ex.id,
        keyName: ex.id + '_rfc029',
        name: ex.name,
        description: 'Automatic Exercise',
        type: 'ISOMETRIC',
        category: 'CORE',
        mobileModule: ex.variable as MobileModule
      },
      update: {}
    });
  }

  // Clear old routine
  await prisma.routine.deleteMany({ where: { patientId: PATIENT_ID } });

  await prisma.routine.create({
    data: {
      patientId: PATIENT_ID,
      name: 'Full Calibration Protocol',
      startDate: new Date(),
      status: 'ACTIVE',
      items: {
        create: exercises.map((ex, i) => ({
          exerciseId: ex.id,
          orderIndex: i,
          sets: 3,
          repsPerSet: 10,
          targetHoldSeconds: 5,
          restBetweenSets: 30,
          difficultyLevel: 1.0,
          strictMode: false,
          allowSkip: true,

        }))
      }
    }
  });
  console.log('  ✅ RFC-029 Data Ready');
}

async function seedMobileRFC030(therapistId: string) {
  console.log('👁️ Seeding RFC-030 (Eyes Split)...');
  const PATIENT_ID = 'rfc-030-patient-eyes';
  const accessCodeHash = await bcrypt.hash('123456', 10);

  const patient = await prisma.patient.upsert({
    where: { id: PATIENT_ID },
    update: { accessCodeHash },
    create: {
      id: PATIENT_ID,
      email: 'eyes@symma.com',
      firstName: 'Eye',
      lastName: 'Therapy',
      therapistId,
      status: 'ACTIVE',
      accessCodeHash,
      diagnosis: 'Eye Ptosis',
    }
  });

  // Create special exercises
  const eyeExercises = [
    { id: 'close_eyes_rfc030', module: 'EYES', name: 'Close Eyes Force' },
    { id: 'open_eyes_rfc030', module: 'EYES_INVERSE', name: 'Open Eyes Surprise' }
  ];

  for (const ex of eyeExercises) {
    await prisma.exercise.upsert({
      where: { id: ex.id },
      create: {
        id: ex.id,
        keyName: ex.id,
        name: ex.name,
        description: 'Eye specialized exercise',
        type: 'ISOMETRIC',
        category: 'CORE',
        mobileModule: ex.module as MobileModule
      },
      update: {}
    });
  }

  await prisma.routine.deleteMany({ where: { patientId: PATIENT_ID } });

  await prisma.routine.create({
    data: {
      patientId: PATIENT_ID,
      name: 'Eye Therapy Protocol',
      startDate: new Date(),
      status: 'ACTIVE',
      items: {
        create: [
          {
            exerciseId: 'close_eyes_rfc030',
            orderIndex: 0,
            sets: 2, repsPerSet: 5, targetHoldSeconds: 3, restBetweenSets: 10, difficultyLevel: 1.0, strictMode: true, allowSkip: false
          },
          {
            exerciseId: 'open_eyes_rfc030',
            orderIndex: 1,
            sets: 2, repsPerSet: 10, targetHoldSeconds: 0, restBetweenSets: 10, difficultyLevel: 1.0, strictMode: false, allowSkip: true
          }
        ]
      }
    }
  });
  console.log('  ✅ RFC-030 Data Ready');
}

/**
 * Seeds a test patient with ALL mobile modules for comprehensive testing.
 * Patient: allmodules@symma.com | Code: 123456
 */
async function seedAllModulesTest(therapistId: string) {
  console.log('🧪 Seeding All Modules Test Patient...');
  const PATIENT_ID = 'all-modules-test-patient';
  const accessCodeHash = await bcrypt.hash('123456', 10);

  await prisma.patient.upsert({
    where: { id: PATIENT_ID },
    update: { accessCodeHash },
    create: {
      id: PATIENT_ID,
      email: 'allmodules@symma.com',
      firstName: 'All',
      lastName: 'Modules',
      therapistId,
      status: 'ACTIVE',
      accessCodeHash,
      diagnosis: 'All Modules Test',
    }
  });

  // Create one exercise per mobile module
  const allModuleExercises = [
    { id: 'test_smile', keyName: 'test_smile', name: 'Sonrisa Amplia', description: 'Sonríe ampliamente mostrando los dientes', module: 'SMILE' as MobileModule, type: 'ISOMETRIC' as ExerciseType, holdSeconds: 3 },
    { id: 'test_brows', keyName: 'test_brows', name: 'Elevar Cejas', description: 'Levanta las cejas lo más alto posible', module: 'BROWS' as MobileModule, type: 'ISOMETRIC' as ExerciseType, holdSeconds: 3 },
    { id: 'test_jaw', keyName: 'test_jaw', name: 'Abrir Boca', description: 'Abre la boca ampliamente', module: 'JAW' as MobileModule, type: 'ISOMETRIC' as ExerciseType, holdSeconds: 3 },
    { id: 'test_kiss', keyName: 'test_kiss', name: 'Beso', description: 'Frunce los labios como para dar un beso', module: 'KISS' as MobileModule, type: 'ISOMETRIC' as ExerciseType, holdSeconds: 3 },
    { id: 'test_eyes_close', keyName: 'test_eyes_close', name: 'Cerrar Ojos', description: 'Cierra los ojos con fuerza', module: 'EYES' as MobileModule, type: 'ISOMETRIC' as ExerciseType, holdSeconds: 3 },
    { id: 'test_eyes_open', keyName: 'test_eyes_open', name: 'Abrir Ojos', description: 'Abre los ojos lo más amplio posible', module: 'EYES_INVERSE' as MobileModule, type: 'ISOTONIC' as ExerciseType, holdSeconds: 0 },
  ];

  // Upsert exercises
  for (const ex of allModuleExercises) {
    await prisma.exercise.upsert({
      where: { id: ex.id },
      create: {
        id: ex.id,
        keyName: ex.keyName,
        name: ex.name,
        description: ex.description,
        type: ex.type,
        category: 'CORE',
        mobileModule: ex.module,
      },
      update: {
        name: ex.name,
        description: ex.description,
        mobileModule: ex.module,
      }
    });
  }

  // Clear old routine for this patient
  await prisma.routine.deleteMany({ where: { patientId: PATIENT_ID } });

  // Create routine with all exercises
  await prisma.routine.create({
    data: {
      patientId: PATIENT_ID,
      name: 'All Modules Test',
      startDate: new Date(),
      status: 'ACTIVE',
      items: {
        create: allModuleExercises.map((ex, i) => ({
          exerciseId: ex.id,
          orderIndex: i,
          sets: 2,
          repsPerSet: 5,
          targetHoldSeconds: ex.holdSeconds,
          restBetweenSets: 5,
          difficultyLevel: 1.0,
          strictMode: false,
          allowSkip: true,
        }))
      }
    }
  });

  console.log('  ✅ All Modules Test Patient Ready');
  console.log('     📧 Email: allmodules@symma.com');
  console.log('     🔑 Code: 123456');
  console.log('     📋 Exercises: SMILE, BROWS, JAW, KISS, EYES, EYES_INVERSE');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
