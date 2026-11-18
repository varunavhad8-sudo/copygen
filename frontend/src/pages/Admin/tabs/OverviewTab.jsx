import { Users, TrendingUp, Zap, Activity, Database, Server, Clock, Cpu, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { StatCard, PlanBadge, SectionHeader, Card } from '../components/shared';

export default function OverviewTab({ stats, health, onRefresh, loading }) {
  if (!stats || !health) return (
    <div className="flex justify-center py-20 text-white/20">
      <RefreshCw size={24} className="animate-spin" />
    </div>
  );

  return (
    <div className="space-y-10">
      {/* Stat Cards */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={Users}     label="Total Users"     value={stats.totalUsers?.toLocaleString('en-IN')} />
          <StatCard icon={TrendingUp} label="Paid Users"     value={stats.paidUsers?.toLocaleString('en-IN')} sub="Starter · Growth · Agency" />
          <StatCard icon={Zap}       label="Conversion Rate" value={`${stats.conversionRate}%`} sub="Free → Paid" />
          <StatCard
            icon={Activity} label="System Status"
            value={health.status === 'ok' ? 'Healthy' : 'Issues'}
            color={health.status === 'ok' ? 'text-green-500' : 'text-red-400'}
          />
        </div>
      </section>

      {/* Plan Distribution + System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <SectionHeader icon={Database} title="Plan Distribution" />
          <div className="space-y-5">
            {stats.planBreakdown && Object.entries(stats.planBreakdown).map(([plan, count]) => {
              const pct = stats.totalUsers > 0 ? Math.round((count / stats.totalUsers) * 100) : 0;
              return (
                <div key={plan}>
                  <div className="flex justify-between items-center mb-2.5">
                    <PlanBadge plan={plan} />
                    <span className="text-xs font-black text-white">
                      {count.toLocaleString('en-IN')} <span className="text-white/20 font-bold ml-1">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full bg-gold rounded-full shadow-[0_0_8px_rgba(201,168,76,0.5)]"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <SectionHeader icon={Server} title="System Health" />
          <div className="space-y-4">
            {[
              { icon: Database, label: 'Database',    value: health.db,              ok: health.db === 'connected' },
              { icon: Clock,    label: 'Uptime',      value: `${Math.floor((health.uptime || 0) / 3600)}h ${Math.floor(((health.uptime || 0) % 3600) / 60)}m` },
              { icon: Cpu,      label: 'Memory',      value: `${health.memoryMB} MB` },
              { icon: Zap,      label: 'Node',        value: health.nodeVersion       },
              { icon: Activity, label: 'Environment', value: health.environment       },
            ].map(({ icon: Icon, label, value, ok }) => (
              <div key={label} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3 text-white/30">
                  <Icon size={14} className="opacity-50" /><span className="text-xs font-black uppercase tracking-widest">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {ok === true  && <CheckCircle size={12} className="text-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]" />}
                  {ok === false && <AlertTriangle size={12} className="text-red-400" />}
                  <span className="text-xs font-black text-white tracking-tight">{value}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Signups */}
      <Card>
        <SectionHeader icon={Users} title="Recent Signups" />
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5">
                {['User', 'Plan', 'Usage', 'Joined'].map(h => (
                  <th key={h} className="text-[9px] font-black uppercase tracking-widest text-white/20 pb-4 pr-6">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.recentUsers?.map((u, i) => (
                <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors group">
                  <td className="py-4 pr-6">
                    <div className="font-black text-white text-sm tracking-tight">{u.name}</div>
                    <div className="text-[10px] text-white/30 font-bold">{u.email}</div>
                  </td>
                  <td className="py-4 pr-6"><PlanBadge plan={u.plan} /></td>
                  <td className="py-4 pr-6 font-black text-white text-xs opacity-70">{u.generationsUsed} gens</td>
                  <td className="py-4 text-[10px] text-white/30 font-black uppercase tracking-wider">
                    {new Date(u.joinedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
