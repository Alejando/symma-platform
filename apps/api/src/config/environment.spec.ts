import { validateEnvironment } from './environment';

describe('validateEnvironment', () => {
  const completeEnvironment = {
    DATABASE_URL: 'postgresql://localhost/db',
    JWT_SECRET: 'jwt-secret',
    PIN_HMAC_SECRET: 'pin-secret',
  };

  it('accepts an environment with every required secret', () => {
    expect(validateEnvironment(completeEnvironment)).toEqual(
      completeEnvironment,
    );
  });

  it.each(['JWT_SECRET', 'PIN_HMAC_SECRET', 'DATABASE_URL'])(
    'refuses to start without %s',
    (name) => {
      expect(() =>
        validateEnvironment({ ...completeEnvironment, [name]: undefined }),
      ).toThrow(name);
    },
  );

  it('rejects an unknown analytics time zone', () => {
    expect(() =>
      validateEnvironment({
        ...completeEnvironment,
        ANALYTICS_TIME_ZONE: 'Mars/Olympus',
      }),
    ).toThrow('ANALYTICS_TIME_ZONE');
  });

  it('treats a blank secret as missing', () => {
    expect(() =>
      validateEnvironment({ ...completeEnvironment, JWT_SECRET: '  ' }),
    ).toThrow('JWT_SECRET');
  });
});
