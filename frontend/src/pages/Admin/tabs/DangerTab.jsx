import { useState } from 'react';
import { AlertTriangle, RefreshCw, CheckCircle, Flame } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { adminAPI } from '../../../utils/api';
import { Card } from '../components/shared';

export default function DangerTab() {
  const [resetLoading, setResetLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [confirm, setConfirm] = useState(false);

  const handleReset = async () => {
    if (!confirm) { setConfirm(true); return; }
    setResetLoading(true);
    setResult(null);
    try {
      const res = await adminAPI.resetAllUsage();
      setResult({ ok: true, msg: res.message });
    } catch (err) {
      setResult({ ok: false, msg: err?.error || 'Registry purge failed.' });
    } finally {
      setResetLoading(false);
      setConfirm(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-start gap-4 p-6 bg-red-500/10 border border-red-500/20 rounded-[32px]">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 flex-shrink-0 animate-pulse">
          <AlertTriangle size={24} />
        </div>
        <div>
          <div className="font-black text-red-400 text-sm uppercase tracking-widest">Restricted Access Zone</div>
          <div className="text-[11px] text-white/30 font-bold mt-1 leading-relaxed">
            Operations within this sector are irreversible. Modification of global registry states will impact the entire ecosystem. 
            Authorization required for all protocols.
          </div>
        </div>
      </div>

      {/* Monthly Reset */}
      <Card className="border-red-500/10 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-[0.02] rotate-12">
           <Flame size={120} />
        </div>

        <h3 className="font-black text-white text-base mb-2 uppercase tracking-tight">Flush Free Usage Registry</h3>
        <p className="text-xs text-white/30 font-bold mb-8 leading-relaxed max-w-md">
          Forces an immediate purge of the <code className="bg-white/5 px-2 py-1 rounded text-[10px] font-mono text-white/50 border border-white/5">generationsUsed</code> buffer
          for all non-commercial entities. This protocol bypasses the scheduled cycle.
        </p>

        <AnimatePresence>
          {confirm && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="mb-6 p-5 bg-red-500/10 border border-red-500/30 rounded-2xl text-[10px] text-red-400 font-black uppercase tracking-widest flex items-center gap-3"
            >
              <AlertTriangle size={16} />
              CRITICAL: Manual Override Detected. Confirm Registry Purge?
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={handleReset}
          disabled={resetLoading}
          className={`group flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all disabled:opacity-20 ${
            confirm
              ? 'bg-red-500 text-white shadow-[0_15px_35px_rgba(239,68,68,0.4)] hover:bg-red-600 scale-[1.02]'
              : 'bg-white/5 text-red-500 border border-red-500/20 hover:bg-red-500/10'
          }`}
        >
          <RefreshCw size={14} className={resetLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
          {resetLoading ? 'Purging Registry...' : confirm ? '⚠️ Confirm Global Purge' : 'Initiate Usage Reset'}
        </button>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`mt-8 flex items-center gap-3 p-4 rounded-xl border ${result.ok ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}
            >
              {result.ok ? <CheckCircle size={16} className="shadow-[0_0_8px_#22c55e]" /> : <AlertTriangle size={16} />}
              <span className="text-[10px] font-black uppercase tracking-widest">{result.msg}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
      
      <div className="pt-10">
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/10 text-center italic">
          SECURE ADMINISTRATIVE OVERRIDE ACTIVE
        </p>
      </div>
    </div>
  );
}
