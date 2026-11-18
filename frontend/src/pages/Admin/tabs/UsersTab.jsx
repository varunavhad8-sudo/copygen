import { useState, useEffect, useCallback } from 'react';
import { Search, Users, RefreshCw, X, ShieldCheck, ShieldOff, RotateCcw, Trash2 } from 'lucide-react';
import { adminAPI } from '../../../utils/api';
import { PlanBadge, Card, EmptyState, Pagination, PLANS } from '../components/shared';

// ─── Add User Modal ────────────────────────────────────────────────────────────
function AddUserModal({ onClose, onSave }) {
  const [formData, setFormData] = useState({ email: '', name: '', plan: 'free', durationDays: 30, firebaseUid: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const save = async () => {
    if (!formData.email) return setMsg({ ok: false, text: 'Email required.' });
    setSaving(true);
    try {
      await adminAPI.createUser(formData);
      setMsg({ ok: true, text: 'Member registered successfully.' });
      setTimeout(() => { onSave(); onClose(); }, 1200);
    } catch (e) {
      setMsg({ ok: false, text: e.response?.data?.error || 'Failed to create member.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-[#121212] rounded-[32px] w-full max-w-md p-10 shadow-[0_30px_60px_rgba(0,0,0,0.6)] border border-white/5">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-black text-white text-xl tracking-tight">Register Member</h3>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-2 ml-1">Identity Name</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs text-white" placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-2 ml-1">Email Address</label>
              <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs text-white" placeholder="john@example.com" />
            </div>
          </div>

          <div>
             <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-2 ml-1">Initial Tier</label>
             <div className="grid grid-cols-4 gap-2">
               {PLANS.map(p => (
                 <button key={p} onClick={() => setFormData({...formData, plan: p})} className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border ${formData.plan === p ? 'bg-gold border-gold text-black' : 'bg-white/5 border-white/5 text-white/40'}`}>
                   {p}
                 </button>
               ))}
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-2 ml-1">Access Duration (Days)</label>
              <input type="number" value={formData.durationDays} onChange={e => setFormData({...formData, durationDays: e.target.value})} className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs text-white" />
            </div>
            <div>
              <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-2 ml-1">Firebase UID (Optional)</label>
              <input type="text" value={formData.firebaseUid} onChange={e => setFormData({...formData, firebaseUid: e.target.value})} className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs text-white" placeholder="Leave empty for auto" />
            </div>
          </div>
        </div>

        {msg && (
          <div className={`mt-6 text-[10px] font-black uppercase tracking-[0.1em] text-center py-3 rounded-xl border ${msg.ok ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            {msg.text}
          </div>
        )}

        <button
          onClick={save} disabled={saving}
          className="w-full mt-8 py-4 bg-gold text-black rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-white transition-all disabled:opacity-40 shadow-[0_10px_25px_rgba(201,168,76,0.2)]"
        >
          {saving ? 'Registering...' : 'Complete Registration'}
        </button>
      </div>
    </div>
  );
}

// ─── Edit User Modal ──────────────────────────────────────────────────────────
function EditModal({ user, onClose, onSave }) {
  const [plan, setPlan] = useState(user.plan);
  const [generationsLimit, setGenerationsLimit] = useState(user.generationsLimit);
  const [isBanned, setIsBanned] = useState(user.isBanned || false);
  const [banReason, setBanReason] = useState(user.banReason || '');
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState(
    user.currentPeriodEnd ? new Date(user.currentPeriodEnd).toISOString().split('T')[0] : ''
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [msg, setMsg] = useState(null);

  const save = async () => {
    setSaving(true);
    try {
      await adminAPI.updateUser(user._id, { plan, generationsLimit, isBanned, banReason, currentPeriodEnd });
      setMsg({ ok: true, text: 'Member profile synchronized.' });
      setTimeout(() => { setMsg(null); onSave(); onClose(); }, 1200);
    } catch {
      setMsg({ ok: false, text: 'Update failed.' });
    } finally {
      setSaving(false);
    }
  };

  const resetGen = async () => {
    setResetting(true);
    try {
      await adminAPI.resetUserUsage(user._id);
      setMsg({ ok: true, text: 'Consumption reset to zero.' });
      setTimeout(() => setMsg(null), 2000);
    } catch {
      setMsg({ ok: false, text: 'Reset failed.' });
    } finally {
      setResetting(false);
    }
  };

  const deleteUser = async () => {
    if (!window.confirm(`PERMANENTLY DELETE ${user.email}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await adminAPI.deleteUser(user._id);
      setMsg({ ok: true, text: 'Member purged from registry.' });
      setTimeout(() => { onSave(); onClose(); }, 1200);
    } catch {
      setMsg({ ok: false, text: 'Deletion failed.' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-[#121212] rounded-[32px] w-full max-w-md p-10 shadow-[0_30px_60px_rgba(0,0,0,0.6)] border border-white/5">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="font-black text-white text-lg tracking-tight">{user.name || 'Unknown'}</h3>
            <p className="text-xs text-white/30 font-bold">{user.email}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-2 ml-1">Tier Override</label>
              <select value={plan} onChange={e => setPlan(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none">
                {PLANS.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-2 ml-1">Subscription Expiry</label>
              <input type="date" value={currentPeriodEnd} onChange={e => setCurrentPeriodEnd(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-2 ml-1">Monthly Generation Limit</label>
            <input type="number" value={generationsLimit} onChange={e => setGenerationsLimit(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-xl px-5 py-3 text-sm font-black text-white focus:outline-none focus:border-gold/50" />
          </div>

          <div>
            <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-2 ml-1">Access Status</label>
            <button
              onClick={() => setIsBanned(b => !b)}
              className={`flex items-center gap-3 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all w-full ${isBanned ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}
            >
              {isBanned ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
              {isBanned ? 'Restricted Access' : 'Full Access'}
            </button>
          </div>
        </div>

        {msg && (
          <div className={`mt-6 text-[10px] font-black uppercase tracking-[0.1em] text-center py-3 rounded-xl border ${msg.ok ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            {msg.text}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mt-8">
          <button onClick={resetGen} disabled={resetting} className="px-4 py-3 text-[9px] font-black uppercase tracking-widest border border-white/5 rounded-xl hover:bg-white/5 transition-all text-white/40"><RotateCcw size={12} className={resetting ? 'animate-spin' : ''} /></button>
          <button onClick={deleteUser} disabled={deleting} className="px-4 py-3 text-[9px] font-black uppercase tracking-widest bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all text-red-400">Delete</button>
          <button onClick={save} disabled={saving} className="bg-gold text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-lg">Save</button>
        </div>
      </div>
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────
export default function UsersTab() {
  const [users, setUsers]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch]   = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [showAdd, setShowAdd]   = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers({ search, plan: planFilter, page, limit: 25 });
      setUsers(res.users);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch { }
    finally { setLoading(false); }
  }, [search, planFilter, page]);

  const grantGrowth = async (userId) => {
    if (!window.confirm('Grant 12-month Growth Plan to this user?')) return;
    try {
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      
      await adminAPI.updateUser(userId, { 
        plan: 'growth',
        currentPeriodEnd: nextYear.toISOString()
      });
      fetchUsers();
    } catch (err) {
      alert('Failed to grant plan');
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm(`PERMANENTLY DELETE this user? This cannot be undone.`)) return;
    try {
      await adminAPI.deleteUser(userId);
      fetchUsers();
    } catch {
      alert('Deletion failed.');
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchUsers, 300);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  return (
    <div className="space-y-8">
      {editUser && <EditModal user={editUser} onClose={() => setEditUser(null)} onSave={fetchUsers} />}
      {showAdd && <AddUserModal onClose={() => setShowAdd(false)} onSave={fetchUsers} />}

      <Card>
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
            <input
              type="text"
              placeholder="Search member identity..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-white/[0.03] pl-11 pr-4 py-3.5 border border-white/5 rounded-2xl text-sm text-white focus:outline-none focus:border-gold/50 transition-all placeholder:text-white/10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={planFilter}
              onChange={e => { setPlanFilter(e.target.value); setPage(1); }}
              className="bg-[#1a1a1a] border border-white/10 rounded-2xl px-5 py-3 text-[11px] font-black uppercase tracking-widest text-white/70 focus:outline-none focus:border-gold cursor-pointer"
            >
              <option value="">All Tiers</option>
              {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <button 
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-3 px-5 py-3 text-[11px] font-black uppercase tracking-widest bg-gold text-black rounded-2xl hover:bg-white transition-all shadow-lg"
            >
              <Users size={14} /> 
              <span>Add Member</span>
            </button>
            <button 
              onClick={fetchUsers} 
              className="flex items-center gap-3 px-4 py-3 border border-white/10 rounded-2xl hover:bg-white/5 transition-all text-white/50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 
            </button>
          </div>
        </div>

        <div className="text-[10px] text-white/20 font-black uppercase tracking-widest mb-6 ml-1">
          {total.toLocaleString('en-IN')} Members Registered
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5">
                {['Member', 'Tier', 'Consumption', 'Expiry', 'Safety', 'Edit'].map(h => (
                  <th key={h} className="text-[9px] font-black uppercase tracking-widest text-white/20 pb-4 pr-6">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && !users.length ? (
                <tr><td colSpan={6} className="py-20 text-center text-white/10 text-[11px] font-black uppercase tracking-widest">Scanning Registry...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6}><EmptyState icon={Users} message="No members found" /></td></tr>
              ) : users.map(u => (
                <tr key={u._id} className="border-b border-white/[0.03] last:border-0 hover:bg-white/[0.01] transition-colors group">
                  <td className="py-5 pr-6">
                    <div className="font-black text-white text-sm tracking-tight">{u.name || 'Unnamed'}</div>
                    <div className="text-[10px] text-white/20 font-bold">{u.email}</div>
                  </td>
                  <td className="py-5 pr-6"><PlanBadge plan={u.plan} /></td>
                  <td className="py-5 pr-6">
                    <div className="text-xs font-black text-white opacity-80">{u.generationsUsed} <span className="opacity-30">/ {u.generationsLimit}</span></div>
                    <div className="w-20 h-0.5 bg-white/5 rounded-full mt-2 overflow-hidden">
                       <div className="h-full bg-gold/50" style={{ width: `${Math.min(100, (u.generationsUsed/u.generationsLimit)*100)}%` }} />
                    </div>
                  </td>
                  <td className="py-5 pr-6">
                    <div className="text-[10px] font-black text-white/40 uppercase tracking-tighter">
                      {u.currentPeriodEnd ? new Date(u.currentPeriodEnd).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Lifetime'}
                    </div>
                  </td>
                  <td className="py-5 pr-6">
                    {u.isBanned
                      ? <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">Suspended</span>
                      : <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">Active</span>
                    }
                  </td>
                  <td className="py-5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditUser(u)}
                        className="w-10 h-10 rounded-full border border-white/5 bg-white/5 flex items-center justify-center text-white/20 hover:text-gold hover:border-gold/30 hover:bg-gold/5 transition-all"
                      >
                        <RotateCcw size={14} />
                      </button>
                      <button 
                        onClick={() => grantGrowth(u._id)}
                        className="px-3 py-1.5 bg-gold/10 text-gold rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-gold hover:text-black transition-all"
                        title="Grant 1 Year Growth Plan"
                      >
                        Grant Growth
                      </button>
                      <button 
                        onClick={() => deleteUser(u._id)}
                        className="p-2 text-white/10 hover:text-red-500 transition-colors"
                        title="Delete Account"
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

        <Pagination page={page} totalPages={totalPages} onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} />
      </Card>
    </div>
  );
}
