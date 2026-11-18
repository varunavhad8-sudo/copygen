// ─── Shared Plan Colors (Dark Theme Compatible) ──────────────────────────────────
export const PLAN_COLORS = {
  free:    'bg-white/5 text-white/40 border border-white/10',
  starter: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  pro:     'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  growth:  'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  agency:  'bg-gold/10 text-gold border border-gold/30',
};

export const PLAN_PRICES = {
  starter: 8199,
  growth:  16399,
  agency:  32799,
};

export const PLANS = ['free', 'starter', 'growth', 'agency'];

// ─── StatCard ─────────────────────────────────────────────────────────────────
export const StatCard = ({ icon: Icon, label, value, sub, color = 'text-gold', trend }) => (
  <div className="bg-[#121212] rounded-3xl p-7 border border-white/5 flex flex-col gap-3 hover:border-gold/30 transition-all shadow-xl group">
    <div className={`w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
      <Icon size={18} />
    </div>
    <div className="text-3xl font-black text-white tracking-tight">{value ?? '—'}</div>
    {trend != null && (
      <div className={`text-[10px] font-black uppercase tracking-widest ${trend >= 0 ? 'text-green-500' : 'text-red-400'}`}>
        {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% <span className="opacity-40">vs last month</span>
      </div>
    )}
    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">{label}</div>
    {sub && <div className="text-[10px] font-bold text-white/20">{sub}</div>}
  </div>
);

// ─── PlanBadge ────────────────────────────────────────────────────────────────
export const PlanBadge = ({ plan }) => (
  <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${PLAN_COLORS[plan] || 'bg-white/5 text-white/30'}`}>
    {plan || 'free'}
  </span>
);

// ─── SectionHeader ────────────────────────────────────────────────────────────
export const SectionHeader = ({ icon: Icon, title }) => (
  <h3 className="font-black text-white text-base mb-6 tracking-tight flex items-center gap-3">
    <div className="w-8 h-8 rounded-lg bg-gold/5 flex items-center justify-center border border-gold/10">
      <Icon size={14} className="text-gold" /> 
    </div>
    <span className="uppercase tracking-widest text-[11px] opacity-80">{title}</span>
  </h3>
);

// ─── Card ─────────────────────────────────────────────────────────────────────
export const Card = ({ children, className = '' }) => (
  <div className={`bg-[#121212] rounded-3xl p-8 border border-white/5 shadow-2xl ${className}`}>
    {children}
  </div>
);

// ─── Empty State ──────────────────────────────────────────────────────────────
export const EmptyState = ({ icon: Icon, message }) => (
  <div className="flex flex-col items-center justify-center py-20 text-white/20">
    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/5">
      <Icon size={32} className="opacity-30" />
    </div>
    <p className="text-[11px] font-black uppercase tracking-[0.2em]">{message}</p>
  </div>
);

// ─── Pagination ───────────────────────────────────────────────────────────────
export const Pagination = ({ page, totalPages, onPrev, onNext }) => (
  <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
    <button
      onClick={onPrev} disabled={page <= 1}
      className="px-5 py-2.5 text-[10px] font-black uppercase tracking-widest border border-white/10 rounded-xl hover:border-gold hover:text-gold transition-all disabled:opacity-10 bg-white/5"
    >
      ← Prev
    </button>
    <span className="text-[10px] text-white/30 font-black uppercase tracking-widest">Page {page} of {totalPages}</span>
    <button
      onClick={onNext} disabled={page >= totalPages}
      className="px-5 py-2.5 text-[10px] font-black uppercase tracking-widest border border-white/10 rounded-xl hover:border-gold hover:text-gold transition-all disabled:opacity-10 bg-white/5"
    >
      Next →
    </button>
  </div>
);
