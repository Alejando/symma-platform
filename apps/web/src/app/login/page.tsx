'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/i18n/language-switcher';

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations('common');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(t('messages.invalidCredentials'));
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError(t('messages.errorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f6f8f8] min-h-screen flex flex-col items-center justify-center p-4 font-display antialiased">
      <div className="layout-container flex w-full justify-center">
        {/* Central Login Card */}
        <div className="w-full max-w-[440px] flex flex-col bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden">
          <LanguageSwitcher className="self-end px-6 pt-4" />
          {/* Brand / Header Section */}
          <div className="px-8 pt-6 pb-6 flex flex-col items-center text-center gap-4">
            {/* Logo mark */}
            <div className="w-12 h-12 rounded-lg bg-brand/10 flex items-center justify-center text-brand mb-2">
              <span className="material-symbols-outlined text-[28px]">medical_services</span>
            </div>
            {/* Page Heading */}
            <div className="flex flex-col gap-2">
              <p className="text-[#0d1b1a] tracking-tight text-[28px] font-bold leading-tight">
                {t('login.welcomeBack')}
              </p>
              <p className="text-brand-muted text-sm font-normal leading-normal max-w-[280px] mx-auto">
                {t('login.enterCredentials')}
              </p>
            </div>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="px-8 pb-10 flex flex-col gap-5">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Email TextField */}
            <div className="flex flex-col gap-1.5">
              <label className="flex flex-col min-w-40 flex-1">
                <p className="text-[#0d1b1a] text-sm font-medium leading-normal pb-2">
                  {t('labels.emailAddress')}
                </p>
                <input
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#0d1b1a] focus:outline-0 focus:ring-2 focus:ring-brand/20 border border-[#cfe7e5] bg-[#f8fcfb] focus:border-brand h-12 placeholder:text-brand-muted/70 p-[15px] text-base font-normal leading-normal transition-all"
                  placeholder={t('login.emailPlaceholder')}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </label>
            </div>

            {/* Password TextField */}
            <div className="flex flex-col gap-1.5">
              <label className="flex flex-col min-w-40 flex-1">
                <p className="text-[#0d1b1a] text-sm font-medium leading-normal pb-2">
                  {t('labels.password')}
                </p>
                <div className="relative flex w-full flex-1 items-stretch rounded-lg group">
                  <input
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#0d1b1a] focus:outline-0 focus:ring-2 focus:ring-brand/20 border border-[#cfe7e5] bg-[#f8fcfb] focus:border-brand h-12 placeholder:text-brand-muted/70 p-[15px] pr-12 text-base font-normal leading-normal transition-all"
                    placeholder={t('login.enterPassword')}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute right-0 top-0 bottom-0 pr-3 text-brand-muted hover:text-brand hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </Button>
                </div>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-brand hover:bg-brand-hover disabled:bg-brand/50 text-white text-sm font-bold tracking-[0.015em] shadow-md shadow-brand/20"
              >
                {loading ? t('buttons.signingIn') : t('buttons.signIn')}
              </Button>
            </div>

            <div className="flex items-center justify-center pt-2">
              <Link
                className="text-sm font-semibold text-brand hover:text-brand-hover transition-colors"
                href="/privacy"
              >
                {t('privacy.link')}
              </Link>
            </div>
          </form>

          {/* Aesthetic Bottom Border */}
          <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-brand/40 to-transparent opacity-50"></div>
        </div>

        {/* Background Elements for Atmosphere */}
        <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] rounded-full bg-brand/5 blur-[100px]"></div>
          <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] rounded-full bg-brand/5 blur-[80px]"></div>
        </div>
      </div>
    </div>
  );
}
