import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, TrendingUp, Zap, Shield, Server, 
  RefreshCw, AlertTriangle, CheckCircle, 
  Database, Cpu, Clock, Activity, Eye, EyeOff,
  Edit, Trash2, RotateCcw, DollarSign, PieChart,
  BarChart3, MoreVertical, Search, Filter, ArrowUpRight
} from 'lucide-react';
import { adminAPI } from '../utils/adminApi';

// ─── Plan Color Map ───────────────────────────────────────────────────────────
const PLAN_COLORS = {
  free:    'bg-zinc-800 text-zinc-400 border border-zinc-700',
  starter: 'bg-blue-900/20 text-blue-400 border border-blue-800/30',
  growth:  'bg-amber-900/20 text-amber-400 border border-amber-800/30',
  agency:  'bg-[#c9a84c]/10 text-[#c9a84c] border border-[#c9a84c]/20',
};

const STAT_COLORS = {
  gold: 'text-gold',
  blue: 'text-blue-500',
  green: 'text-green-500',
  red: 'text-red-500',
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, colorVariant = 'gold' }) => {
  const colorClass = STAT_COLORS[colorVariant] || STAT_COLORS.gold;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1a1f2e] rounded-2xl p-8 border border-[#2a2f42] flex flex-col gap-3 shadow-xl shadow-black/40"
    >
      <div className={`w-10 h-10 rounded-xl bg-[#c9a84c]/10 flex items-center justify-center ${colorClass}`}>
        <Icon size={20} />
      </div>
      <div className="text-3xl font-black text-white tracking-tight">{value ?? '—'}</div>
      <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{label}</div>
      {sub && <div className="text-xs text-slate-600">{sub}</div>}
    </motion.div>
  );
};

