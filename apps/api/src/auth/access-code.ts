import { createHash, createHmac, randomInt } from 'crypto';

export const ACCESS_CODE_LENGTH = 6;
const ACCESS_CODE_SPACE = 10 ** ACCESS_CODE_LENGTH;

export function generateAccessCode(): string {
  return formatAccessCode(randomInt(0, ACCESS_CODE_SPACE));
}

export function formatAccessCode(value: number): string {
  return value.toString().padStart(ACCESS_CODE_LENGTH, '0');
}

export function hashAccessCode(accessCode: string, secret: string): string {
  return createHmac('sha256', secret).update(accessCode).digest('hex');
}

/**
 * Patient tokens carry this fingerprint so that revoking or regenerating the
 * PIN invalidates every token issued for the previous PIN.
 */
export function credentialVersionOf(accessCodeHash: string): string {
  return createHash('sha256')
    .update(accessCodeHash)
    .digest('base64url')
    .slice(0, 16);
}

export function allAccessCodes(): Iterable<string> {
  return (function* () {
    for (let value = 0; value < ACCESS_CODE_SPACE; value++) {
      yield formatAccessCode(value);
    }
  })();
}
