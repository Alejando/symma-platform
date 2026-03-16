import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';

@Module({
  imports: [AuthModule],
  controllers: [SessionsController],
  providers: [SessionsService, JwtAuthGuard],
})
export class SessionsModule {}
