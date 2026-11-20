import { isValidTimeZone } from '../analytics/calendar-days';

const REQUIRED_VARIABLES = [
  'DATABASE_URL',
  'JWT_SECRET',
  'PIN_HMAC_SECRET',
] as const;

export function validateEnvironment(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const missing = REQUIRED_VARIABLES.filter((name) => {
    const value = config[name];
    return typeof value !== 'string' || value.trim() === '';
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }

  const timeZone = config.ANALYTICS_TIME_ZONE;
  if (typeof timeZone === 'string' && timeZone && !isValidTimeZone(timeZone)) {
    throw new Error(
      `ANALYTICS_TIME_ZONE is not an IANA time zone: ${timeZone}`,
    );
  }

  return config;
}
