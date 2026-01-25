import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { signOut } from '@/auth';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const userName = session.user.name || 'User';
  const userRole = session.user.role === 'ADMIN' ? 'Administrator' : 'Therapist';

  return (
    <div className="flex h-screen w-full font-display text-[#0d1b1a] bg-[#f6f8f8] antialiased overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-[#e7f3f2] bg-white flex flex-col justify-between">
        <div className="flex flex-col gap-4 p-6">
          <div className="flex flex-col mb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-[#0d9488] text-3xl">medical_services</span>
              <h1 className="text-[#0d1b1a] text-xl font-bold leading-normal tracking-tight">Symma</h1>
            </div>
            <p className="text-[#4c9a93] text-xs font-medium uppercase tracking-wider pl-10">Therapist Portal</p>
          </div>
          <nav className="flex flex-col gap-1">
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#0d9488]/10 text-[#0d9488] transition-colors" href="/dashboard">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
              <span className="text-sm font-semibold">Dashboard</span>
            </a>
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors group" href="#">
              <span className="material-symbols-outlined group-hover:text-[#0d9488] transition-colors">group</span>
              <span className="text-sm font-medium">Patients</span>
            </a>
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors group" href="#">
              <span className="material-symbols-outlined group-hover:text-[#0d9488] transition-colors">calendar_month</span>
              <span className="text-sm font-medium">Calendar</span>
            </a>
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors group" href="#">
              <span className="material-symbols-outlined group-hover:text-[#0d9488] transition-colors">analytics</span>
              <span className="text-sm font-medium">Analytics</span>
            </a>
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors group" href="#">
              <span className="material-symbols-outlined group-hover:text-[#0d9488] transition-colors">settings</span>
              <span className="text-sm font-medium">Settings</span>
            </a>
          </nav>
        </div>
        <div className="p-6 border-t border-[#e7f3f2]">
          <form
            action={async () => {
              'use server';
              await signOut({ redirectTo: '/login' });
            }}
          >
            <button
              type="submit"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 text-gray-600 hover:text-red-600 transition-colors group w-full"
            >
              <span className="material-symbols-outlined group-hover:text-red-600 transition-colors">logout</span>
              <span className="text-sm font-medium">Log Out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Navigation */}
        <header className="flex items-center justify-between border-b border-[#e7f3f2] bg-white px-8 py-4 h-18 shrink-0">
          <div className="w-full max-w-md">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-gray-400 group-focus-within:text-[#0d9488] transition-colors">search</span>
              </div>
              <input
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#0d9488] focus:border-[#0d9488] sm:text-sm transition duration-150 ease-in-out"
                placeholder="Search patients, appointments..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500 transition duration-150 ease-in-out rounded-full hover:bg-gray-100">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-[#E11D48] ring-2 ring-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-900 leading-none">{userName}</p>
                <p className="text-xs text-gray-500 mt-1">{userRole}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-[#0d9488]/20 flex items-center justify-center ring-2 ring-[#0d9488]/20">
                <span className="text-[#0d9488] font-bold text-sm">
                  {userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto bg-[#f6f8f8] p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
