import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import UserMenu from '../../components/dashboard/DropdownProfile';

import { useUser } from '../../context/UserContext';

function Header({
  sidebarOpen,
  setSidebarOpen,
  variant = 'default',
}) {
  const { user: authUser } = useAuth();
  const { user: profileUser } = useUser();

  return (
    <header className={`sticky top-0 before:absolute before:inset-0 before:backdrop-blur-md max-lg:before:bg-white/90 dark:max-lg:before:bg-gray-800/90 before:-z-10 z-30 ${variant === 'v2' || variant === 'v3' ? 'before:bg-white after:absolute after:h-px after:inset-x-0 after:top-full after:bg-gray-200 dark:after:bg-gray-700/60 after:-z-10' : 'max-lg:shadow-xs lg:before:bg-gray-100/90 dark:lg:before:bg-gray-900/90'} ${variant === 'v2' ? 'dark:before:bg-gray-800' : ''} ${variant === 'v3' ? 'dark:before:bg-gray-900' : ''}`}>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between h-16 ${variant === 'v2' || variant === 'v3' ? '' : 'lg:border-b border-gray-200 dark:border-gray-700/60'}`}>

          {/* Header: Left side */}
          <div className="flex">
            {/* Hamburger button */}
            <button
              className="text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 lg:hidden"
              aria-controls="sidebar"
              aria-expanded={sidebarOpen}
              onClick={(e) => { e.stopPropagation(); setSidebarOpen(!sidebarOpen); }}
            >
              <span className="sr-only">Open sidebar</span>
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="5" width="16" height="2" />
                <rect x="4" y="11" width="16" height="2" />
                <rect x="4" y="17" width="16" height="2" />
              </svg>
            </button>
          </div>

          {/* Header: Right side */}
          <div className="flex items-center gap-4">
            
            {/* User Account Info */}
            <div className="hidden md:flex flex-col items-end leading-tight">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[180px]">
                {profileUser?.name || authUser?.email || 'User'}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${profileUser?.plan === 'free' ? 'bg-slate-400' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}></div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-violet-600 dark:text-violet-400">
                  {profileUser?.plan ? `${profileUser.plan} Plan` : 'Loading...'}
                </span>
              </div>
            </div>

            {/* New Generation Button */}
            <Link 
              to="/app/generate" 
              className="flex items-center px-4 py-2 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-semibold transition-all duration-200 shadow-md shadow-violet-500/20 border border-violet-400/20 group active:scale-[0.98]"
            >
              <Sparkles className="size-4 mr-2 text-violet-200 group-hover:rotate-12 transition-transform" />
              <span className="hidden sm:inline">New Generation</span>
            </Link>

            <div className="flex items-center gap-2">
              <UserMenu align="right" />
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}

export default Header;