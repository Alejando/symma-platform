
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { PatientsService } from '../src/patients/patients.service';
import { PatientAuthService } from '../src/auth/patient-auth.service';
import { PrismaService } from '../src/prisma/prisma.service';
import type { PatientStatus } from '@symma/shared-types';

async function verify() {
  console.log('🚀 Starting Verification Script...');

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  await app.init();

  const patientsService = app.get<PatientsService>(PatientsService);
  const authService = app.get<PatientAuthService>(PatientAuthService);
  const prisma = app.get<PrismaService>(PrismaService);

  try {
    // 1. Setup: Create Clinic -> Therapist -> Patient
    console.log('1️⃣  Setting up Dependencies...');
    const clinic = await prisma.clinic.create({
      data: { name: 'Test Clinic Hotfix' }
    });

    const therapist = await prisma.therapist.create({
      data: {
        clinicId: clinic.id,
        firstName: 'Test',
        lastName: 'Therapist',
        email: `test.therapist.${Date.now()}@example.com`,
        passwordHash: 'dummy',
      }
    });

    const patient = await prisma.patient.create({
      data: {
        therapistId: therapist.id,
        firstName: 'Test',
        lastName: 'Patient',
        status: 'ACTIVE',
      }
    });
    console.log(`   ✅ Created Patient: ${patient.id}`);

    // 2. Generate Access Code
    console.log('2️⃣  Generating Access Code...');
    const result = await patientsService.generateAccessCode(therapist.id, patient.id);
    const code = result.accessCode;
    console.log(`   ✅ Generated Code: ${code}`);

    // 3. Verify Database State
    console.log('3️⃣  Verifying DB State...');
    const updatedPatient = await prisma.patient.findUnique({ where: { id: patient.id } });
    if (!updatedPatient?.accessCodeHash) throw new Error('❌ accessCodeHash NOT found in DB');
    console.log('   ✅ accessCodeHash stored successfully');

    // 4. Attempt Login
    console.log('4️⃣  Attempting Login with Access Code...');
    const token = await authService.login(code);
    if (!token.accessToken) throw new Error('❌ Login failed: No token returned');
    console.log('   ✅ Login Successful! Token received.');

    console.log('✅✅✅ VERIFICATION PASSED ✅✅✅');

    // Cleanup
    await prisma.patient.delete({ where: { id: patient.id } });
    await prisma.therapist.delete({ where: { id: therapist.id } });
    await prisma.clinic.delete({ where: { id: clinic.id } });

  } catch (error) {
    console.error('❌ VERIFICATION FAILED:', error);
  } finally {
    await app.close();
  }
}

verify();
