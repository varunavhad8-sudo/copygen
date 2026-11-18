import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, RefreshCw, AlertTriangle,
  LayoutDashboard, Users, IndianRupee, Cpu, FileText, BarChart2, Trash2,
  ChevronDown, Globe, Wifi, WifiOff
} from 'lucide-react';
import { adminAPI } from '../../utils/api';
import { useCurrency, CURRENCIES } from './hooks/useCurrency';

// ─── Tab Components ───────────────────────────────────────────────────────────
import OverviewTab from './tabs/OverviewTab';
import UsersTab    from './tabs/UsersTab';
import RevenueTab  from './tabs/RevenueTab';
import AiCostTab   from './tabs/AiCostTab';
import ContentTab  from './tabs/ContentTab';
import GrowthTab   from './tabs/GrowthTab';
import DangerTab   from './tabs/DangerTab';

// ─── Tab Config ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview', label: 'Overview',    icon: LayoutDashboard },
  { id: 'users',    label: 'Users',       icon: Users           },
  { id: 'revenue',  label: 'Revenue',     icon: IndianRupee     },
  { id: 'ai-cost',  label: 'AI Cost',     icon: Cpu             },
  { id: 'content',  label: 'Content',     icon: FileText        },
  { id: 'growth',   label: 'Growth',      icon: BarChart2       },
  { id: 'danger',   label: 'Danger Zone', icon: Trash2, danger: true },
];

