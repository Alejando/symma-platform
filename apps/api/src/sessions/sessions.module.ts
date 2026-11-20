import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';

@Module({
  imports: [AuthModule, StorageModule],
  controllers: [SessionsController],
  providers: [SessionsService],
})
export class SessionsModule {}
