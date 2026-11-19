'use server';

import { cookies } from 'next/headers';
import { LOCALE_COOKIE, resolveLocale } from './config';

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

export async function setUserLocale(locale: string) {
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, resolveLocale(locale), {
    path: '/',
    maxAge: ONE_YEAR_IN_SECONDS,
    sameSite: 'lax',
  });
}
