export class AuthenticationError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function extractApiMessage(body: unknown): string {
  if (!body || typeof body !== 'object') {
    return '';
  }

  const { message } = body as { message?: unknown };
  if (Array.isArray(message)) {
    return message.filter((part): part is string => typeof part === 'string').join('. ');
  }

  return typeof message === 'string' ? message : '';
}

type ErrorsTranslator = (key: 'auth.forbidden' | 'server.internalError' | 'network.offline' | 'generic') => string;

export function describeApiError(error: unknown, t: ErrorsTranslator): string {
  if (error instanceof ApiError) {
    if (error.status === 403) return t('auth.forbidden');
    if (error.status >= 500 || !error.message) return t('server.internalError');
    return error.message;
  }

  if (error instanceof TypeError) {
    return t('network.offline');
  }

  return t('generic');
}
