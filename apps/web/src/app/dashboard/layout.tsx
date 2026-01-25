import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Sidebar, Header } from '@/components/layout/sidebar';

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
      <Sidebar userName={userName} userRole={userRole} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <Header userName={userName} userRole={userRole} />

        {/* Scrollable Content Area - Add top padding on mobile for fixed header */}
        <div className="flex-1 overflow-y-auto bg-[#f6f8f8] p-4 md:p-8 pt-20 lg:pt-4 md:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
