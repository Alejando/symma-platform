import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PatientsModule } from './patients/patients.module';
import { ExercisesModule } from './exercises/exercises.module';
import { RoutinesModule } from './routines/routines.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { MobileModule } from './mobile/mobile.module';
import { SessionsModule } from './sessions/sessions.module';
import { AppI18nModule } from './i18n/i18n.module';
import { APP_FILTER } from '@nestjs/core';
import { I18nExceptionFilter } from './common/filters/i18n-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AppI18nModule,
    PrismaModule,
    AuthModule,
    PatientsModule,
    ExercisesModule,
    RoutinesModule,
    AnalyticsModule,
    DashboardModule,
    MobileModule,
    SessionsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: I18nExceptionFilter,
    },
  ],
})
export class AppModule {}
