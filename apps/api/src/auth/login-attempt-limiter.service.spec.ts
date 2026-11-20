import { HttpException, HttpStatus } from '@nestjs/common';
import {
  FAILED_LOGIN_WINDOW_MS,
  LoginAttemptLimiter,
  MAX_FAILED_LOGIN_ATTEMPTS,
} from './login-attempt-limiter.service';

describe('LoginAttemptLimiter', () => {
  const client = '203.0.113.7';
  const start = 1_000_000;

  const failTimes = (limiter: LoginAttemptLimiter, times: number) => {
    for (let attempt = 0; attempt < times; attempt++) {
      limiter.recordFailure(client, start + attempt);
    }
  };

  const statusOf = (call: () => void) => {
    try {
      call();
      return 'allowed';
    } catch (error) {
      return (error as HttpException).getStatus();
    }
  };

  it('blocks a client after 5 failures within 15 minutes', () => {
    const limiter = new LoginAttemptLimiter();
    failTimes(limiter, MAX_FAILED_LOGIN_ATTEMPTS - 1);
    expect(statusOf(() => limiter.assertAllowed(client, start + 10))).toBe(
      'allowed',
    );

    limiter.recordFailure(client, start + 10);

    expect(statusOf(() => limiter.assertAllowed(client, start + 20))).toBe(
      HttpStatus.TOO_MANY_REQUESTS,
    );
  });

  it('forgets failures older than the window', () => {
    const limiter = new LoginAttemptLimiter();
    failTimes(limiter, MAX_FAILED_LOGIN_ATTEMPTS);

    expect(
      statusOf(() =>
        limiter.assertAllowed(client, start + FAILED_LOGIN_WINDOW_MS + 10),
      ),
    ).toBe('allowed');
  });

  it('counts each client separately', () => {
    const limiter = new LoginAttemptLimiter();
    failTimes(limiter, MAX_FAILED_LOGIN_ATTEMPTS);

    expect(statusOf(() => limiter.assertAllowed('198.51.100.1', start))).toBe(
      'allowed',
    );
  });

  it('clears the count after a successful login', () => {
    const limiter = new LoginAttemptLimiter();
    failTimes(limiter, MAX_FAILED_LOGIN_ATTEMPTS - 1);

    limiter.reset(client);
    limiter.recordFailure(client, start + 100);

    expect(statusOf(() => limiter.assertAllowed(client, start + 200))).toBe(
      'allowed',
    );
  });
});
