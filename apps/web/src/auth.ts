import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

import { storeApiCredentials, toClientSession } from '@/lib/auth-session';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const response = await fetch(`${API_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            return null;
          }

          const data = await response.json();

          const profileResponse = await fetch(`${API_URL}/api/v1/auth/profile`, {
            headers: {
              Authorization: `Bearer ${data.accessToken}`,
            },
          });

          if (!profileResponse.ok) {
            return null;
          }

          const profile = await profileResponse.json();

          return {
            id: profile.id,
            email: profile.email,
            name: `${profile.firstName} ${profile.lastName}`,
            accessToken: data.accessToken,
            role: profile.role,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    jwt: ({ token, user }) => storeApiCredentials(token, user),
    session: ({ session, token }) => toClientSession(session, token),
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.AUTH_SECRET,
});
