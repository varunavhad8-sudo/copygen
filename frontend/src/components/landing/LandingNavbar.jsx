import { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function LandingNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const isHome = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (id) => {
    if (!isHome) {
      navigate('/#' + id);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'py-3 glass-frosted' : 'py-8'}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }} className="flex items-center gap-2 cursor-pointer" aria-label="CopyGen home — AI copy generator">
          <span className="font-serif text-2xl tracking-tight">
            <span className="text-[#0E0E0C]">Copy</span><span className="text-gold">Gen</span>
          </span>
        </a>
        
        <div className="hidden md:flex items-center gap-10">
          <button onClick={() => navigate('/about')} className="text-[11px] font-black uppercase tracking-widest text-ink/70 hover:text-gold transition-colors">About</button>
          <button onClick={() => navigate('/services')} className="text-[11px] font-black uppercase tracking-widest text-ink/70 hover:text-gold transition-colors">Services</button>
          <button onClick={() => navigate('/work')} className="text-[11px] font-black uppercase tracking-widest text-ink/70 hover:text-gold transition-colors">Work</button>
          <button onClick={() => handleNavClick('pricing')} className="text-[11px] font-black uppercase tracking-widest text-ink/70 hover:text-gold transition-colors">Pricing</button>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <button 
              onClick={() => navigate('/app')}
              className="px-6 py-2.5 bg-gold text-ink text-[12px] font-bold rounded-xl hover:bg-gold/90 transition-all duration-300 shadow-xl shadow-gold/20 flex items-center gap-2"
            >
              Go to Platform <ChevronRight size={14} />
            </button>
          ) : (
            <>
              <button 
                onClick={() => navigate('/login')}
                className="hidden sm:block text-[11px] font-black uppercase tracking-widest text-ink/60 hover:text-gold transition-colors"
              >
                Log in
              </button>
              <button 
                onClick={() => navigate('/signup')}
                className="px-6 py-2.5 bg-ink text-ivory text-[12px] font-bold rounded-xl hover:bg-gold transition-all duration-300 shadow-xl shadow-ink/5"
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}



