# Symma Platform

Ecosistema digital para la rehabilitación de la parálisis facial. El terapeuta prescribe y supervisa rutinas de ejercicios faciales desde un portal web; el paciente las ejecuta en una app Android que, con MediaPipe, mide en el propio dispositivo la precisión de cada gesto y la simetría facial izquierda/derecha, y sincroniza los resultados con el backend aunque haya trabajado sin conexión.

La especificación de la tesis vive en [`docs/`](docs): requerimientos funcionales y no funcionales, historias de usuario, documentación de la API, diagrama entidad-relación y diagramas de arquitectura.

## Estructura del monorepo

```text
symma-platform/
├── apps/
│   ├── api/                 # API REST (NestJS + Prisma), puerto 4001, prefijo /api/v1
│   ├── web/                 # Portal del terapeuta (Next.js + Auth.js), puerto 4000
│   └── mobile/              # App del paciente (Android, Kotlin + Jetpack Compose); Gradle independiente
├── packages/
│   ├── database/            # Esquema, migraciones y seed de Prisma (PostgreSQL 15)
│   ├── shared-types/        # Contratos TypeScript compartidos entre API y web
│   ├── i18n/                # Catálogos de traducción (es, en)
│   ├── eslint-config/       # Configuración compartida de ESLint
│   └── typescript-config/   # Configuración compartida de TypeScript
├── specs/                   # Contratos OpenAPI y especificaciones
├── docs/                    # Documentación de la tesis
├── docker-compose.yml       # PostgreSQL, MinIO (S3), API y portal web
└── .github/workflows/ci.yml # Pipeline de CI
```

Las tareas de Node se orquestan con Turborepo sobre workspaces de pnpm.

## Requisitos

- Node.js 20 y pnpm 9 (`corepack enable` activa la versión fijada en `package.json`).
- Docker con Docker Compose v2.
- Para la app móvil: JDK 17 y Android SDK 34 (Android Studio), con un emulador o dispositivo con Android 8.0 (API 26) o superior.

## Variables de entorno

Cada componente tiene su propio archivo de ejemplo, versionado y sin valores reales. Ningún secreto tiene valor por defecto: si falta, Docker Compose o la API se niegan a arrancar con un mensaje que indica la variable. Los secretos se pueden generar con `openssl rand -base64 32`.

| Archivo | Lo usa | Variables obligatorias |
|---|---|---|
| `.env.example` → `.env` | Docker Compose | `POSTGRES_PASSWORD`, `JWT_SECRET`, `PIN_HMAC_SECRET`, `AUTH_SECRET`, `MINIO_ROOT_PASSWORD` |
| `apps/api/.env.example` → `apps/api/.env` | API en local | `DATABASE_URL`, `JWT_SECRET`, `PIN_HMAC_SECRET` |
| `apps/web/.env.example` → `apps/web/.env.local` | Portal en local | `AUTH_SECRET`, `AUTH_URL`, `NEXT_PUBLIC_API_URL` |

Prisma (migraciones y seed) lee `packages/database/.env`, que debe contener `DATABASE_URL` y el mismo `PIN_HMAC_SECRET` que la API, porque el seed calcula el hash del PIN del paciente demo.

Las variables de S3 (`S3_*`) son opcionales para la API: sin ellas arranca y los endpoints de snapshots responden 503. Docker Compose las configura automáticamente contra MinIO.

## Levantar todo con Docker Compose

```bash
cp .env.example .env    # rellenar los valores vacíos
docker compose up --build
```

| Servicio | URL |
|---|---|
| Portal web | http://localhost:4000 |
| API | http://localhost:4001/api/v1 (Swagger en http://localhost:4001/api/docs) |
| PostgreSQL | localhost:5440 |
| MinIO (S3) | http://localhost:9000 (consola en http://localhost:9001) |

El contenedor de la API aplica `prisma migrate deploy` al arrancar, y MinIO crea el bucket de snapshots (`S3_BUCKET`). Los puertos se cambian con `POSTGRES_PORT`, `API_PORT`, `WEB_PORT`, `MINIO_API_PORT` y `MINIO_CONSOLE_PORT`. Las URLs firmadas de snapshots usan `S3_ENDPOINT`, que debe ser alcanzable desde el navegador y desde el teléfono (con un dispositivo físico, la IP de la máquina en la red local).

La base levantada así está vacía. Para cargar los datos de demostración, con `packages/database/.env` apuntando a ella:

```bash
pnpm --filter @symma/database db:seed
```

El seed crea las cuentas `admin@symma.com` / `Admin123!` (rol ADMIN) y `dra.garcia@symma.com` / `Therapist123!`, y un paciente demo con PIN `123456`.

## Desarrollo local

```bash
pnpm install
docker compose up -d postgres                   # solo la base de datos
pnpm --filter @symma/database db:generate       # cliente de Prisma
pnpm --filter @symma/database exec prisma migrate deploy
pnpm --filter @symma/database db:seed           # opcional
pnpm dev                                        # API en :4001 y portal en :4000
```

Docker Compose valida todas las variables obligatorias del archivo aunque solo se levante `postgres`, así que el `.env` de la raíz debe estar completo.

### App móvil

Abrir `apps/mobile` en Android Studio, o desde la terminal:

```bash
cd apps/mobile
./gradlew installDebug
```

La URL de la API se toma de `api.baseUrl` en `apps/mobile/local.properties` (por defecto `http://10.0.2.2:4001/`, el host visto desde el emulador). Las builds release solo aceptan HTTPS.

## Pruebas y verificaciones

```bash
pnpm build                                   # compila paquetes, API y portal
pnpm lint
pnpm check-types
pnpm test                                    # unitarias de API, portal y paquetes
pnpm --filter web exec tsc --noEmit          # tipos del portal
E2E_DATABASE_URL=postgresql://USER:PASSWORD@localhost:5440/symma_e2e?schema=public \
  pnpm --filter api test:e2e                 # e2e de la API contra una base desechable ya migrada
cd apps/mobile && ./gradlew testDebugUnitTest  # unitarias de Android
```

Las pruebas e2e crean y borran registros: `E2E_DATABASE_URL` debe apuntar a una base distinta de la de desarrollo (la suite se niega a usar la de `apps/api/.env`).

El pipeline de CI (`.github/workflows/ci.yml`) ejecuta en cada push la instalación, `prisma migrate deploy` contra un PostgreSQL vacío, build, lint, typecheck, las pruebas unitarias y e2e de la API, portal y paquetes, y las pruebas unitarias de Android.