// ─── Currency Picker ──────────────────────────────────────────────────────────
function CurrencyPicker({ currency, rateDate, loading, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-3 px-4 py-2 bg-white/[0.03] border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/50 hover:border-gold/50 hover:text-gold hover:bg-gold/5 transition-all"
      >
        <Globe size={13} className="text-gold/50" />
        <span>{currency.code}</span>
        <div className="w-1 h-1 rounded-full bg-white/20" />
        {rateDate === 'offline'
          ? <WifiOff size={11} className="text-amber-500" />
          : <Wifi size={11} className="text-green-500 shadow-[0_0_8px_#22c55e]" />
        }
        <ChevronDown size={11} className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.95 }}
              className="absolute right-0 top-full mt-3 z-50 bg-[#1a1a1a] border border-white/10 rounded-[24px] shadow-[0_30px_60px_rgba(0,0,0,0.7)] overflow-hidden w-64 backdrop-blur-xl"
            >
              <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">Market Currency</div>
                {rateDate && rateDate !== 'offline' && (
                  <div className="text-[9px] text-green-500 font-black uppercase tracking-widest mt-1 flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-green-500 shadow-[0_0_6px_#22c55e]" />
                    Live Rates · {rateDate}
                  </div>
                )}
                {rateDate === 'offline' && (
                  <div className="text-[9px] text-amber-500 font-black uppercase tracking-widest mt-1 flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-amber-500" />
                    Cached Feed
                  </div>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto py-2 px-2 space-y-1 custom-scrollbar">
                {CURRENCIES.map(c => (
                  <button
                    key={c.code}
                    onClick={() => { onChange(c.code); setOpen(false); }}
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                      currency.code === c.code 
                        ? 'bg-gold/10 text-gold' 
                        : 'text-white/40 hover:text-white hover:bg-white/[0.03]'
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${currency.code === c.code ? 'bg-gold text-black' : 'bg-white/5'}`}>
                      {c.symbol}
                    </span>
                    <div className="flex-1">
                      <div className="text-[11px] font-black tracking-tight">{c.code}</div>
                      <div className="text-[9px] font-bold opacity-30 uppercase tracking-widest">{c.name}</div>
                    </div>
                    {currency.code === c.code && (
                      <div className="w-1.5 h-1.5 rounded-full bg-gold shadow-[0_0_8px_#c9a84c]" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Auth Gate ────────────────────────────────────────────────────────────────
function AuthGate({ onSuccess }) {
  const [input, setInput]     = useState('');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setError('');
    try {
      localStorage.setItem('cg_admin_secret', input);
      await adminAPI.getStats();
      onSuccess();
    } catch (err) {
      localStorage.removeItem('cg_admin_secret');
      setError(err?.response?.data?.error || 'Registry Access Denied. Verify Credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 font-inter">
      <Helmet>
        <title>Terminal Access | CopyGen</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-[#121212] rounded-[40px] p-12 w-full max-w-md shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] border border-white/5 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/50 to-transparent opacity-30" />
        
        <div className="relative z-10">
          <div className="flex flex-col items-center text-center mb-12">
            <div className="w-16 h-16 bg-gold/10 rounded-[24px] flex items-center justify-center text-gold border border-gold/20 mb-6 shadow-[0_0_30px_rgba(201,168,76,0.1)]">
              <Shield size={28} />
            </div>
            <h2 className="font-black text-white text-2xl tracking-tighter mb-2">Admin Registry</h2>
            <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.3em]">Encrypted Data Access</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-1">
                Administrative Secret
              </label>
              <div className="relative group">
                <input
                  type={showKey ? "text" : "password"}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="ENTER_ADMIN_SECRET"
                  autoFocus
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 text-sm text-white focus:outline-none focus:border-gold/50 focus:shadow-[0_0_30px_rgba(201,168,76,0.1)] transition-all placeholder:text-white/20 tracking-[0.2em]"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 p-2 text-white/30 hover:text-gold transition-colors font-black text-[9px] tracking-widest"
                >
                  {showKey ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-[11px] font-black uppercase tracking-widest"
              >
                <AlertTriangle size={16} className="flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={!input || loading}
              className="w-full py-5 bg-gold text-black rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] hover:bg-white transition-all disabled:opacity-20 shadow-[0_20px_40px_rgba(201,168,76,0.15)] active:scale-[0.98]"
            >
              {loading ? 'Decrypting...' : 'Authenticate Access'}
            </button>
          </form>

          <div className="mt-12 pt-10 border-t border-white/5 text-center">
            <div className="flex justify-center gap-6 text-[9px] font-black uppercase tracking-[0.2em] text-white/10">
              <span>Security v4.2</span>
              <span>Level 7 Cleared</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Admin Shell ─────────────────────────────────────────────────────────
export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats]   = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);

  const { currency, rateDate, loading: rateLoading, changeCurrency, convert } = useCurrency();

  useEffect(() => {
    const secret = localStorage.getItem('cg_admin_secret');
    if (secret) {
      adminAPI.getStats()
        .then(res => { setStats(res.data || res); setAuthenticated(true); })
        .catch(() => localStorage.removeItem('cg_admin_secret'));
    }
  }, []);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      const statsRes = await adminAPI.getStats();
      // Assume health check might still be needed or handled via stats
      setStats(statsRes.data || statsRes);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated) loadOverview();
  }, [authenticated, loadOverview]);

  const signOut = () => {
    localStorage.removeItem('cg_admin_secret');
    setAuthenticated(false);
    setStats(null);
    setHealth(null);
  };

  if (!authenticated) {
    return <AuthGate onSuccess={() => setAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-gold selection:text-black">
      <Helmet>
        <title>Control Center | CopyGen</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* ── Sticky Header ──────────────────────────────────────────────────── */}
      <header className="bg-[#121212]/80 backdrop-blur-xl border-b border-white/5 z-30 shadow-2xl">
        <div className="max-w-full mx-auto px-8 h-20 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <a href="/app" className="w-11 h-11 bg-gold/10 rounded-2xl flex items-center justify-center text-gold hover:bg-gold transition-all border border-gold/20 hover:text-black shadow-[0_0_20px_rgba(201,168,76,0.1)]">
              <Shield size={20} />
            </a>
            <div className="flex flex-col">
              <span className="font-black text-white text-lg tracking-tighter leading-none">Control Center</span>
              <span className="text-[9px] text-white/30 font-black uppercase tracking-[0.3em] mt-1">Administrator</span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            <a 
              href="/app" 
              className="hidden lg:flex items-center gap-2 px-5 py-2.5 text-[9px] font-black text-white/30 hover:text-gold transition-all mr-2 uppercase tracking-[0.2em] bg-white/[0.03] rounded-xl border border-white/5"
            >
              Exit Terminal
            </a>
            
            <CurrencyPicker
              currency={currency}
              rateDate={rateDate}
              loading={rateLoading}
              onChange={changeCurrency}
            />

            <button
              onClick={loadOverview}
              className="group flex items-center gap-3 px-5 py-2.5 text-[9px] font-black text-white/60 border border-white/10 rounded-2xl hover:border-gold hover:text-gold transition-all bg-white/[0.03] uppercase tracking-[0.2em]"
            >
              <RefreshCw size={13} className={`${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              <span className="hidden sm:inline">Sync Data</span>
            </button>

            <button
              onClick={signOut}
              className="w-10 h-10 rounded-2xl border border-white/10 flex items-center justify-center text-white/20 hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/5 transition-all ml-1"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-current" />
            </button>
          </div>
        </div>

        {/* ── Tab Bar ─────────────────────────────────────────────────────── */}
        <nav className="max-w-full mx-auto px-8 flex gap-2 overflow-x-auto no-scrollbar">
          {TABS.map(({ id, label, icon: Icon, danger }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-3 px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap border-b-2 transition-all group ${
                activeTab === id
                  ? danger 
                    ? 'border-red-500 text-red-500 bg-red-500/5' 
                    : 'border-gold text-gold bg-gold/5'
                  : danger 
                    ? 'border-transparent text-white/20 hover:text-red-400'
                    : 'border-transparent text-white/30 hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              <Icon size={14} className={`${activeTab === id ? 'scale-110' : 'opacity-40 group-hover:opacity-100'} transition-all`} />
              {label}
            </button>
          ))}
        </nav>
      </header>

      {/* ── Tab Content ────────────────────────────────────────────────────── */}
      <main className="max-w-full mx-auto px-8 py-12">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && <OverviewTab stats={stats} health={health} onRefresh={loadOverview} loading={loading} />}
          {activeTab === 'users'    && <UsersTab />}
          {activeTab === 'revenue'  && <RevenueTab convert={convert} currency={currency} />}
          {activeTab === 'ai-cost'  && <AiCostTab  convert={convert} currency={currency} />}
          {activeTab === 'content'  && <ContentTab />}
          {activeTab === 'growth'   && <GrowthTab />}
          {activeTab === 'danger'   && <DangerTab />}
        </motion.div>
      </main>
    </div>
  );
}
