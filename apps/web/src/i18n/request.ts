import { getRequestConfig } from 'next-intl/server';
import { getMessages, defaultLocale } from './config';

export default getRequestConfig(async () => {
  // Try to get locale from headers or cookies if needed, or default to Spanish
  const locale = defaultLocale;
  
  const messages = await getMessages(locale);

  return {
    locale,
    messages,
    onError(error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Missing translation:', error.message);
      }
    },
    getMessageFallback({ key }) {
      return key;
    }
  };
});
