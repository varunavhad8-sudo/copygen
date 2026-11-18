import { useNavigate } from 'react-router-dom';

export default function LandingFooter() {
  const navigate = useNavigate();

  return (
    <footer className="py-24 px-6 bg-ink text-ivory border-t border-white/5 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
          <div className="col-span-1 md:col-span-1">
            <div className="font-serif text-2xl tracking-tight mb-6">
               Copy<span className="text-gold">Gen</span>
            </div>
            <p className="text-ivory/40 text-[13px] leading-relaxed max-w-[240px]">
              The unified Marketing Operating System for high-performance agencies. Scale your creative team with AI Intelligence.
            </p>
          </div>

          <div>
            <h4 className="text-gold font-bold text-[10px] uppercase tracking-widest mb-6">Platform</h4>
            <ul className="space-y-4 text-[12px] font-medium text-ivory/60">
              <li><button onClick={() => navigate('/services')} className="hover:text-gold transition-colors">Features</button></li>
              <li><button onClick={() => navigate('/work')} className="hover:text-gold transition-colors">Case Studies</button></li>
              <li><button onClick={() => navigate('/signup')} className="hover:text-gold transition-colors">Pricing</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-gold font-bold text-[10px] uppercase tracking-widest mb-6">Agency</h4>
            <ul className="space-y-4 text-[12px] font-medium text-ivory/60">
              <li><button onClick={() => navigate('/about')} className="hover:text-gold transition-colors">About Story</button></li>
              <li><button onClick={() => navigate('/contact')} className="hover:text-gold transition-colors">Contact Sales</button></li>
              <li><button onClick={() => navigate('/contact')} className="hover:text-gold transition-colors">Support</button></li>
              <li><button onClick={() => navigate('/about')} className="hover:text-gold transition-colors">Brand Assets</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-gold font-bold text-[10px] uppercase tracking-widest mb-6">Legal</h4>
            <ul className="space-y-4 text-[12px] font-medium text-ivory/60">
              <li><button onClick={() => navigate('/privacy')} className="hover:text-gold transition-colors">Privacy Policy</button></li>
              <li><button onClick={() => navigate('/terms')} className="hover:text-gold transition-colors">Terms of Service</button></li>
              <li><button onClick={() => navigate('/refund-policy')} className="hover:text-gold transition-colors">Refund Policy</button></li>
              <li><button onClick={() => navigate('/cookie-policy')} className="hover:text-gold transition-colors">Cookie Policy</button></li>
            </ul>
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col items-center justify-center gap-8">
          <div className="flex flex-wrap justify-center gap-6 text-[12px] font-medium text-ivory/60">
            <a href="/features" className="hover:text-gold transition-colors">AI copy generator features</a>
            <a href="/brand-memory" className="hover:text-gold transition-colors">Brand Memory</a>
            <a href="/pricing" className="hover:text-gold transition-colors">Agency pricing</a>
            <a href="/blog" className="hover:text-gold transition-colors">Copywriting blog</a>
            <a href="/vs-copyai" className="hover:text-gold transition-colors">CopyGen vs Copy.ai</a>
            <a href="/vs-jasper" className="hover:text-gold transition-colors">CopyGen vs Jasper</a>
          </div>
          
          <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-ivory/40">
            © 2026 Copygen. The AI copy generator built for marketing agencies.
          </div>
        </div>
      </div>
    </footer>
  );
}



