import { auth } from '@/auth';
import { getDashboardStatsForCurrentUser } from '@/lib/server/api';
import { AuthenticationError, describeApiError } from '@/lib/errors';
import { getFormatter, getTranslations } from 'next-intl/server';
import type { DashboardStatsResponse } from '@symma/shared-types';
import { ErrorAlert } from '@/components/ui/error-alert';
import { SessionExpired } from '@/components/auth/session-expired';
import { DashboardKPIs } from './_components/DashboardKPIs';
import { DashboardActions } from './_components/DashboardActions';
import { RiskList } from './_components/RiskList';

type DashboardStatsResult =
  | { status: 'loaded'; stats: DashboardStatsResponse }
  | { status: 'sessionExpired' }
  | { status: 'failed'; error: unknown };

async function loadDashboardStats(): Promise<DashboardStatsResult> {
  try {
    return { status: 'loaded', stats: await getDashboardStatsForCurrentUser() };
  } catch (error) {
    if (error instanceof AuthenticationError) return { status: 'sessionExpired' };
    return { status: 'failed', error };
  }
}

export default async function DashboardPage() {
  const session = await auth();
  const t = await getTranslations('common');
  const tErrors = await getTranslations('errors');
  const format = await getFormatter();
  const firstName = session?.user?.name?.split(' ')[0] ?? '';

  const currentDate = format.dateTime(new Date(), {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.goodMorning', { name: firstName });
    if (hour < 18) return t('dashboard.goodAfternoon', { name: firstName });
    return t('dashboard.goodEvening', { name: firstName });
  };

  const result = await loadDashboardStats();

  if (result.status === 'sessionExpired') {
    return <SessionExpired />;
  }

  return (
    <div className="max-w-[1200px] mx-auto flex flex-col gap-8 pb-10">
      {/* Page Heading */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[#0d1b1a] tracking-tight">
            {getGreeting()}
          </h2>
          <p className="text-brand-muted mt-1 font-medium">
            {t('dashboard.whatsHappening')}
          </p>
        </div>
        <div className="flex items-center gap-2 text-gray-500 bg-white px-4 py-2 rounded-lg border border-[#e7f3f2] shadow-sm">
          <span className="material-symbols-outlined text-sm">calendar_today</span>
          <span className="text-sm font-medium">{currentDate}</span>
        </div>
      </div>

      {result.status === 'loaded' ? (
        <DashboardKPIs metrics={result.stats.metrics} />
      ) : (
        <ErrorAlert message={describeApiError(result.error, (key) => tErrors(key))} />
      )}

      <DashboardActions />

      {result.status === 'loaded' && <RiskList patients={result.stats.atRiskPatients} />}
    </div>
  );
}
