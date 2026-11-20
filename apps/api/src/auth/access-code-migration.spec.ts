import { hashAccessCode } from './access-code';
import {
  legacyAccessCodeHash,
  planAccessCodeMigration,
} from './access-code-migration';

describe('planAccessCodeMigration', () => {
  const secret = 'migration-secret';

  it('recovers each legacy PIN and re-hashes it with the HMAC', () => {
    const plan = planAccessCodeMigration(
      [
        { id: 'patient-a', accessCodeHash: legacyAccessCodeHash('000123') },
        { id: 'patient-b', accessCodeHash: legacyAccessCodeHash('987654') },
      ],
      secret,
    );

    expect(plan.updates).toEqual([
      { id: 'patient-a', accessCodeHash: hashAccessCode('000123', secret) },
      { id: 'patient-b', accessCodeHash: hashAccessCode('987654', secret) },
    ]);
    expect(plan.alreadyMigratedIds).toEqual([]);
    expect(plan.unrecognizedIds).toEqual([]);
  });

  it('leaves already migrated rows untouched so it can run twice', () => {
    const plan = planAccessCodeMigration(
      [{ id: 'patient-a', accessCodeHash: hashAccessCode('123456', secret) }],
      secret,
    );

    expect(plan.updates).toEqual([]);
    expect(plan.alreadyMigratedIds).toEqual(['patient-a']);
  });

  it('reports hashes that are neither legacy nor current', () => {
    const plan = planAccessCodeMigration(
      [{ id: 'patient-a', accessCodeHash: '$2b$10$bcrypt-hash' }],
      secret,
    );

    expect(plan.updates).toEqual([]);
    expect(plan.unrecognizedIds).toEqual(['patient-a']);
  });
});
