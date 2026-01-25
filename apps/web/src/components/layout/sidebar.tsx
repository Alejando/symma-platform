'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

interface SidebarProps {
  userName: string;
  userRole: string;
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/dashboard/patients', label: 'Patients', icon: 'group' },
  // Routines moved to patient profile
  { href: '/dashboard/calendar', label: 'Calendar', icon: 'calendar_month' },
  { href: '/dashboard/analytics', label: 'Analytics', icon: 'analytics' },
  { href: '/dashboard/settings', label: 'Settings', icon: 'settings' },
];

export function Sidebar({ userName, userRole }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-[#e7f3f2] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-gray-600">menu</span>
          </button>
          <span className="material-symbols-outlined text-[#0d9488] text-2xl">medical_services</span>
          <span className="font-bold text-[#0d1b1a]">Symma</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="relative p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100">
            <span className="material-symbols-outlined text-xl">notifications</span>
            <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-[#E11D48] ring-2 ring-white"></span>
          </button>
          <div className="h-8 w-8 rounded-full bg-[#0d9488]/20 flex items-center justify-center">
            <span className="text-[#0d9488] font-bold text-xs">{initials}</span>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 flex-shrink-0 border-r border-[#e7f3f2] bg-white flex flex-col justify-between
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col gap-4 p-6">
          <div className="flex flex-col mb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-[#0d9488] text-3xl">medical_services</span>
              <h1 className="text-[#0d1b1a] text-xl font-bold leading-normal tracking-tight">Symma</h1>
              <button
                onClick={() => setIsOpen(false)}
                className="lg:hidden ml-auto p-1 hover:bg-gray-100 rounded"
              >
                <span className="material-symbols-outlined text-gray-400">close</span>
              </button>
            </div>
            <p className="text-[#4c9a93] text-xs font-medium uppercase tracking-wider pl-10">Therapist Portal</p>
          </div>
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${isActive(item.href)
                  ? 'bg-[#0d9488]/10 text-[#0d9488]'
                  : 'hover:bg-gray-50 text-gray-600'
                  }`}
              >
                <span
                  className={`material-symbols-outlined transition-colors ${isActive(item.href) ? '' : 'group-hover:text-[#0d9488]'
                    }`}
                  style={isActive(item.href) ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                <span className={`text-sm ${isActive(item.href) ? 'font-semibold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="p-6 border-t border-[#e7f3f2]">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 text-gray-600 hover:text-red-600 transition-colors group w-full"
          >
            <span className="material-symbols-outlined group-hover:text-red-600 transition-colors">logout</span>
            <span className="text-sm font-medium">Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export function Header({ userName, userRole }: SidebarProps) {
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <header className="hidden lg:flex items-center justify-between border-b border-[#e7f3f2] bg-white px-8 py-4 h-18 shrink-0">
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
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900 leading-none">{userName}</p>
            <p className="text-xs text-gray-500 mt-1">{userRole}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-[#0d9488]/20 flex items-center justify-center ring-2 ring-[#0d9488]/20">
            <span className="text-[#0d9488] font-bold text-sm">{initials}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
