import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { isTokenExpired } from './auth-utils';

function createMockJwt(exp: number): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ sub: '123', exp }));
  const signature = 'mock-signature';
  return `${header}.${payload}.${signature}`;
}

describe('isTokenExpired', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-02T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns false for a valid non-expired token', () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    const token = createMockJwt(futureExp);
    expect(isTokenExpired(token)).toBe(false);
  });

  it('returns true for an expired token', () => {
    const pastExp = Math.floor(Date.now() / 1000) - 3600;
    const token = createMockJwt(pastExp);
    expect(isTokenExpired(token)).toBe(true);
  });

  it('returns true for a token expiring exactly now', () => {
    const nowExp = Math.floor(Date.now() / 1000);
    const token = createMockJwt(nowExp);
    expect(isTokenExpired(token)).toBe(true);
  });

  it('returns true for an invalid token format', () => {
    expect(isTokenExpired('invalid-token')).toBe(true);
    expect(isTokenExpired('')).toBe(true);
    expect(isTokenExpired('a.b')).toBe(true);
  });

  it('returns true for a token with invalid base64 payload', () => {
    const token = 'header.!!!invalid-base64!!!.signature';
    expect(isTokenExpired(token)).toBe(true);
  });

  it('returns true for a token with missing exp claim', () => {
    const header = btoa(JSON.stringify({ alg: 'HS256' }));
    const payload = btoa(JSON.stringify({ sub: '123' }));
    const token = `${header}.${payload}.signature`;
    expect(isTokenExpired(token)).toBe(true);
  });
});
