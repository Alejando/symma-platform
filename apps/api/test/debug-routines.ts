import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { RoutinesService } from '../src/routines/routines.service';
import { PrismaService } from '../src/prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const routinesService = app.get(RoutinesService);
  const prismaService = app.get(PrismaService);

  try {
    // Get a therapist and patient to test with
    const therapist = await prismaService.therapist.findFirst();
    if (!therapist) throw new Error('No therapist found');
    console.log('Therapist:', therapist.id);

    const patient = await prismaService.patient.findFirst({
      where: { therapistId: therapist.id }
    });
    if (!patient) throw new Error('No patient found for therapist');
    console.log('Patient:', patient.id);

    console.log('Calling findAllByPatient...');
    const routines = await routinesService.findAllByPatient(therapist.id, patient.id);
    console.log('Result:', JSON.stringify(routines, null, 2));

  } catch (error) {
    console.error('ERROR CAUGHT:');
    console.error(error);
  } finally {
    await app.close();
  }
}

bootstrap();
