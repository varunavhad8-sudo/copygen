import { useLocation, Link } from 'react-router-dom';
import { Bell, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ROUTE_META = {
  '/app/generate':    { title: 'Generate',    crumb: 'Copygen / Generate' },
  '/app/outputs':     { title: 'Outputs',     crumb: 'Copygen / Outputs' },
  '/app/brand-voice': { title: 'Brand Voice', crumb: 'Workspace / Brand Voice' },
  '/app/clients':     { title: 'Clients',     crumb: 'Workspace / Clients' },
  '/app/templates':   { title: 'Templates',   crumb: 'Workspace / Templates' },
  '/app/analytics':   { title: 'Analytics',   crumb: 'Insights / Analytics' },
  '/app/settings':    { title: 'Settings',    crumb: 'Account / Settings' },
};

const Topbar = ({ mobileOpen, onMobileMenuToggle }) => {
  const location = useLocation();
  const { user } = useAuth();
  const meta = ROUTE_META[location.pathname] || { title: 'Dashboard', crumb: 'Copygen' };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <header className="h-[60px] min-h-[60px] flex items-center justify-between px-4 border-b border-white/5 bg-[#050508]/85 backdrop-blur-xl shrink-0 w-full box-border">
      {/* Left: Hamburger (mobile) + Title + Breadcrumb */}
      <div className="flex items-center gap-3 overflow-hidden flex-1">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden text-[#c9a84c] p-2 bg-[#c9a84c]/10 border border-[#c9a84c]/20 cursor-pointer rounded-xl flex items-center justify-center shrink-0 active:scale-95 transition-transform"
          aria-label="Toggle menu"
          style={{ minHeight: '40px', minWidth: '40px' }}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <h1 className="text-lg md:text-xl font-display text-white mt-0.5 shrink-0 margin-0">
          {meta.title}
        </h1>

        <div className="hidden md:flex items-center gap-2 overflow-hidden">
          <span className="text-[#d1d1e0]/30 text-xs">·</span>
          <span className="text-[11px] text-[#d1d1e0]/30 font-medium uppercase tracking-[0.15em] truncate whitespace-nowrap">
            {meta.crumb}
          </span>
        </div>
      </div>

      {/* Right: Bell + Avatar */}
      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        <button className="relative p-2 text-[#d1d1e0]/50 bg-transparent border-none cursor-pointer rounded-xl flex items-center justify-center hover:text-white transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-[#c9a84c] rounded-full" />
        </button>

        <Link
          to="/app/settings"
          className="w-9 h-9 rounded-full bg-[#0d0d14] border-2 border-[#c9a84c]/50 flex items-center justify-center text-[11px] font-black text-[#c9a84c] no-underline shrink-0 hover:border-[#c9a84c] transition-colors"
        >
          {initials}
        </Link>
      </div>
    </header>
  );
};

export default Topbar;

