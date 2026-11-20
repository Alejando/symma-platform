export class AuthenticationError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class NetworkError extends Error {
  constructor(cause?: unknown) {
    super('The portal could not be reached', { cause });
    this.name = 'NetworkError';
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

export async function throwIfNotOk(response: Response): Promise<void> {
  if (response.status === 401) {
    throw new AuthenticationError();
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(response.status, extractApiMessage(body));
  }
}

type ErrorsTranslator = (key: 'auth.forbidden' | 'server.internalError' | 'network.offline' | 'generic') => string;

export function describeApiError(error: unknown, t: ErrorsTranslator): string {
  if (error instanceof ApiError) {
    if (error.status >= 500) return t('server.internalError');
    if (error.message) return error.message;
    return error.status === 403 ? t('auth.forbidden') : t('server.internalError');
  }

  if (error instanceof NetworkError) {
    return t('network.offline');
  }

  return t('generic');
}
