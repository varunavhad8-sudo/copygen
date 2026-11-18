import React, { useState, useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  Sparkles, 
  FileText, 
  Mic, 
  Users, 
  LayoutTemplate, 
  BarChart2, 
  Settings,
  ChevronLeft,
  Shield
} from 'lucide-react';
import { useAuth } from "../../context/AuthContext";

import SidebarLinkGroup from "./SidebarLinkGroup";

function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  variant = 'default',
}) {
  const { user } = useAuth();
  const location = useLocation();
  const { pathname } = location;

  const trigger = useRef(null);
  const sidebar = useRef(null);

  const storedSidebarExpanded = localStorage.getItem("sidebar-expanded");
  const [sidebarExpanded, setSidebarExpanded] = useState(storedSidebarExpanded === null ? false : storedSidebarExpanded === "true");

  // close on click outside
  useEffect(() => {
    const clickHandler = ({ target }) => {
      if (!sidebar.current || !trigger.current) return;
      if (!sidebarOpen || sidebar.current.contains(target) || trigger.current.contains(target)) return;
      setSidebarOpen(false);
    };
    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  });

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }) => {
      if (!sidebarOpen || keyCode !== 27) return;
      setSidebarOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  });

  useEffect(() => {
    localStorage.setItem("sidebar-expanded", sidebarExpanded);
    if (sidebarExpanded) {
      document.querySelector("body").classList.add("sidebar-expanded");
    } else {
      document.querySelector("body").classList.remove("sidebar-expanded");
    }
  }, [sidebarExpanded]);

  // Admin access is determined server-side via the user's isAdmin flag
  const isAdmin = !!user?.isAdmin;

  const navItems = [
    { name: 'Analytics', path: '/app/analytics', icon: BarChart2 },
    { name: 'Generate', path: '/app/generate', icon: Sparkles },
    { name: 'Outputs', path: '/app/outputs', icon: FileText },
    { name: 'Brand Voice', path: '/app/brand-voice', icon: Mic },
    { name: 'Clients', path: '/app/clients', icon: Users },
    { name: 'Templates', path: '/app/templates', icon: LayoutTemplate },
    ...(isAdmin ? [{ name: 'Admin Panel', path: '/app/admin', icon: Shield }] : []),
    { name: 'Settings', path: '/app/settings', icon: Settings },
  ];

  const filteredNavItems = navItems;

  return (
    <div className="min-w-fit">
      {/* Sidebar backdrop (mobile only) */}
      <div
        className={`fixed inset-0 bg-gray-900 bg-opacity-30 z-40 lg:hidden lg:z-auto transition-opacity duration-200 ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      ></div>

      {/* Sidebar */}
      <div
        id="sidebar"
        ref={sidebar}
        className={`flex flex-col absolute z-40 left-0 top-0 lg:static lg:left-auto lg:top-auto lg:translate-x-0 h-[100dvh] overflow-y-scroll lg:overflow-y-auto no-scrollbar w-64 lg:w-20 lg:sidebar-expanded:!w-64 2xl:!w-64 shrink-0 bg-white dark:bg-gray-800 p-4 transition-all duration-200 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-64"
        } ${variant === 'v2' ? 'border-r border-gray-200 dark:border-gray-700/60' : 'shadow-sm'}`}
      >
        {/* Sidebar header */}
        <div className="flex justify-between mb-10 pr-3 sm:px-2">
          {/* Close button (mobile only) */}
          <button
            ref={trigger}
            className="lg:hidden text-gray-500 hover:text-gray-400"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-controls="sidebar"
            aria-expanded={sidebarOpen}
          >
            <span className="sr-only">Close sidebar</span>
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.7 18.7l1.4-1.4L7.8 13H20v-2H7.8l4.3-4.3-1.4-1.4L4 12z" />
            </svg>
          </button>
          {/* Logo */}
          <NavLink end to="/" className="block">
            <div className="flex items-center">
              <span className="text-white font-bold text-xl tracking-tight">CopyGen</span>
              <span className="text-violet-500 font-medium text-sm ml-0.5 opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 transition-opacity duration-200">.in</span>
            </div>
          </NavLink>
        </div>

        {/* Links */}
        <div className="space-y-8 flex-1 flex flex-col">
          {/* Pages group */}
          <div className="flex-1">
            <ul className="mt-3">
              {navItems.map((item) => (
                <li key={item.path} className="mb-1 last:mb-0 relative">
                  <NavLink
                    end
                    to={item.path}
                    className={({ isActive }) =>
                      `block transition duration-150 truncate rounded-lg ${
                        isActive 
                          ? 'text-violet-500 bg-violet-500/5 dark:bg-violet-500/10 shadow-[0_0_15px_rgba(139,92,246,0.1)] border border-violet-500/20' 
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-transparent'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center justify-between p-2">
                          <div className="flex items-center">
                            <item.icon className={`shrink-0 size-5 ${isActive ? 'text-violet-500' : 'text-gray-400 dark:text-gray-500'}`} />
                            <span className="text-sm font-medium ml-4 lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                              {item.name}
                            </span>
                          </div>
                        </div>
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-violet-500 rounded-r-full"></div>
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Expand / collapse button */}
        <div className="pt-3 hidden lg:inline-flex 2xl:hidden justify-end mt-auto">
          <div className="w-12 pl-4 pr-3 py-2">
            <button className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400" onClick={() => setSidebarExpanded(!sidebarExpanded)}>
              <span className="sr-only">Expand / collapse sidebar</span>
              <ChevronLeft className={`size-5 transition-transform duration-200 ${!sidebarExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
