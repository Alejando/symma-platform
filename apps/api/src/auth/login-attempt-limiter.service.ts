import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

export const MAX_FAILED_LOGIN_ATTEMPTS = 5;
export const FAILED_LOGIN_WINDOW_MS = 15 * 60 * 1000;
const TRACKED_CLIENTS_BEFORE_SWEEP = 10_000;

@Injectable()
export class LoginAttemptLimiter {
  private readonly failuresByClient = new Map<string, number[]>();

  assertAllowed(clientKey: string, now = Date.now()): void {
    if (
      this.recentFailures(clientKey, now).length >= MAX_FAILED_LOGIN_ATTEMPTS
    ) {
      throw new HttpException(
        'errors.auth.tooManyAttempts',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  recordFailure(clientKey: string, now = Date.now()): void {
    if (this.failuresByClient.size >= TRACKED_CLIENTS_BEFORE_SWEEP) {
      this.sweepExpired(now);
    }
    this.failuresByClient.set(clientKey, [
      ...this.recentFailures(clientKey, now),
      now,
    ]);
  }

  reset(clientKey: string): void {
    this.failuresByClient.delete(clientKey);
  }

  private recentFailures(clientKey: string, now: number): number[] {
    const windowStart = now - FAILED_LOGIN_WINDOW_MS;
    return (this.failuresByClient.get(clientKey) ?? []).filter(
      (failedAt) => failedAt > windowStart,
    );
  }

  private sweepExpired(now: number): void {
    for (const clientKey of this.failuresByClient.keys()) {
      if (this.recentFailures(clientKey, now).length === 0) {
        this.failuresByClient.delete(clientKey);
      }
    }
  }
}
