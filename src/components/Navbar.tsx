'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { 
  Building2, 
  Plus, 
  ChevronDown, 
  LogOut, 
  Check,
  Briefcase,
  ShieldCheck
} from 'lucide-react';
import BusinessModal from './BusinessModal';

export default function Navbar() {
  const { user, activeBusiness, businesses, selectBusiness, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 text-slate-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Brand Title */}
            <div className="flex items-center">
              <Link href="/" className="font-bold text-lg text-slate-900 tracking-tight hover:text-indigo-600 transition-colors">
                Sales Forecasting
              </Link>
            </div>

            {/* Middle: Active Business Selector */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-indigo-300 text-slate-700 px-3.5 py-2 rounded-xl text-sm font-medium transition-all shadow-xs"
                >
                  <Building2 className="h-4 w-4 text-indigo-600" />
                  <span className="max-w-[150px] sm:max-w-[200px] truncate font-semibold text-slate-900">
                    {activeBusiness ? activeBusiness.name : 'Select Business'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-slate-400 ml-1" />
                </button>

                {isDropdownOpen && (
                  <div 
                    className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    onMouseLeave={() => setIsDropdownOpen(false)}
                  >
                    <div className="px-3.5 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Switch Business Profile
                    </div>

                    <div className="max-h-60 overflow-y-auto py-1">
                      {businesses.length === 0 ? (
                        <div className="px-3.5 py-2 text-xs text-slate-500 italic">
                          No business profiles found
                        </div>
                      ) : (
                        businesses.map((b) => (
                          <button
                            key={b.id}
                            onClick={() => {
                              selectBusiness(b);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3.5 py-2 text-sm flex items-center justify-between hover:bg-slate-50 transition-colors ${
                              activeBusiness?.id === b.id ? 'text-indigo-600 bg-indigo-50/60 font-semibold' : 'text-slate-700'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5 truncate">
                              <Briefcase className="h-4 w-4 text-slate-400 flex-shrink-0" />
                              <div className="truncate">
                                <p className="truncate font-medium text-slate-900">{b.name}</p>
                                <p className="text-xs text-slate-500">{b.industry}</p>
                              </div>
                            </div>
                            {activeBusiness?.id === b.id && (
                              <Check className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                            )}
                          </button>
                        ))
                      )}
                    </div>

                    {/* Create Business Option */}
                    <div className="border-t border-slate-100 mt-1 pt-1 px-2">
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setIsModalOpen(true);
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Create New Business Profile</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Right: User Profile & Actions */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-slate-700 hover:text-slate-900 px-2 py-1.5 rounded-lg text-sm transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs">
                    {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="hidden md:inline font-medium text-slate-700">{user.full_name}</span>
                  {user.is_admin && (
                    <span className="hidden sm:inline-flex items-center text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.2 rounded-md">
                      Admin
                    </span>
                  )}
                </button>

                {isUserMenuOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50"
                    onMouseLeave={() => setIsUserMenuOpen(false)}
                  >
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-900 truncate">{user.full_name}</p>
                        {user.is_admin && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded-md">
                            <ShieldCheck className="h-3 w-3" /> Admin
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{user.email}</p>
                    </div>

                    {user.is_admin && (
                      <div className="px-2 py-1 border-b border-slate-100">
                        <Link
                          href="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 border border-indigo-200 transition-colors"
                        >
                          <ShieldCheck className="h-4 w-4 text-indigo-600" />
                          <span>Admin Control Panel</span>
                        </Link>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center space-x-2 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors font-medium"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-4 py-2 rounded-xl hover:bg-slate-100 transition-all border border-slate-200"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl transition-all shadow-sm"
                >
                  Register Account
                </Link>
              </div>
            )}

          </div>
        </div>
      </header>

      {/* Create Business Modal */}
      {user && (
        <BusinessModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
}


