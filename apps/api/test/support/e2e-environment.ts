import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const e2eDatabaseUrl = process.env.E2E_DATABASE_URL;

if (!e2eDatabaseUrl) {
  throw new Error(
    'E2E_DATABASE_URL must point to a disposable, migrated database: e2e tests create and delete rows.',
  );
}

const developmentEnvFile = join(__dirname, '..', '..', '.env');
const developmentDatabaseUrl = existsSync(developmentEnvFile)
  ? readDatabaseUrl(readFileSync(developmentEnvFile, 'utf8'))
  : undefined;

if (developmentDatabaseUrl && developmentDatabaseUrl === e2eDatabaseUrl) {
  throw new Error(
    'E2E_DATABASE_URL is the development database from apps/api/.env; use a separate database.',
  );
}

process.env.DATABASE_URL = e2eDatabaseUrl;
process.env.JWT_SECRET = 'e2e-jwt-secret';
process.env.PIN_HMAC_SECRET = 'e2e-pin-hmac-secret';
for (const name of [
  'S3_ENDPOINT',
  'S3_REGION',
  'S3_BUCKET',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
  'S3_FORCE_PATH_STYLE',
]) {
  process.env[name] = '';
}

function readDatabaseUrl(envFileContent: string): string | undefined {
  const match = /^\s*DATABASE_URL\s*=\s*["']?([^"'\n]+)["']?\s*$/m.exec(
    envFileContent,
  );
  return match?.[1];
}
