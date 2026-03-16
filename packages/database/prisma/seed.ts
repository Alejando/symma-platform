import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Seeding database...');

  // ─── 1. CLEANUP ───────────────────────────────────────────────────────────
  await prisma.sessionItem.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.routineItem.deleteMany({});
  await prisma.routine.deleteMany({});
  await prisma.patient.deleteMany({});
  await prisma.therapist.deleteMany({});
  await prisma.exercise.deleteMany({});
  await prisma.clinic.deleteMany({});
  console.log('🧹 Old data deleted');

  // ─── 2. CLINIC ────────────────────────────────────────────────────────────
  const clinic = await prisma.clinic.create({
    data: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Clínica de Rehabilitación Facial Symma',
    },
  });
  console.log(`✅ Clinic: ${clinic.name}`);

  // ─── 3. THERAPISTS ────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin123!', 10);
  const therapistHash = await bcrypt.hash('Therapist123!', 10);

  const admin = await prisma.therapist.create({
    data: {
      clinicId: clinic.id,
      email: 'admin@symma.com',
      passwordHash: adminHash,
      firstName: 'Alejandra',
      lastName: 'Morales',
      role: 'ADMIN',
      isActive: true,
    },
  });

  const therapist = await prisma.therapist.create({
    data: {
      clinicId: clinic.id,
      email: 'dra.garcia@symma.com',
      passwordHash: therapistHash,
      firstName: 'Sofía',
      lastName: 'García',
      role: 'THERAPIST',
      isActive: true,
    },
  });
  console.log(`✅ Therapists: ${admin.email}, ${therapist.email}`);

  // ─── 4. EXERCISES ─────────────────────────────────────────────────────────
  const exSmile = await prisma.exercise.create({
    data: {
      keyName: 'smile_hold',
      name: 'Sonrisa Sostenida',
      description: 'Sonríe ampliamente mostrando los dientes y mantén la posición 3 segundos.',
      type: 'ISOMETRIC',
      category: 'CORE',
      mobileModule: 'SMILE',
    },
  });

  const exBrows = await prisma.exercise.create({
    data: {
      keyName: 'brow_raise',
      name: 'Elevación de Cejas',
      description: 'Levanta ambas cejas lo más alto posible y mantén 3 segundos.',
      type: 'ISOMETRIC',
      category: 'CORE',
      mobileModule: 'BROWS',
    },
  });

  const exJaw = await prisma.exercise.create({
    data: {
      keyName: 'jaw_open',
      name: 'Apertura Mandibular',
      description: 'Abre la boca lentamente al máximo y regresa a posición neutral.',
      type: 'RELAXATION',
      category: 'COOLDOWN',
      mobileModule: 'JAW',
    },
  });

  const exKiss = await prisma.exercise.create({
    data: {
      keyName: 'lip_pucker',
      name: 'Fruncir Labios',
      description: 'Frunce los labios como para dar un beso y mantén 3 segundos.',
      type: 'ISOMETRIC',
      category: 'CORE',
      mobileModule: 'KISS',
    },
  });

  const exEyes = await prisma.exercise.create({
    data: {
      keyName: 'eye_close_force',
      name: 'Cierre Ocular Forzado',
      description: 'Cierra ambos ojos con fuerza máxima y mantén 2 segundos.',
      type: 'MANUAL',
      category: 'WARMUP',
      mobileModule: 'EYES',
    },
  });

  const exEyesInverse = await prisma.exercise.create({
    data: {
      keyName: 'eye_open_wide',
      name: 'Apertura Ocular Amplia',
      description: 'Abre los ojos lo más amplio posible, elevando cejas simultáneamente.',
      type: 'ISOTONIC',
      category: 'WARMUP',
      mobileModule: 'EYES_INVERSE',
    },
  });
  console.log('✅ Exercises: 6');

  // ─── 5. PATIENTS + ROUTINES + SESSIONS ────────────────────────────────────

  // --- Patient 1: Parálisis de Bell – recuperación avanzada, 14 sesiones con progreso
  const patient1 = await prisma.patient.create({
    data: {
      therapistId: therapist.id,
      firstName: 'Carlos',
      lastName: 'Mendoza',
      dateOfBirth: new Date('1978-04-12'),
      gender: 'MALE',
      phoneNumber: '55 1234 5678',
      email: 'carlos.mendoza@email.com',
      status: 'ACTIVE',
      diagnosis: 'Parálisis de Bell',
      initialParalysisDegree: 5,
      clinicalNotes: 'Paciente con parálisis de Bell grado V. Inicio de tratamiento 3 meses post-inicio. Buena respuesta al tratamiento.',
      emergencyContactName: 'María Mendoza',
      emergencyContactPhone: '55 8765 4321',
    },
  });

  const routine1 = await prisma.routine.create({
    data: {
      patientId: patient1.id,
      name: 'Protocolo Fase 2 – Recuperación Activa',
      startDate: new Date('2026-01-15'),
      status: 'ACTIVE',
      therapistNotes: 'Aumentar dificultad cada 2 semanas según tolerancia.',
      items: {
        create: [
          { exerciseId: exEyes.id,  orderIndex: 0, sets: 2, repsPerSet: 8,  targetHoldSeconds: 2, restBetweenSets: 30, difficultyLevel: 1.2, strictMode: false, allowSkip: true },
          { exerciseId: exBrows.id, orderIndex: 1, sets: 3, repsPerSet: 10, targetHoldSeconds: 3, restBetweenSets: 30, difficultyLevel: 1.0, strictMode: false, allowSkip: true },
          { exerciseId: exSmile.id, orderIndex: 2, sets: 3, repsPerSet: 10, targetHoldSeconds: 3, restBetweenSets: 30, difficultyLevel: 1.0, strictMode: true,  allowSkip: false },
          { exerciseId: exKiss.id,  orderIndex: 3, sets: 2, repsPerSet: 8,  targetHoldSeconds: 3, restBetweenSets: 30, difficultyLevel: 0.8, strictMode: false, allowSkip: true },
          { exerciseId: exJaw.id,   orderIndex: 4, sets: 1, repsPerSet: 5,  targetHoldSeconds: 5, restBetweenSets: 60, difficultyLevel: 0.5, strictMode: false, allowSkip: true },
        ],
      },
    },
  });

  const sessions1: { date: string; score: number; dur: number }[] = [
    { date: '2026-01-16', score: 0.42, dur: 900 },
    { date: '2026-01-18', score: 0.45, dur: 930 },
    { date: '2026-01-20', score: 0.48, dur: 960 },
    { date: '2026-01-22', score: 0.51, dur: 990 },
    { date: '2026-01-25', score: 0.55, dur: 1020 },
    { date: '2026-01-27', score: 0.57, dur: 1050 },
    { date: '2026-01-29', score: 0.60, dur: 1080 },
    { date: '2026-02-01', score: 0.63, dur: 1110 },
    { date: '2026-02-03', score: 0.66, dur: 1140 },
    { date: '2026-02-05', score: 0.68, dur: 1170 },
    { date: '2026-02-08', score: 0.71, dur: 1200 },
    { date: '2026-02-10', score: 0.73, dur: 1230 },
    { date: '2026-02-12', score: 0.76, dur: 1260 },
    { date: '2026-02-15', score: 0.79, dur: 1290 },
  ];

  for (const s of sessions1) {
    const acc = s.score;
    await prisma.session.create({
      data: {
        routineId: routine1.id,
        date: new Date(s.date),
        durationSeconds: s.dur,
        score: acc,
        isSynced: true,
        items: {
          create: [
            { exerciseId: exEyes.id,  repsCompleted: 8,  averageAccuracy: Math.max(0, acc - 0.05) },
            { exerciseId: exBrows.id, repsCompleted: 10, averageAccuracy: acc },
            { exerciseId: exSmile.id, repsCompleted: 10, averageAccuracy: Math.min(1, acc + 0.02) },
            { exerciseId: exKiss.id,  repsCompleted: 8,  averageAccuracy: Math.max(0, acc - 0.03) },
            { exerciseId: exJaw.id,   repsCompleted: 5,  averageAccuracy: Math.min(1, acc + 0.05) },
          ],
        },
      },
    });
  }

  // --- Patient 2: Síndrome de Ramsay Hunt – baja adherencia, pocas sesiones
  const patient2 = await prisma.patient.create({
    data: {
      therapistId: therapist.id,
      firstName: 'Laura',
      lastName: 'Vázquez',
      dateOfBirth: new Date('1965-09-23'),
      gender: 'FEMALE',
      phoneNumber: '55 2345 6789',
      email: 'laura.vazquez@email.com',
      status: 'ACTIVE',
      diagnosis: 'Síndrome de Ramsay Hunt',
      initialParalysisDegree: 6,
      clinicalNotes: 'Parálisis grado VI. Herpes zóster ótico confirmado. Inicio tardío (6 semanas post-inicio).',
      emergencyContactName: 'Roberto Vázquez',
      emergencyContactPhone: '55 9876 5432',
    },
  });

  const routine2 = await prisma.routine.create({
    data: {
      patientId: patient2.id,
      name: 'Protocolo Inicial – Fase 1',
      startDate: new Date('2026-02-01'),
      status: 'ACTIVE',
      therapistNotes: 'Ejercicios suaves únicamente. No forzar movimientos.',
      items: {
        create: [
          { exerciseId: exEyes.id,  orderIndex: 0, sets: 1, repsPerSet: 5, targetHoldSeconds: 2, restBetweenSets: 60, difficultyLevel: 0.5, strictMode: false, allowSkip: true },
          { exerciseId: exBrows.id, orderIndex: 1, sets: 1, repsPerSet: 5, targetHoldSeconds: 2, restBetweenSets: 60, difficultyLevel: 0.5, strictMode: false, allowSkip: true },
          { exerciseId: exSmile.id, orderIndex: 2, sets: 1, repsPerSet: 5, targetHoldSeconds: 2, restBetweenSets: 60, difficultyLevel: 0.5, strictMode: false, allowSkip: true },
        ],
      },
    },
  });

  const sessions2: { date: string; score: number; dur: number }[] = [
    { date: '2026-02-03', score: 0.18, dur: 600 },
    { date: '2026-02-10', score: 0.22, dur: 620 },
    { date: '2026-02-20', score: 0.25, dur: 640 },
  ];

  for (const s of sessions2) {
    const acc = s.score;
    await prisma.session.create({
      data: {
        routineId: routine2.id,
        date: new Date(s.date),
        durationSeconds: s.dur,
        score: acc,
        isSynced: true,
        items: {
          create: [
            { exerciseId: exEyes.id,  repsCompleted: 5, averageAccuracy: Math.max(0, acc - 0.02) },
            { exerciseId: exBrows.id, repsCompleted: 4, averageAccuracy: acc },
            { exerciseId: exSmile.id, repsCompleted: 3, averageAccuracy: Math.min(1, acc + 0.03) },
          ],
        },
      },
    });
  }

  // --- Patient 3: Parálisis post-quirúrgica – alta adherencia, progreso excelente (18 sesiones)
  const patient3 = await prisma.patient.create({
    data: {
      therapistId: therapist.id,
      firstName: 'Ana',
      lastName: 'Reyes',
      dateOfBirth: new Date('1990-02-14'),
      gender: 'FEMALE',
      phoneNumber: '55 3456 7890',
      email: 'ana.reyes@email.com',
      status: 'ACTIVE',
      diagnosis: 'Parálisis Facial Post-Quirúrgica',
      initialParalysisDegree: 4,
      clinicalNotes: 'Parálisis grado IV. Resección de neurinoma del acústico. Excelente motivación y adherencia.',
      emergencyContactName: 'Jorge Reyes',
      emergencyContactPhone: '55 1111 2222',
    },
  });

  const routine3 = await prisma.routine.create({
    data: {
      patientId: patient3.id,
      name: 'Protocolo Post-Quirúrgico Intensivo',
      startDate: new Date('2025-12-01'),
      status: 'ACTIVE',
      therapistNotes: 'Paciente con alta adherencia. Protocolo intensivo autorizado.',
      items: {
        create: [
          { exerciseId: exEyesInverse.id, orderIndex: 0, sets: 3, repsPerSet: 12, targetHoldSeconds: 3, restBetweenSets: 20, difficultyLevel: 1.5, strictMode: true,  allowSkip: false },
          { exerciseId: exEyes.id,        orderIndex: 1, sets: 3, repsPerSet: 12, targetHoldSeconds: 3, restBetweenSets: 20, difficultyLevel: 1.5, strictMode: true,  allowSkip: false },
          { exerciseId: exBrows.id,       orderIndex: 2, sets: 3, repsPerSet: 12, targetHoldSeconds: 3, restBetweenSets: 20, difficultyLevel: 1.5, strictMode: false, allowSkip: false },
          { exerciseId: exSmile.id,       orderIndex: 3, sets: 3, repsPerSet: 12, targetHoldSeconds: 3, restBetweenSets: 20, difficultyLevel: 1.5, strictMode: true,  allowSkip: false },
          { exerciseId: exKiss.id,        orderIndex: 4, sets: 3, repsPerSet: 10, targetHoldSeconds: 3, restBetweenSets: 20, difficultyLevel: 1.2, strictMode: false, allowSkip: true },
          { exerciseId: exJaw.id,         orderIndex: 5, sets: 2, repsPerSet: 8,  targetHoldSeconds: 5, restBetweenSets: 30, difficultyLevel: 1.0, strictMode: false, allowSkip: true },
        ],
      },
    },
  });

  const sessions3: { date: string; score: number; dur: number }[] = [
    { date: '2025-12-02', score: 0.35, dur: 1200 },
    { date: '2025-12-04', score: 0.40, dur: 1220 },
    { date: '2025-12-06', score: 0.44, dur: 1240 },
    { date: '2025-12-08', score: 0.48, dur: 1260 },
    { date: '2025-12-10', score: 0.53, dur: 1280 },
    { date: '2025-12-12', score: 0.57, dur: 1300 },
    { date: '2025-12-14', score: 0.61, dur: 1320 },
    { date: '2025-12-16', score: 0.64, dur: 1340 },
    { date: '2025-12-18', score: 0.67, dur: 1360 },
    { date: '2025-12-20', score: 0.70, dur: 1380 },
    { date: '2025-12-22', score: 0.72, dur: 1400 },
    { date: '2025-12-25', score: 0.75, dur: 1420 },
    { date: '2025-12-27', score: 0.77, dur: 1440 },
    { date: '2025-12-29', score: 0.79, dur: 1460 },
    { date: '2026-01-02', score: 0.81, dur: 1480 },
    { date: '2026-01-05', score: 0.83, dur: 1500 },
    { date: '2026-01-08', score: 0.85, dur: 1520 },
    { date: '2026-01-11', score: 0.87, dur: 1540 },
  ];

  for (const s of sessions3) {
    const acc = s.score;
    await prisma.session.create({
      data: {
        routineId: routine3.id,
        date: new Date(s.date),
        durationSeconds: s.dur,
        score: acc,
        isSynced: true,
        items: {
          create: [
            { exerciseId: exEyesInverse.id, repsCompleted: 12, averageAccuracy: Math.max(0, acc - 0.04) },
            { exerciseId: exEyes.id,        repsCompleted: 12, averageAccuracy: Math.max(0, acc - 0.02) },
            { exerciseId: exBrows.id,       repsCompleted: 12, averageAccuracy: acc },
            { exerciseId: exSmile.id,       repsCompleted: 12, averageAccuracy: Math.min(1, acc + 0.02) },
            { exerciseId: exKiss.id,        repsCompleted: 10, averageAccuracy: acc },
            { exerciseId: exJaw.id,         repsCompleted: 8,  averageAccuracy: Math.min(1, acc + 0.04) },
          ],
        },
      },
    });
  }

  // --- Patient 4: Baja adherencia – aparece en dashboard de riesgo
  const patient4 = await prisma.patient.create({
    data: {
      therapistId: therapist.id,
      firstName: 'Miguel',
      lastName: 'Herrera',
      dateOfBirth: new Date('1955-11-30'),
      gender: 'MALE',
      phoneNumber: '55 4567 8901',
      email: 'miguel.herrera@email.com',
      status: 'ACTIVE',
      diagnosis: 'Parálisis de Bell',
      initialParalysisDegree: 3,
      clinicalNotes: 'Parálisis grado III. Baja adherencia al tratamiento. Seguimiento necesario.',
      emergencyContactName: 'Carmen Herrera',
      emergencyContactPhone: '55 3333 4444',
    },
  });

  const routine4 = await prisma.routine.create({
    data: {
      patientId: patient4.id,
      name: 'Protocolo Básico',
      startDate: new Date('2026-01-10'),
      status: 'ACTIVE',
      items: {
        create: [
          { exerciseId: exSmile.id, orderIndex: 0, sets: 2, repsPerSet: 8, targetHoldSeconds: 3, restBetweenSets: 30, difficultyLevel: 0.8, strictMode: false, allowSkip: true },
          { exerciseId: exBrows.id, orderIndex: 1, sets: 2, repsPerSet: 8, targetHoldSeconds: 3, restBetweenSets: 30, difficultyLevel: 0.8, strictMode: false, allowSkip: true },
        ],
      },
    },
  });

  // Solo 2 sesiones hace tiempo – aparece como paciente en riesgo
  await prisma.session.create({
    data: {
      routineId: routine4.id,
      date: new Date('2026-01-12'),
      durationSeconds: 480,
      score: 0.35,
      isSynced: true,
      items: {
        create: [
          { exerciseId: exSmile.id, repsCompleted: 6, averageAccuracy: 0.33 },
          { exerciseId: exBrows.id, repsCompleted: 5, averageAccuracy: 0.37 },
        ],
      },
    },
  });

  await prisma.session.create({
    data: {
      routineId: routine4.id,
      date: new Date('2026-01-15'),
      durationSeconds: 510,
      score: 0.38,
      isSynced: true,
      items: {
        create: [
          { exerciseId: exSmile.id, repsCompleted: 7, averageAccuracy: 0.36 },
          { exerciseId: exBrows.id, repsCompleted: 6, averageAccuracy: 0.40 },
        ],
      },
    },
  });

  // --- Patient 5: Paciente demo para app móvil (código de acceso: 123456)
  const accessCodeHash = await bcrypt.hash('123456', 10);
  await prisma.patient.create({
    data: {
      therapistId: therapist.id,
      firstName: 'Demo',
      lastName: 'Paciente',
      dateOfBirth: new Date('1985-06-15'),
      gender: 'OTHER',
      email: 'demo@symma.com',
      status: 'ACTIVE',
      diagnosis: 'Parálisis de Bell',
      initialParalysisDegree: 4,
      clinicalNotes: 'Paciente de prueba para desarrollo móvil.',
      accessCodeHash,
      routines: {
        create: {
          name: 'Rutina Demo – Todos los Módulos',
          startDate: new Date('2026-01-01'),
          status: 'ACTIVE',
          items: {
            create: [
              { exerciseId: exEyes.id,        orderIndex: 0, sets: 2, repsPerSet: 5,  targetHoldSeconds: 3, restBetweenSets: 15, difficultyLevel: 1.0, strictMode: false, allowSkip: true },
              { exerciseId: exEyesInverse.id, orderIndex: 1, sets: 2, repsPerSet: 5,  targetHoldSeconds: 3, restBetweenSets: 15, difficultyLevel: 1.0, strictMode: false, allowSkip: true },
              { exerciseId: exBrows.id,       orderIndex: 2, sets: 3, repsPerSet: 10, targetHoldSeconds: 3, restBetweenSets: 30, difficultyLevel: 1.0, strictMode: false, allowSkip: true },
              { exerciseId: exSmile.id,       orderIndex: 3, sets: 3, repsPerSet: 10, targetHoldSeconds: 3, restBetweenSets: 30, difficultyLevel: 1.0, strictMode: false, allowSkip: true },
              { exerciseId: exKiss.id,        orderIndex: 4, sets: 2, repsPerSet: 8,  targetHoldSeconds: 3, restBetweenSets: 15, difficultyLevel: 1.0, strictMode: false, allowSkip: true },
              { exerciseId: exJaw.id,         orderIndex: 5, sets: 1, repsPerSet: 5,  targetHoldSeconds: 5, restBetweenSets: 60, difficultyLevel: 0.5, strictMode: false, allowSkip: true },
            ],
          },
        },
      },
    },
  });

  console.log('✅ Patients + Routines + Sessions created');
  console.log('');
  console.log('─────────────────────────────────────────────────────');
  console.log('📋 Seed Summary');
  console.log('─────────────────────────────────────────────────────');
  console.log('🏥 Clinic:      Clínica de Rehabilitación Facial Symma');
  console.log('');
  console.log('👤 Admin:       admin@symma.com        / Admin123!');
  console.log('👤 Therapist:   dra.garcia@symma.com   / Therapist123!');
  console.log('');
  console.log('📱 Mobile demo: demo@symma.com         / Code: 123456');
  console.log('');
  console.log('🏋️  Exercises (6): SMILE, BROWS, JAW, KISS, EYES, EYES_INVERSE');
  console.log('');
  console.log('🧑‍🦽 Patients (5):');
  console.log('   Carlos Mendoza  – Bell grado V,        14 sesiones, progreso bueno');
  console.log('   Laura Vázquez   – Ramsay Hunt grado VI, 3 sesiones, adherencia baja');
  console.log('   Ana Reyes       – Post-quirúrgica IV,  18 sesiones, progreso excelente');
  console.log('   Miguel Herrera  – Bell grado III,       2 sesiones, EN RIESGO');
  console.log('   Demo Paciente   – Pruebas móvil, todos los módulos, sin sesiones');
  console.log('─────────────────────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
