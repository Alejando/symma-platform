import { createHash } from 'crypto';
import { allAccessCodes, hashAccessCode } from './access-code';

export interface StoredAccessCode {
  id: string;
  accessCodeHash: string;
}

export interface AccessCodeMigrationPlan {
  updates: StoredAccessCode[];
  alreadyMigratedIds: string[];
  unrecognizedIds: string[];
}

export function legacyAccessCodeHash(accessCode: string): string {
  return createHash('sha256').update(accessCode).digest('hex');
}

/**
 * Legacy hashes are unsalted SHA-256 of a 6-digit PIN, so every PIN can be
 * recovered by enumerating the whole PIN space and re-hashed with the HMAC.
 * Rows already holding the HMAC of some PIN are left untouched, which makes
 * the migration safe to run more than once.
 */
export function planAccessCodeMigration(
  storedAccessCodes: StoredAccessCode[],
  secret: string,
): AccessCodeMigrationPlan {
  const patientIdByHash = new Map(
    storedAccessCodes.map(({ id, accessCodeHash }) => [accessCodeHash, id]),
  );
  const updates: StoredAccessCode[] = [];
  const alreadyMigratedIds: string[] = [];

  for (const accessCode of allAccessCodes()) {
    if (patientIdByHash.size === 0) break;

    const currentHash = hashAccessCode(accessCode, secret);
    const migratedPatientId = patientIdByHash.get(currentHash);
    if (migratedPatientId) {
      alreadyMigratedIds.push(migratedPatientId);
      patientIdByHash.delete(currentHash);
    }

    const legacyHash = legacyAccessCodeHash(accessCode);
    const legacyPatientId = patientIdByHash.get(legacyHash);
    if (legacyPatientId) {
      updates.push({ id: legacyPatientId, accessCodeHash: currentHash });
      patientIdByHash.delete(legacyHash);
    }
  }

  return {
    updates,
    alreadyMigratedIds,
    unrecognizedIds: [...patientIdByHash.values()],
  };
}
