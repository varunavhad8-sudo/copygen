import { useState, useEffect, useCallback } from 'react';
import { FileText, RefreshCw, Flag, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { adminAPI } from '../../../utils/api';
import { SectionHeader, Card, PlanBadge, EmptyState, Pagination } from '../components/shared';

const STATUS_STYLES = {
  pending:     'bg-white/5 text-white/40 border border-white/10',
  completed:   'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  approved:    'bg-green-500/10 text-green-400 border border-green-500/20',
  needsreview: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  flagged:     'bg-red-500/10 text-red-400 border border-red-500/20',
};

const STATUS_ICONS = {
  pending:     Clock,
  completed:   CheckCircle,
  approved:    CheckCircle,
  needsreview: AlertTriangle,
};

export default function ContentTab() {
  const [outputs, setOutputs] = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [contentType, setContentType] = useState('');
  const [loading, setLoading] = useState(false);
  const [types, setTypes]     = useState([]);
  const [flagging, setFlagging] = useState(null);

  const fetchOutputs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getAllOutputs({ contentType, page, limit: 30 });
      const body = res.data || res;
      setOutputs(body.outputs || []);
      setTotal(body.total || 0);
      setTotalPages(body.totalPages || 1);
      const seen = new Set((body.outputs || []).map(o => o.contentType).filter(Boolean));
      setTypes(prev => Array.from(new Set([...prev, ...seen])));
    } catch { }
    finally { setLoading(false); }
  }, [contentType, page]);

  useEffect(() => { fetchOutputs(); }, [fetchOutputs]);

  const setStatus = async (id, status) => {
    setFlagging(id);
    try {
      await adminAPI.updateOutputStatus(id, status);
      setOutputs(prev => prev.map(o => o._id === id ? { ...o, status } : o));
    } finally {
      setFlagging(null);
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <select
            value={contentType}
            onChange={e => { setContentType(e.target.value); setPage(1); }}
            className="bg-[#1a1a1a] border border-white/10 rounded-2xl px-6 py-3.5 text-[11px] font-black uppercase tracking-widest text-white/70 focus:outline-none focus:border-gold transition-all"
          >
            <option value="">All Streams</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button 
            onClick={fetchOutputs} 
            className="flex items-center gap-3 px-6 py-3.5 text-[11px] font-black uppercase tracking-widest border border-white/10 rounded-2xl hover:bg-white/5 transition-all text-white/50 ml-auto"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 
            Sync Logs
          </button>
        </div>

        <div className="text-[10px] text-white/20 font-black uppercase tracking-widest mb-6 ml-1">
          {total.toLocaleString('en-IN')} Artifacts Indexed
        </div>

        {/* List */}
        {outputs.length === 0 ? (
          <EmptyState icon={FileText} message="No output trails detected" />
        ) : (
          <div className="space-y-4">
            {outputs.map(o => {
              const StatusIcon = STATUS_ICONS[o.status] || Clock;
              return (
                <div key={o._id} className="bg-white/[0.02] border border-white/5 rounded-[28px] p-6 hover:border-gold/30 transition-all group">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-5">
                    <div className="flex items-center gap-4 flex-wrap">
                      <PlanBadge plan={o.user?.plan} />
                      <div className="h-4 w-px bg-white/10 hidden sm:block" />
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-white tracking-tight">{o.user?.name || 'Anonymous Member'}</span>
                        <span className="text-[10px] text-white/20 font-bold tracking-tight">{o.user?.email}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[8px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-full flex items-center gap-2 ${STATUS_STYLES[o.status] || STATUS_STYLES.pending}`}>
                        <div className="w-1 h-1 rounded-full bg-current shadow-[0_0_8px_currentColor]" />
                        {o.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-[9px] font-black uppercase tracking-widest text-white/20 mb-5 bg-white/[0.03] px-4 py-2.5 rounded-xl w-fit">
                    <span className="text-gold/50">{o.contentType || 'LLM OUTPUT'}</span>
                    <span className="opacity-30">/</span>
                    <span>{o.modelUsed || 'UNKNOWN ENGINE'}</span>
                    <span className="opacity-30">/</span>
                    <span className="text-white/40">{o.generatedWordCount || 0} WORDS</span>
                    <span className="opacity-30">/</span>
                    <span className="text-white/40">{new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {o.preview && (
                    <div className="relative mb-6">
                      <p className="text-sm text-white/50 bg-[#0a0a0a] rounded-[20px] px-5 py-4 line-clamp-3 leading-relaxed border border-white/5 italic">
                        "{o.preview}…"
                      </p>
                      <div className="absolute top-4 right-4 text-white/5">
                        <FileText size={24} />
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-3">
                    {['approved', 'needsreview'].map(s => (
                      <button
                        key={s}
                        onClick={() => setStatus(o._id, s)}
                        disabled={flagging === o._id || o.status === s}
                        className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all disabled:opacity-10 ${
                          s === 'approved'    ? 'border-green-500/20 text-green-400 hover:bg-green-500/10' :
                          'border-amber-500/20 text-amber-400 hover:bg-amber-500/10'
                        }`}
                      >
                        {s === 'approved' ? '✓ Approve' : '⚑ Audit'}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} />
      </Card>
    </div>
  );
}