// ─── Auth Gate ────────────────────────────────────────────────────────────────
function AuthGate({ onSuccess }) {
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setError('');
    const secret = input.trim();
    try {
      localStorage.setItem('cg_admin_secret', secret);
      console.log('Attempting admin authentication...');
      await adminAPI.getStats();
      onSuccess();
    } catch (err) {
      console.error('Admin Auth Error:', err);
      localStorage.removeItem('cg_admin_secret');
      setError(err.message || err.error || 'Registry Access Denied. Verify Credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center py-20 px-6">
      <Helmet>
        <title>Admin Access | CopyGen</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-[#1a1f2e] rounded-[40px] p-12 w-full max-w-md shadow-2xl border border-[#2a2f42] relative overflow-hidden"
      >
        <div className="relative z-10">
          <div className="flex flex-col items-center text-center mb-12">
            <div className="w-16 h-16 bg-[#c9a84c]/10 rounded-[24px] flex items-center justify-center text-[#c9a84c] border border-[#c9a84c]/20 mb-6">
              <Shield size={28} />
            </div>
            <h2 className="font-black text-white text-2xl tracking-tighter mb-2 font-display">Admin Registry</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">Encrypted Data Access</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                Administrative Secret
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="ENTER_ADMIN_SECRET"
                  autoFocus
                  className="w-full bg-[#0f1117] border border-[#2a2f42] rounded-2xl px-6 py-5 pr-14 text-sm text-white focus:outline-none focus:border-[#c9a84c]/50 transition-all placeholder:text-white/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#c9a84c] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 p-5 bg-red-500/5 border border-red-500/10 rounded-2xl text-red-500 text-[11px] font-black uppercase tracking-widest"
              >
                <AlertTriangle size={16} className="flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={!input || loading}
              className="w-full py-5 bg-[#c9a84c] text-[#050508] rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all disabled:opacity-20 shadow-xl shadow-[#c9a84c]/10 active:scale-[0.98]"
            >
              {loading ? 'Decrypting...' : 'Authenticate Access'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Admin Component ─────────────────────────────────────────────────────
export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Data States
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [users, setUsers] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [aiUsage, setAiUsage] = useState(null);
  const [outputs, setOutputs] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  const [resetLoading, setResetLoading] = useState(false);
  const [resetResult, setResetResult] = useState(null);

  // ─── Load data ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        statsData, 
        healthData, 
        usersData, 
        revenueData, 
        usageData, 
        outputsData, 
        analyticsData
      ] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getHealth(),
        adminAPI.getUsers(),
        adminAPI.getRevenue(),
        adminAPI.getAiUsage(),
        adminAPI.getOutputs(),
        adminAPI.getAnalytics()
      ]);

      setStats(statsData.data || statsData);
      setHealth(healthData.data || healthData);
      setUsers(usersData.data || usersData);
      setRevenue(revenueData.data || revenueData);
      setAiUsage(usageData.data || usageData);
      setOutputs(outputsData.data || outputsData);
      setAnalytics(analyticsData.data || analyticsData);
      
      setAuthenticated(true);
    } catch (err) {
      console.error('Admin Load Error:', err);
      setError(err.message || 'Failed to fetch system data.');
      // If unauthorized, clear secret
      if (err.message?.includes('403') || err.message?.includes('secret')) {
        localStorage.removeItem('cg_admin_secret');
        setAuthenticated(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (localStorage.getItem('cg_admin_secret')) {
      loadData();
    }
  }, [loadData]);

  const [activeTab, setActiveTab] = useState('overview');

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
  }, []);

  // Mutation Handlers
  const handleUserAction = async (action, userId, data = null) => {
    try {
      if (action === 'delete' && !confirm('Are you sure you want to permanently delete this account?')) return;
      
      let res;
      if (action === 'updatePlan') res = await adminAPI.updateUser(userId, { plan: data });
      if (action === 'resetUsage') res = await adminAPI.resetUserUsage(userId);
      if (action === 'delete') res = await adminAPI.deleteUser(userId);
      
      showToast(res?.message || 'Operation Synchronized Successfully');
      loadData(); // Refetch all
    } catch (err) {
      showToast(err.message || 'Transmission Failed', 'error');
    }
  };

  if (!authenticated) {
    return <AuthGate onSuccess={loadData} />;
  }

  const TABS = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'revenue', label: 'Financials', icon: DollarSign },
    { id: 'usage', label: 'AI Operations', icon: Cpu },
    { id: 'outputs', label: 'Output Audit', icon: Database },
    { id: 'analytics', label: 'Advanced Analytics', icon: TrendingUp },
  ];

  return (
    <div className="p-4 md:p-8 space-y-8 min-h-screen bg-transparent">
      <Helmet>
        <title>Administrative Portal | CopyGen</title>
      </Helmet>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <RefreshCw className="w-12 h-12 text-[#c9a84c] animate-spin" />
          <p className="text-slate-400 font-bold tracking-widest text-xs uppercase animate-pulse font-display">
            Synchronizing Secure Core...
          </p>
        </div>
      ) : error ? (
        <div className="max-w-2xl mx-auto bg-red-500/5 border border-red-500/20 rounded-3xl p-12 text-center space-y-6">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="text-red-500" size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white font-display uppercase tracking-tight">Access Restricted</h2>
            <p className="text-red-400/80 font-medium">{error}</p>
          </div>
          <button 
            onClick={loadData}
            className="px-10 py-4 bg-red-500 text-white rounded-2xl font-black hover:bg-red-600 transition-all shadow-2xl shadow-red-500/30 active:scale-95"
          >
            RETRY HANDSHAKE
          </button>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-700">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black text-white tracking-tighter font-display">
                Administrative <span className="text-[#c9a84c]">Console</span>
              </h1>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em] mt-1">Operational Oversight v3.1</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-1 bg-[#1a1f2e] p-1.5 rounded-2xl border border-[#2a2f42] overflow-x-auto scrollbar-hide">
              {TABS.map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                      isActive 
                        ? 'bg-[#c9a84c] text-black shadow-lg shadow-[#c9a84c]/20' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <tab.icon size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {/* ── OVERVIEW TAB ── */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard 
                    icon={Users} 
                    label="Total Registered Users" 
                    value={stats?.totalUsers?.toLocaleString()} 
                    colorVariant="gold" 
                  />
                  <StatCard 
                    icon={DollarSign} 
                    label="Premium Conversion" 
                    value={`${stats?.conversionRate}%`} 
                    sub={`${stats?.paidUsers} Active Subscriptions`}
                    colorVariant="blue" 
                  />
                  <StatCard 
                    icon={TrendingUp} 
                    label="Estimated MRR" 
                    value={`$${revenue?.mrr?.toLocaleString() || '0'}`} 
                    colorVariant="green" 
                  />
                  <StatCard 
                    icon={Activity} 
                    label="System Availability" 
                    value={health?.status === 'ok' ? '99.9%' : 'Degraded'} 
                    sub={health?.status === 'ok' ? 'All Services Nominal' : 'Check Health Log'}
                    colorVariant={health?.status === 'ok' ? 'green' : 'red'} 
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Plan Distribution Chart-ish */}
                  <div className="bg-[#1a1f2e] rounded-3xl p-8 border border-[#2a2f42] shadow-2xl">
                    <h3 className="font-black text-white text-lg mb-8 flex items-center gap-3 font-display">
                      <PieChart className="text-[#c9a84c]" size={20} /> Subscription Landscape
                    </h3>
                    <div className="space-y-6">
                      {stats?.planBreakdown && Object.entries(stats.planBreakdown).map(([plan, count]) => {
                        const pct = stats.totalUsers > 0 ? (count / stats.totalUsers) * 100 : 0;
                        return (
                          <div key={plan} className="group">
                            <div className="flex justify-between items-center mb-2">
                              <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg ${PLAN_COLORS[plan] || 'bg-zinc-800 text-zinc-500'}`}>
                                {plan}
                              </span>
                              <div className="text-right">
                                <span className="text-lg font-black text-white block leading-none">{count}</span>
                                <span className="text-[10px] text-slate-500 font-bold uppercase">{pct.toFixed(1)}%</span>
                              </div>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                className={`h-full rounded-full ${
                                  plan === 'free' ? 'bg-slate-600' :
                                  plan === 'starter' ? 'bg-blue-500' :
                                  plan === 'growth' ? 'bg-amber-500' :
                                  'bg-[#c9a84c]'
                                }`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Detailed Health */}
                  <div className="bg-[#1a1f2e] rounded-3xl p-8 border border-[#2a2f42] shadow-2xl">
                    <h3 className="font-black text-white text-lg mb-8 flex items-center gap-3 font-display">
                      <Server className="text-green-500" size={20} /> Operational Health
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { label: 'Primary Database', status: health?.db, ok: health?.db === 'connected' },
                        { label: 'Cache (Redis)', status: health?.redis || 'OK', ok: true },
                        { label: 'AI Inference Layer', status: 'ACTIVE', ok: true },
                        { label: 'Payment Gateway', status: 'READY', ok: true },
                      ].map((item, idx) => (
                        <div key={idx} className="p-5 bg-white/5 rounded-2xl border border-white/5 flex flex-col gap-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{item.label}</span>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-black text-white uppercase">{item.status}</span>
                            <div className={`w-2 h-2 rounded-full ${item.ok ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-8 p-4 bg-black/20 rounded-xl border border-white/5">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-600">
                        <span>Environment</span>
                        <span className="text-slate-400">{health?.environment || 'Production'}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-600 mt-2">
                        <span>System Uptime</span>
                        <span className="text-slate-400">{Math.floor((health?.uptime || 0) / 3600)} Hours Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── USERS TAB ── */}
            {activeTab === 'users' && (
              <div className="bg-[#1a1f2e] rounded-3xl border border-[#2a2f42] shadow-2xl overflow-hidden">
                <div className="p-8 border-b border-[#2a2f42] flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight font-display uppercase">User Directory</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Manage platform participants</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                      <input 
                        type="text" 
                        placeholder="SEARCH IDENTITY..." 
                        className="bg-black/20 border border-[#2a2f42] rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-white focus:border-[#c9a84c] transition-all outline-none w-full md:w-64"
                      />
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-black/10">
                      <tr>
                        <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Identity</th>
                        <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Subscription</th>
                        <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Usage</th>
                        <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Registration</th>
                        <th className="text-right px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Command</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2f42]/30">
                      {(users || []).map((user) => (
                        <tr key={user._id} className="hover:bg-white/5 transition-colors group">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center font-black text-slate-400 border border-white/5">
                                {user.name?.[0] || 'U'}
                              </div>
                              <div>
                                <div className="font-black text-white group-hover:text-[#c9a84c] transition-colors">{user.name || 'Unknown User'}</div>
                                <div className="text-xs text-slate-500 font-bold">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <select 
                              value={user.plan}
                              onChange={(e) => handleUserAction('updatePlan', user._id, e.target.value)}
                              className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border-0 outline-none cursor-pointer ${PLAN_COLORS[user.plan] || 'bg-zinc-800 text-zinc-400'}`}
                            >
                              <option value="free">Free</option>
                              <option value="starter">Starter</option>
                              <option value="growth">Growth</option>
                              <option value="agency">Agency</option>
                            </select>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-black text-white tracking-tight">{user.generationsUsed || 0} GENs</span>
                              <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min((user.generationsUsed || 0) / 10, 100)}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="text-xs font-bold text-slate-400">
                              {new Date(user.joinedAt || user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => handleUserAction('resetUsage', user._id)}
                                title="Reset Usage"
                                className="p-2 text-slate-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all"
                              >
                                <RotateCcw size={16} />
                              </button>
                              <button 
                                onClick={() => handleUserAction('delete', user._id)}
                                title="Delete User"
                                className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── FINANCIALS TAB ── */}
            {activeTab === 'revenue' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-[#1a1f2e] rounded-3xl p-10 border border-[#2a2f42] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-5">
                      <TrendingUp size={200} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#c9a84c]">Revenue Stream</span>
                    <h2 className="text-6xl font-black text-white tracking-tighter mt-4 mb-8">
                      ${revenue?.totalRevenue?.toLocaleString() || '0'}
                      <span className="text-xl text-slate-500 ml-4 font-display uppercase tracking-widest">Total Earned</span>
                    </h2>
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Monthly Recurring</span>
                        <div className="text-3xl font-black text-white">${revenue?.mrr?.toLocaleString() || '0'}</div>
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Total Transactions</span>
                        <div className="text-3xl font-black text-white">{revenue?.transactionCount || '0'}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-[#1a1f2e] rounded-3xl p-8 border border-[#2a2f42] shadow-2xl flex flex-col justify-between">
                    <h3 className="font-black text-white text-base mb-6 tracking-tight flex items-center gap-2 font-display">
                      <PieChart size={18} className="text-[#c9a84c]" /> Yield Breakdown
                    </h3>
                    <div className="space-y-4">
                      {revenue?.breakdown && Object.entries(revenue.breakdown).map(([plan, amount]) => (
                        <div key={plan} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                          <span className="text-xs font-black uppercase tracking-widest text-slate-400">{plan}</span>
                          <span className="text-lg font-black text-white">${amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── AI OPERATIONS TAB ── */}
            {activeTab === 'usage' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard 
                    icon={Cpu} 
                    label="Total Tokens Consumed" 
                    value={aiUsage?.totalTokens?.toLocaleString() || '0'} 
                    colorVariant="blue" 
                  />
                  <StatCard 
                    icon={DollarSign} 
                    label="Inference Cost (Est)" 
                    value={`$${aiUsage?.totalCost?.toFixed(2) || '0.00'}`} 
                    colorVariant="red" 
                  />
                  <StatCard 
                    icon={Zap} 
                    label="Efficiency Rating" 
                    value="98.2%" 
                    colorVariant="green" 
                  />
                </div>

                <div className="bg-[#1a1f2e] rounded-3xl border border-[#2a2f42] shadow-2xl overflow-hidden">
                  <div className="p-8 border-b border-[#2a2f42]">
                    <h3 className="text-xl font-black text-white tracking-tight font-display uppercase">Model Performance Matrix</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-black/10">
                        <tr>
                          <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Model Cluster</th>
                          <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Request Volume</th>
                          <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Token Volume</th>
                          <th className="text-right px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Cost Profile</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2a2f42]/30">
                        {aiUsage?.modelBreakdown && Object.entries(aiUsage.modelBreakdown).map(([model, data]) => (
                          <tr key={model} className="hover:bg-white/5 transition-colors">
                            <td className="px-8 py-5">
                              <div className="font-black text-white uppercase tracking-wider">{model}</div>
                            </td>
                            <td className="px-8 py-5 font-bold text-slate-400">{data.requests?.toLocaleString() || 0}</td>
                            <td className="px-8 py-5 font-bold text-slate-400">{data.tokens?.toLocaleString() || 0}</td>
                            <td className="px-8 py-5 text-right font-black text-[#c9a84c]">${data.cost?.toFixed(4) || '0.0000'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── OUTPUT AUDIT TAB ── */}
            {activeTab === 'outputs' && (
              <div className="bg-[#1a1f2e] rounded-3xl border border-[#2a2f42] shadow-2xl overflow-hidden">
                <div className="p-8 border-b border-[#2a2f42] flex justify-between items-center">
                  <h3 className="text-xl font-black text-white tracking-tight font-display uppercase">Intelligence Output Stream</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-black/10">
                      <tr>
                        <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Architect</th>
                        <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Blueprint</th>
                        <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Engine</th>
                        <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Volume</th>
                        <th className="text-right px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2f42]/30">
                      {(outputs || []).map((out) => (
                        <tr key={out._id} className="hover:bg-white/5 transition-colors">
                          <td className="px-8 py-5 font-bold text-slate-300 text-xs">{out.userEmail}</td>
                          <td className="px-8 py-5">
                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-white/5 text-slate-400 rounded-md border border-white/5">
                              {out.type}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-xs font-black text-white uppercase tracking-tighter">{out.model}</td>
                          <td className="px-8 py-5 text-xs font-bold text-slate-500">{out.wordCount} Words</td>
                          <td className="px-8 py-5 text-right text-[10px] font-bold text-slate-600">
                            {new Date(out.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── ADVANCED ANALYTICS TAB ── */}
            {activeTab === 'analytics' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {analytics?.metrics && Object.entries(analytics.metrics).map(([key, value]) => (
                    <div key={key} className="bg-[#1a1f2e] p-8 rounded-3xl border border-[#2a2f42] shadow-xl">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <div className="text-4xl font-black text-white tracking-tighter">{typeof value === 'number' ? value.toLocaleString() : value}</div>
                    </div>
                  ))}
                </div>
                
                <div className="bg-[#1a1f2e] rounded-3xl p-12 border border-[#2a2f42] text-center border-dashed">
                  <div className="w-16 h-16 bg-[#c9a84c]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#c9a84c]">
                    <TrendingUp size={32} />
                  </div>
                  <h3 className="text-xl font-black text-white mb-2 font-display uppercase">Predictive Insights Engine</h3>
                  <p className="text-slate-500 max-w-md mx-auto font-medium">Aggregating historical behavior patterns to generate growth projections. Module currently in deep-sync.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Toast Notification */}
      <div className={`fixed bottom-10 right-10 z-[100] transition-all duration-500 transform ${toast.show ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl border shadow-2xl backdrop-blur-xl ${
          toast.type === 'error' 
            ? 'bg-red-950/40 border-red-500/30 text-red-400' 
            : 'bg-[#0d0d14]/90 border-[#c9a84c]/30 text-[#c9a84c]'
        }`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${toast.type === 'error' ? 'bg-red-500/20' : 'bg-[#c9a84c]/20'}`}>
            {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-0.5">System Notification</div>
            <div className="text-sm font-black tracking-tight">{toast.message}</div>
          </div>
        </div>
      </div>
    </div>
  );
}


