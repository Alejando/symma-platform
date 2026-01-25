# RFC-001: Monorepo Infrastructure Setup

| Estado | In Progress |
| :--- | :--- |
| **Autor** | DevOps & FullStack Engineer |
| **Fecha** | January 2026 |
| **Ticket** | INF-01, INF-02, BE-01 |

## 1. Resumen

Configuración inicial de la infraestructura de desarrollo del monorepo Symma Platform, incluyendo Docker Compose para PostgreSQL, configuración de workspaces pnpm, Turborepo, y los esquemas base de Prisma.

## 2. Technical Specifications

### 2.1 Port Allocation Strategy

| Service | Port | Description |
| :--- | :--- | :--- |
| **Web (Next.js)** | `4000` | Therapist Dashboard |
| **API (NestJS)** | `4001` | Backend REST API |
| **PostgreSQL** | `5440` | Database (Docker) |

> [!IMPORTANT]
> These custom ports are mandatory. Do NOT use default ports (3000, 3001, 5432).

### 2.2 Environment Variables

#### Root `.env`
```bash
# Database
DATABASE_URL="postgresql://symma_admin:symma_password@localhost:5440/symma_db?schema=public"
POSTGRES_USER=symma_admin
POSTGRES_PASSWORD=symma_password
POSTGRES_DB=symma_db
POSTGRES_PORT=5440

# Services
API_PORT=4001
WEB_PORT=4000
```

#### API `.env` (`apps/api/.env`)
```bash
PORT=4001
DATABASE_URL="postgresql://symma_admin:symma_password@localhost:5440/symma_db?schema=public"
NODE_ENV=development
```

#### Web `.env.local` (`apps/web/.env.local`)
```bash
NEXT_PUBLIC_API_URL=http://localhost:4001
```

### 2.3 Monorepo Structure

```text
symma-platform/
├── .env                    # Root environment (Docker, shared)
├── .env.example            # Template for .env
├── docker-compose.yml      # PostgreSQL on port 5440
├── package.json            # Root workspace scripts
├── pnpm-workspace.yaml     # Workspace definitions
├── turbo.json              # Build orchestration
├── apps/
│   ├── api/                # NestJS Backend (port 4001)
│   │   ├── .env
│   │   ├── .env.example
│   │   └── src/main.ts
│   └── web/                # Next.js Frontend (port 4000)
│       ├── .env.local
│       ├── .env.example
│       └── package.json
└── packages/
    └── database/           # Prisma Schema & Client
        ├── package.json
        ├── prisma/
        │   └── schema.prisma
        └── src/
            └── index.ts
```

## 3. Implementation Details

### 3.1 Docker Compose (`docker-compose.yml`)

```yaml
version: "3.8"

services:
  postgres:
    container_name: symma_db
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-symma_admin}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-symma_password}
      POSTGRES_DB: ${POSTGRES_DB:-symma_db}
    ports:
      - "${POSTGRES_PORT:-5440}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - symma_net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-symma_admin}"]
      interval: 10s
      timeout: 5s
      retries: 5

networks:
  symma_net:
    driver: bridge

volumes:
  postgres_data:
```

### 3.2 NestJS Configuration (`apps/api/src/main.ts`)

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 4001;
  await app.listen(port);
  console.log(`🚀 API running on http://localhost:${port}`);
}
bootstrap();
```

### 3.3 Next.js Configuration (`apps/web/package.json`)

```json
{
  "scripts": {
    "dev": "next dev --turbopack -p 4000",
    "build": "next build",
    "start": "next start -p 4000"
  }
}
```

### 3.4 Database Package (`packages/database`)

#### `package.json`
```json
{
  "name": "@symma/database",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "@prisma/client": "^6.0.0"
  },
  "devDependencies": {
    "prisma": "^6.0.0"
  }
}
```

#### `prisma/schema.prisma`
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Core Entities - Sprint 0 Foundation

model Clinic {
  id           String      @id @default(uuid())
  name         String
  address      String?
  contactPhone String?     @map("contact_phone")
  billingInfo  String?     @map("billing_info")
  createdAt    DateTime    @default(now()) @map("created_at")
  therapists   Therapist[]

  @@map("clinics")
}

model Therapist {
  id           String    @id @default(uuid())
  clinicId     String    @map("clinic_id")
  email        String    @unique
  passwordHash String    @map("password_hash")
  firstName    String    @map("first_name")
  lastName     String    @map("last_name")
  role         Role      @default(THERAPIST)
  isActive     Boolean   @default(true) @map("is_active")
  createdAt    DateTime  @default(now()) @map("created_at")
  clinic       Clinic    @relation(fields: [clinicId], references: [id])
  patients     Patient[]

  @@map("therapists")
}

model Patient {
  id                    String    @id @default(uuid())
  therapistId           String    @map("therapist_id")
  firstName             String    @map("first_name")
  lastName              String    @map("last_name")
  dateOfBirth           DateTime? @map("date_of_birth")
  gender                Gender?
  phoneNumber           String?   @map("phone_number")
  email                 String?
  status                PatientStatus @default(ACTIVE)
  diagnosis             String?
  initialParalysisDegree Int?     @map("initial_paralysis_degree")
  clinicalNotes         String?   @map("clinical_notes")
  emergencyContactName  String?   @map("emergency_contact_name")
  emergencyContactPhone String?   @map("emergency_contact_phone")
  authPinHash           String?   @map("auth_pin_hash")
  avatarUrl             String?   @map("avatar_url")
  createdAt             DateTime  @default(now()) @map("created_at")
  updatedAt             DateTime  @updatedAt @map("updated_at")
  therapist             Therapist @relation(fields: [therapistId], references: [id])

  @@map("patients")
}

enum Role {
  ADMIN
  THERAPIST
}

enum Gender {
  MALE
  FEMALE
  OTHER
}

enum PatientStatus {
  ACTIVE
  INACTIVE
  ARCHIVED
}
```

## 4. Acceptance Criteria

### Verification Commands

```bash
# 1. Verify pnpm workspace
pnpm install

# 2. Start Docker database
docker compose up -d

# 3. Verify database connection (port 5440)
docker compose ps
# Expected: symma_db running, port 0.0.0.0:5440->5432/tcp

# 4. Run Prisma migration
pnpm --filter @symma/database db:push

# 5. Open Prisma Studio (optional)
pnpm --filter @symma/database db:studio

# 6. Start API on port 4001
pnpm --filter api dev
# Expected: 🚀 API running on http://localhost:4001

# 7. Start Web on port 4000 (in separate terminal)
pnpm --filter web dev
# Expected: Next.js dev server on http://localhost:4000

# 8. Verify services running on correct ports
lsof -i :4000 && lsof -i :4001 && lsof -i :5440
```

## 5. Plan de Trabajo (Tasks)

- [ ] Update `docker-compose.yml` with port 5440 and healthcheck
- [ ] Create root `.env` and `.env.example`
- [ ] Update `apps/api/src/main.ts` with port 4001
- [ ] Create `apps/api/.env` and `.env.example`
- [ ] Update `apps/web/package.json` with port 4000
- [ ] Create `apps/web/.env.example`
- [ ] Create `packages/database/package.json`
- [ ] Create `packages/database/prisma/schema.prisma`
- [ ] Create `packages/database/src/index.ts`
- [ ] Update `turbo.json` with database build outputs
- [ ] Run verification commands