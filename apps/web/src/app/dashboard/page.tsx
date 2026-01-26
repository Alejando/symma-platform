import { auth } from '@/auth';
import { getDashboardStats } from '@/lib/api';
import { DashboardKPIs } from './_components/DashboardKPIs';
import { DashboardActions } from './_components/DashboardActions';
import { RiskList } from './_components/RiskList';

export default async function DashboardPage() {
  const session = await auth();
  const firstName = session?.user?.name?.split(' ')[0] || 'Doctor';
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  let dashboardData = null;

  // Safe access to accessToken with potential type issue fallback
  const accessToken = (session?.user as any)?.accessToken;

  if (accessToken) {
    try {
      dashboardData = await getDashboardStats(accessToken);
    } catch (e) {
      console.error("Failed to fetch dashboard stats", e);
    }
  }

  const metrics = dashboardData?.metrics || {
    activePatients: { value: 0, trend: 0 },
    complianceAlerts: { value: 0, trend: 0 },
    avgEfficacy: { value: 0, trend: 0 }
  };

  const atRiskPatients = dashboardData?.atRiskPatients || [];

  return (
    <div className="max-w-[1200px] mx-auto flex flex-col gap-8 pb-10">
      {/* Page Heading */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[#0d1b1a] tracking-tight">
            Good Morning, {firstName}
          </h2>
          <p className="text-[#4c9a93] mt-1 font-medium">
            Here&apos;s what&apos;s happening with your patients today.
          </p>
        </div>
        <div className="flex items-center gap-2 text-gray-500 bg-white px-4 py-2 rounded-lg border border-[#e7f3f2] shadow-sm">
          <span className="material-symbols-outlined text-sm">calendar_today</span>
          <span className="text-sm font-medium">{currentDate}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <DashboardKPIs metrics={metrics} />

      {/* Quick Actions */}
      <DashboardActions />

      {/* Risk Widget */}
      <RiskList patients={atRiskPatients} />
    </div>
  );
}
