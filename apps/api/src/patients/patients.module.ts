import { Module } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { RoutinesModule } from '../routines/routines.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [RoutinesModule, AuthModule],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}
