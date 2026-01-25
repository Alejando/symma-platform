import { auth } from '@/auth';

export default async function DashboardPage() {
  const session = await auth();
  const firstName = session?.user?.name?.split(' ')[0] || 'Doctor';
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Active Patients */}
        <div className="bg-white rounded-xl p-6 border border-[#e7f3f2] shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-[#0d9488]/5 to-transparent"></div>
          <div className="flex justify-between items-start z-10">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Patients</p>
              <h3 className="text-3xl font-bold text-[#0d1b1a] mt-2">42</h3>
            </div>
            <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">trending_up</span> +4%
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-auto z-10">vs. last month</p>
        </div>

        {/* Compliance Alerts */}
        <div className="bg-white rounded-xl p-6 border border-red-100 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden ring-1 ring-[#E11D48]/10">
          <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-[#E11D48]/5 to-transparent"></div>
          <div className="flex justify-between items-start z-10">
            <div>
              <p className="text-sm font-medium text-gray-500">Compliance Alerts</p>
              <h3 className="text-3xl font-bold text-[#E11D48] mt-2">
                3 <span className="text-base font-normal text-gray-400">Patients</span>
              </h3>
            </div>
            <div className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center text-[#E11D48]">
              <span className="material-symbols-outlined">warning</span>
            </div>
          </div>
          <p className="text-xs text-[#E11D48] font-medium mt-auto z-10 flex items-center gap-1">
            Action Required
          </p>
        </div>

        {/* Avg Efficacy */}
        <div className="bg-white rounded-xl p-6 border border-[#e7f3f2] shadow-sm flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-[#0d9488]/5 to-transparent"></div>
          <div className="flex justify-between items-start z-10">
            <div>
              <p className="text-sm font-medium text-gray-500">Avg. Efficacy Score</p>
              <h3 className="text-3xl font-bold text-[#0d1b1a] mt-2">88%</h3>
            </div>
            <span className="bg-[#0d9488]/10 text-[#0d9488] text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">show_chart</span> +2%
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-auto">
            <div className="bg-[#0d9488] h-1.5 rounded-full" style={{ width: '88%' }}></div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-[#e7f3f2] shadow-sm p-6">
        <h3 className="font-bold text-lg text-[#0d1b1a] mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg border border-[#e7f3f2] hover:border-[#0d9488]/50 hover:bg-[#0d9488]/5 transition-all group h-24">
            <span className="material-symbols-outlined text-[#0d9488] group-hover:scale-110 transition-transform">person_add</span>
            <span className="text-xs font-medium text-gray-700">Add Patient</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg border border-[#e7f3f2] hover:border-[#0d9488]/50 hover:bg-[#0d9488]/5 transition-all group h-24">
            <span className="material-symbols-outlined text-[#0d9488] group-hover:scale-110 transition-transform">calendar_add_on</span>
            <span className="text-xs font-medium text-gray-700">Schedule</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg border border-[#e7f3f2] hover:border-[#0d9488]/50 hover:bg-[#0d9488]/5 transition-all group h-24">
            <span className="material-symbols-outlined text-[#0d9488] group-hover:scale-110 transition-transform">monitor_heart</span>
            <span className="text-xs font-medium text-gray-700">Log Vitals</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg border border-[#e7f3f2] hover:border-[#0d9488]/50 hover:bg-[#0d9488]/5 transition-all group h-24">
            <span className="material-symbols-outlined text-[#0d9488] group-hover:scale-110 transition-transform">mail</span>
            <span className="text-xs font-medium text-gray-700">Message</span>
          </button>
        </div>
      </div>
    </div>
  );
}
