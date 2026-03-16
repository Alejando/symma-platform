# Contract: API i18n Integration

**Feature**: 004-i18n-setup  
**Date**: 2026-03-03

## Overview

Integration of `nestjs-i18n` with NestJS for translated API responses and validation messages.

## Module Configuration

### apps/api/src/i18n/i18n.module.ts

```typescript
import { Module } from '@nestjs/common';
import { I18nModule, AcceptLanguageResolver, HeaderResolver } from 'nestjs-i18n';
import { join } from 'path';

@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: 'es',
      fallbacks: {
        'es-*': 'es',
        'en-*': 'es', // Fallback to Spanish for now
      },
      loaderOptions: {
        path: join(__dirname, 'locales/'),
        watch: true,
      },
      resolvers: [
        new HeaderResolver(['x-lang']),
        AcceptLanguageResolver,
      ],
    }),
  ],
  exports: [I18nModule],
})
export class AppI18nModule {}
```

### Translation Files Location

Copy or symlink from `packages/i18n`:

```
apps/api/src/i18n/
├── i18n.module.ts
├── i18n.service.ts
└── locales/
    └── es/
        ├── common.json
        ├── enums.json
        ├── errors.json
        └── validation.json
```

**Build Script** (package.json):
```json
{
  "scripts": {
    "prebuild": "cp -r ../../packages/i18n/src/locales src/i18n/",
    "build": "nest build"
  }
}
```

## Service Layer

### apps/api/src/i18n/i18n.service.ts

```typescript
import { Injectable } from '@nestjs/common';
import { I18nService, I18nContext } from 'nestjs-i18n';

@Injectable()
export class TranslationService {
  constructor(private readonly i18n: I18nService) {}

  translate(key: string, args?: Record<string, any>): string {
    return this.i18n.t(key, { args });
  }

  translateEnum(enumName: string, value: string): string {
    return this.i18n.t(`enums.${enumName}.${value}`);
  }

  translateError(errorKey: string, args?: Record<string, any>): string {
    return this.i18n.t(`errors.${errorKey}`, { args });
  }

  translateValidation(validationKey: string, args?: Record<string, any>): string {
    return this.i18n.t(`validation.${validationKey}`, { args });
  }

  // Get current locale from request context
  getCurrentLocale(): string {
    return I18nContext.current()?.lang ?? 'es';
  }
}
```

## Exception Filter Integration

### apps/api/src/common/filters/i18n-exception.filter.ts

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Response } from 'express';

@Catch(HttpException)
export class I18nExceptionFilter implements ExceptionFilter {
  constructor(private readonly i18n: I18nService) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    const exceptionResponse = exception.getResponse() as any;
    
    // Translate error message if it's a key
    let message = exceptionResponse.message || exceptionResponse;
    if (typeof message === 'string' && message.startsWith('errors.')) {
      message = this.i18n.t(message);
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
```

## DTO Validation Integration

### apps/api/src/common/decorators/i18n-validation.decorator.ts

```typescript
import { i18nValidationMessage } from 'nestjs-i18n';
import { IsNotEmpty, IsEmail, MinLength, MaxLength } from 'class-validator';

// Wrapper decorators with i18n messages
export const IsRequiredField = () => 
  IsNotEmpty({ message: i18nValidationMessage('validation.required') });

export const IsValidEmail = () => 
  IsEmail({}, { message: i18nValidationMessage('validation.email') });

export const HasMinLength = (min: number) => 
  MinLength(min, { message: i18nValidationMessage('validation.minLength', { min }) });

export const HasMaxLength = (max: number) => 
  MaxLength(max, { message: i18nValidationMessage('validation.maxLength', { max }) });
```

### Usage in DTOs

```typescript
// apps/api/src/patients/dto/create-patient.dto.ts
import { IsRequiredField, IsValidEmail, HasMinLength } from '@/common/decorators/i18n-validation.decorator';

export class CreatePatientDto {
  @IsRequiredField()
  @HasMinLength(2)
  firstName: string;

  @IsRequiredField()
  @HasMinLength(2)
  lastName: string;

  @IsValidEmail()
  email?: string;
}
```

## Usage in Controllers

```typescript
// apps/api/src/patients/patients.controller.ts
import { Controller, Get, NotFoundException } from '@nestjs/common';
import { TranslationService } from '@/i18n/i18n.service';

@Controller('patients')
export class PatientsController {
  constructor(
    private readonly translationService: TranslationService,
  ) {}

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const patient = await this.patientsService.findOne(id);
    
    if (!patient) {
      throw new NotFoundException(
        this.translationService.translateError('patient.notFound')
      );
    }
    
    return patient;
  }
}
```

## Dependencies

```json
{
  "dependencies": {
    "nestjs-i18n": "^10.0.0"
  }
}
```

## App Module Integration

```typescript
// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AppI18nModule } from './i18n/i18n.module';
import { I18nExceptionFilter } from './common/filters/i18n-exception.filter';

@Module({
  imports: [
    AppI18nModule,
    // ... other modules
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: I18nExceptionFilter,
    },
  ],
})
export class AppModule {}
```

## Testing Contract

```typescript
// apps/api/src/i18n/i18n.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import { TranslationService } from './i18n.service';

describe('TranslationService', () => {
  let service: TranslationService;
  let i18nService: I18nService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TranslationService,
        {
          provide: I18nService,
          useValue: {
            t: jest.fn((key: string) => {
              const translations: Record<string, string> = {
                'enums.PatientStatus.ACTIVE': 'Activo',
                'errors.patient.notFound': 'Paciente no encontrado',
              };
              return translations[key] ?? key;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<TranslationService>(TranslationService);
    i18nService = module.get<I18nService>(I18nService);
  });

  it('translates enum values', () => {
    expect(service.translateEnum('PatientStatus', 'ACTIVE')).toBe('Activo');
  });

  it('translates error messages', () => {
    expect(service.translateError('patient.notFound')).toBe('Paciente no encontrado');
  });
});
```
