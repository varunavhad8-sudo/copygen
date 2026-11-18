import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const MainLayout = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex flex-row w-screen h-screen bg-[#050508] overflow-hidden fixed top-0 left-0">
      {/* Sidebar Desktop */}
      <div 
        className={`hidden lg:block h-full flex-shrink-0 bg-[#050508] border-r border-white/5 transition-all duration-300 ease-in-out relative z-30 ${
          collapsed ? 'w-[68px]' : 'w-[240px]'
        }`}
      >
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      {/* Sidebar Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      <div 
        className={`lg:hidden fixed top-0 left-0 h-full w-[280px] bg-[#050508] z-50 transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar collapsed={false} setCollapsed={() => {}} isMobile onMenuToggle={() => setMobileMenuOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden">
        <div className="w-full h-[60px] flex-shrink-0 bg-[#050508]/80 backdrop-blur-xl border-b border-white/5 relative z-20">
          <Topbar 
            isMobile={true} 
            mobileOpen={mobileMenuOpen} 
            onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} 
          />
        </div>
        
        <div className="flex-1 min-w-0 min-h-0 overflow-hidden relative">
          <main className="w-full h-full overflow-y-auto overflow-x-hidden p-4 md:p-8 lg:p-10 box-border bg-[radial-gradient(circle_at_top_right,_rgba(201,168,76,0.04),_transparent_600px)]">
            <div key={location.pathname} className="animate-slide-up">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;

