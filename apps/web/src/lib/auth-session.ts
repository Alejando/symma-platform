import type { Session, User } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

import { isTokenExpired } from './auth-utils';

export function storeApiCredentials(token: JWT, user?: User): JWT {
  const nextToken = { ...token };
  if (user) {
    nextToken.accessToken = user.accessToken;
    nextToken.role = user.role;
    nextToken.id = user.id;
  }

  if (nextToken.accessToken && isTokenExpired(nextToken.accessToken)) {
    nextToken.error = 'TokenExpired';
  }

  return nextToken;
}

/** The returned object is what `/api/auth/session` serializes to the browser. */
export function toClientSession(session: Session, token: JWT): Session {
  const clientSession: Session = {
    expires: session.expires,
    user: {
      id: token.id as string,
      name: session.user?.name ?? '',
      email: session.user?.email ?? '',
      role: token.role as string,
    },
  };
  if (token.error) {
    clientSession.error = token.error;
  }
  return clientSession;
}
