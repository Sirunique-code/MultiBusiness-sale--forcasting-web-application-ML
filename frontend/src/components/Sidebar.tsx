'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  UploadCloud, 
  TrendingUp, 
  History, 
  Layers,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, activeBusiness } = useAuth();

  const navItems = [
    {
      name: 'Dashboard Overview',
      href: '/',
      icon: LayoutDashboard,
    },
    {
      name: 'Upload CSV Data',
      href: '/upload',
      icon: UploadCloud,
    },
    {
      name: '90-Day Forecast',
      href: '/forecast',
      icon: TrendingUp,
    },
    {
      name: 'Audit History',
      href: '/history',
      icon: History,
    },
    ...(user?.is_admin
      ? [
          {
            name: 'Admin Panel & Evaluation',
            href: '/admin',
            icon: ShieldCheck,
          },
        ]
      : []),
  ];

  return (
    <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col p-4">
      {/* Active Business Info Card */}
      {activeBusiness ? (
        <div className="mb-6 p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-slate-50 to-purple-50/50 border border-indigo-100 shadow-xs">
          <div className="flex items-center space-x-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <Layers className="h-3.5 w-3.5" />
            <span>Active Model Profile</span>
          </div>
          <h3 className="font-bold text-slate-900 text-sm truncate">{activeBusiness.name}</h3>
          <p className="text-xs text-slate-500 truncate">{activeBusiness.industry}</p>
        </div>
      ) : (
        <div className="mb-6 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
          No active business selected
        </div>
      )}

      {/* Navigation Items */}
      <nav className="space-y-1 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-500">
        <p className="font-semibold text-slate-700">Isolated Random Forest Regressor</p>
        <p className="text-slate-500 mt-0.5">Per-business dataset & model sandbox</p>
      </div>
    </aside>
  );
}

