import { spawnSync } from 'child_process';
import { join } from 'path';

describe('API startup (e2e)', () => {
  const startApi = (overrides: Record<string, string>) =>
    spawnSync(
      process.execPath,
      ['-r', 'ts-node/register/transpile-only', join('src', 'main.ts')],
      {
        cwd: join(__dirname, '..'),
        env: { ...process.env, PORT: '0', ...overrides },
        encoding: 'utf8',
        timeout: 60_000,
      },
    );

  it.each(['JWT_SECRET', 'PIN_HMAC_SECRET'])(
    'refuses to start without %s',
    (name) => {
      const result = startApi({ [name]: '' });

      expect(result.error).toBeUndefined();
      expect(result.status).not.toBe(0);
      expect(result.stderr + result.stdout).toContain(name);
    },
    70_000,
  );
});
