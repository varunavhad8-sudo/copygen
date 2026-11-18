import {
  Sparkles, FileText, Mic, Building2,
  LayoutTemplate, BarChart2, Settings,
  LogOut, ChevronRight, ChevronLeft, Shield, X
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ collapsed, setCollapsed, isMobile, onMenuToggle }) => {
  const { user, logout } = useAuth();

  // Admin access is determined server-side via the user's isAdmin flag
  const isAdmin = !!user?.isAdmin;

  const navSections = [
    {
      label: null,
      items: [
        { label: 'Analytics', path: '/app/analytics', icon: BarChart2 },
        { label: 'Generate', path: '/app/generate', icon: Sparkles },
        { label: 'Outputs',  path: '/app/outputs',  icon: FileText },
      ]
    },
    {
      label: 'WORKSPACE',
      items: [
        { label: 'Brand Voice', path: '/app/brand-voice',  icon: Mic },
        { label: 'Clients',     path: '/app/clients',      icon: Building2 },
        { label: 'Templates',   path: '/app/templates',    icon: LayoutTemplate },
      ]
    },
    {
      label: 'ACCOUNT',
      items: [
        ...(isAdmin ? [{ label: 'Admin Panel', path: '/app/admin', icon: Shield }] : []),
        { label: 'Settings', path: '/app/settings', icon: Settings },
      ]
    }
  ];

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <aside className="w-full h-full flex flex-col py-5 bg-[#050508] border-r border-[#1e1e2e] overflow-hidden">
      {/* ── LOGO & CONTROLS ─────────────────────────────────────── */}
      <div className={`flex items-center mb-7 px-4 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        <div className="flex flex-col">
          <span className={`font-display text-[#c9a84c] leading-none transition-all duration-300 ${collapsed ? 'text-base' : 'text-xl md:text-2xl'}`}>
            {collapsed ? 'M.' : 'Copygen'}
          </span>
          {!collapsed && (
            <span className="text-[9px] text-[#d1d1e0]/35 font-medium uppercase tracking-[0.25em] mt-1">
              Marketing OS
            </span>
          )}
        </div>

        {isMobile ? (
          <button
            onClick={onMenuToggle}
            className="text-[#d1d1e0]/40 p-1.5 hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        ) : !collapsed ? (
          <button
            onClick={() => setCollapsed(true)}
            className="text-[#d1d1e0]/25 p-1 rounded-lg hover:bg-white/5 transition-colors"
            title="Collapse sidebar"
          >
            <ChevronLeft size={16} />
          </button>
        ) : (
          <button
            onClick={() => setCollapsed(false)}
            className="text-[#d1d1e0]/40 p-1 rounded-lg hover:bg-white/5 transition-colors mt-2"
            title="Expand sidebar"
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* ── NAVIGATION ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 scrollbar-hide">
        {navSections.map((section, sIndex) => (
          <div key={sIndex} className="mb-3">
            {section.label && !collapsed && (
              <div className="text-[9px] font-black text-[#d1d1e0]/25 uppercase tracking-[0.25em] px-3 mb-1.5">
                {section.label}
              </div>
            )}
            {section.label && collapsed && (
              <div className="h-px bg-[#1e1e2e] mx-3 mb-2" />
            )}

            <ul className="list-none m-0 p-0 space-y-0.5">
              {section.items.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) => `
                      flex items-center gap-3 p-2.5 rounded-xl text-[13px] font-medium no-underline transition-all duration-200
                      ${collapsed ? 'justify-center' : 'justify-start'}
                      ${isActive 
                        ? 'bg-[#c9a84c]/10 text-[#f5e6a3] border-l-2 border-[#c9a84c]' 
                        : 'text-[#d1d1e0]/55 border-l-2 border-transparent hover:bg-white/5 hover:text-white'}
                    `}
                  >
                    {({ isActive }) => {
                      const Icon = item.icon;
                      return (
                        <>
                          <Icon
                            size={18}
                            strokeWidth={isActive ? 2.5 : 1.8}
                            className={`shrink-0 ${isActive ? 'text-[#c9a84c]' : 'currentColor'}`}
                          />
                          {!collapsed && (
                            <span className="truncate whitespace-nowrap">
                              {item.label}
                            </span>
                          )}
                        </>
                      );
                    }}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* ── USER PROFILE ────────────────────────────────────────── */}
      <div className="px-2 pt-4 border-t border-[#1e1e2e]">
        <NavLink 
          to="/app/settings"
          className="block no-underline rounded-xl hover:bg-[#c9a84c]/5 transition-all duration-200"
        >
          {collapsed ? (
            <div className="flex justify-center py-1">
              <div className="w-8 h-8 rounded-full bg-[#0d0d14] border border-[#c9a84c]/30 flex items-center justify-center text-[10px] font-black text-[#c9a84c]">
                {initials}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-[#12121a] border border-[#c9a84c]/30 flex items-center justify-center text-[10px] font-black text-[#c9a84c] shrink-0">
                  {initials}
                </div>
                <div className="overflow-hidden">
                  <p className="text-[13px] font-bold text-white m-0 truncate whitespace-nowrap">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-[10px] text-[#d1d1e0]/40 font-medium uppercase tracking-wider mt-0.5">
                    {user?.plan || 'Free'}
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  logout();
                }}
                className="text-[#d1d1e0]/25 p-1.5 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-all"
                title="Logout"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;

