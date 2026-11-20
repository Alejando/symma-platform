import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

const SECTIONS = ['controller', 'data', 'purpose', 'transfers', 'rights', 'changes'] as const;

export async function generateMetadata() {
  const t = await getTranslations('common.privacy');
  return { title: t('title') };
}

export default async function PrivacyNoticePage() {
  const t = await getTranslations('common.privacy');

  return (
    <main className="min-h-screen bg-[#f6f8f8] px-4 py-10">
      <article className="mx-auto max-w-3xl rounded-xl border border-slate-100 bg-white p-8 shadow-sm space-y-6">
        <h1 className="text-3xl font-bold text-[#0d1b1a]">{t('title')}</h1>
        <p className="text-gray-700">{t('intro')}</p>
        {SECTIONS.map((section) => (
          <section key={section} className="space-y-2">
            <h2 className="text-lg font-semibold text-[#0d1b1a]">{t(`${section}Title`)}</h2>
            <p className="text-gray-700">{t(section)}</p>
          </section>
        ))}
        <Link href="/" className="inline-block text-sm font-semibold text-brand hover:text-brand-hover">
          {t('back')}
        </Link>
      </article>
    </main>
  );
}
