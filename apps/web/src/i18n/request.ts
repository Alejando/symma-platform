import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { getMessages, LOCALE_COOKIE, resolveLocale } from './config';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value);

  return {
    locale,
    messages: await getMessages(locale),
    onError(error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Missing translation:', error.message);
      }
    },
    getMessageFallback({ key }) {
      return key;
    },
  };
});
