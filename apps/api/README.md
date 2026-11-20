# Symma API

API NestJS del portal del terapeuta y de la app móvil. Prefijo global: `/api/v1`; Swagger en `/api/docs`.
Los contratos viven en `specs/001-api-contracts/contracts` y los tipos compartidos en `packages/shared-types`.

## Configuración

Copia `.env.example` a `.env`. La API **no arranca** si falta `DATABASE_URL`, `JWT_SECRET` o `PIN_HMAC_SECRET`.

| Variable | Obligatoria | Uso |
|---|---|---|
| `DATABASE_URL` | sí | PostgreSQL |
| `JWT_SECRET` | sí | Firma de los JWT de terapeuta y paciente |
| `PIN_HMAC_SECRET` | sí | HMAC-SHA256 de los PIN de paciente. Cambiarlo invalida todos los PIN |
| `JWT_THERAPIST_EXPIRES_IN` / `JWT_PATIENT_EXPIRES_IN` | no | Caducidad por tipo de usuario (por defecto `8h` / `7d`) |
| `ANALYTICS_TIME_ZONE` | no | Zona IANA para agrupar sesiones por día calendario (por defecto `UTC`) |
| `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | no | Snapshots. Sin ellas los endpoints de snapshot responden 503 |
| `S3_ENDPOINT`, `S3_FORCE_PATH_STYLE=true` | no | Solo para MinIO |

Genera los secretos con `openssl rand -base64 48`.

Los mensajes de error se traducen con los catálogos de `@symma/i18n` (`packages/i18n/src/locales/*/errors.json`) según `Accept-Language` (`es` por defecto, `en`).

## Desarrollo

```bash
pnpm install
pnpm --filter api start:dev
```

## Migraciones de base de datos

Desde `packages/database`, con `DATABASE_URL` apuntando a la base que quieres migrar:

```bash
pnpm exec prisma migrate deploy
```

`20261119185600_percentage_scale_and_single_active_routine` convierte `averageAccuracy` y `score` de 0–1 a 0–100 (solo filas con valor ≤ 1, así que es seguro reaplicarla) y deja una sola rutina ACTIVE por paciente (conserva la de `start_date` más reciente, que era la que recibía el móvil, y archiva las demás).

## Migración de PIN existentes (una sola vez)

Los PIN guardados antes de este cambio son SHA-256 sin sal. El script recupera cada PIN enumerando los 10⁶ posibles y lo guarda como HMAC con `PIN_HMAC_SECRET`, de modo que los pacientes conservan su PIN. Es idempotente: las filas ya migradas no se tocan.

```bash
cd apps/api
pnpm migrate:access-codes --dry-run   # solo informa
pnpm migrate:access-codes             # aplica
```

Lee `DATABASE_URL` y `PIN_HMAC_SECRET` del entorno o de `apps/api/.env`. Usa el mismo `PIN_HMAC_SECRET` que la API. Las filas listadas en `unrecognizedPatientIds` (por ejemplo, hashes bcrypt antiguos) necesitan un PIN nuevo desde el portal.

## Pruebas

```bash
pnpm --filter api test        # unitarias
pnpm --filter api lint
pnpm --filter api build
```

Las e2e escriben y borran datos, así que exigen una base aparte ya migrada en `E2E_DATABASE_URL` y se niegan a correr contra la `DATABASE_URL` de `.env`:

```bash
E2E_DATABASE_URL="postgresql://USER:PASSWORD@localhost:5440/symma_e2e?schema=public" pnpm --filter api test:e2e
```
