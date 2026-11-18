import { useState, useEffect } from 'react';
import { BarChart2, RefreshCw, Users, Zap, TrendingUp } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { adminAPI } from '../../../utils/api';
import { StatCard, SectionHeader, Card, EmptyState } from '../components/shared';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a] border border-white/10 text-white text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-2xl shadow-2xl">
      <div className="text-white/30 mb-2">{label}</div>
      <div className="text-gold flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-gold shadow-[0_0_8px_#c9a84c]" />
        {payload[0].value} {payload[0].name}
      </div>
    </div>
  );
};

export default function GrowthTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getAnalytics()
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><RefreshCw size={24} className="animate-spin text-gold" /></div>;
  if (!data) return null;

  const { signupsPerDay, featureUsage, conversionFunnel, onboardingRate, churnRate } = data;

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Users}      label="Global Reach"      value={conversionFunnel.totalUsers?.toLocaleString('en-IN')} sub="Total Registrations" />
        <StatCard icon={TrendingUp} label="Paid Base"         value={conversionFunnel.totalPaid?.toLocaleString('en-IN')} sub="Active Subscriptions" />
        <StatCard icon={Zap}        label="Conversion"        value={`${conversionFunnel.conversionRate}%`} sub="Free → Premium" />
        <StatCard icon={BarChart2}  label="Onboarding"        value={`${onboardingRate}%`} sub="Activation Velocity" />
      </div>

      {/* Daily Signups Area Chart */}
      <Card>
        <SectionHeader icon={Users} title="Network Expansion (30 Days)" />
        <div className="h-[280px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={signupsPerDay} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#c9a84c" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#c9a84c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={d => d.slice(5)}
                tick={{ fontSize: 10, fontWeight: 900, fill: '#ffffff20' }}
                axisLine={false} tickLine={false}
                interval={4}
                dy={10}
              />
              <YAxis 
                allowDecimals={false} 
                tick={{ fontSize: 10, fontWeight: 900, fill: '#ffffff20' }} 
                axisLine={false} tickLine={false} 
              />
              <Tooltip
                content={<CustomTooltip />}
                labelFormatter={d => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              />
              <Area
                type="monotone" dataKey="signups" name="signups"
                stroke="#c9a84c" strokeWidth={3}
                fill="url(#growthGradient)"
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Feature Usage */}
        <Card>
          <SectionHeader icon={Zap} title="Feature Intensity" />
          <div className="h-[280px] w-full mt-4">
            {featureUsage?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={featureUsage} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category" dataKey="name"
                    tick={{ fontSize: 9, fill: '#ffffff40', fontWeight: 900 }}
                    axisLine={false} tickLine={false}
                    width={80}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  />
                  <Bar dataKey="count" name="utilization" fill="#c9a84c" radius={[0, 8, 8, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={Zap} message="Awaiting usage data" />
            )}
          </div>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <SectionHeader icon={TrendingUp} title="Conversion Funnel" />
          <div className="space-y-8 mt-6">
            {[
              { label: 'Market Capture',       value: conversionFunnel.totalUsers, pct: 100,       color: 'bg-white/10' },
              { label: 'Revenue Yield',        value: conversionFunnel.totalPaid,  pct: conversionFunnel.conversionRate, color: 'bg-gold' },
            ].map(({ label, value, pct, color }) => (
              <div key={label} className="group">
                <div className="flex justify-between items-end mb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{label}</span>
                  <div className="text-right">
                    <span className="text-sm font-black text-white">{value?.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-white/20 font-bold ml-2">({pct}%)</span>
                  </div>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(201,168,76,0.3)]`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}

            <div className="mt-12 pt-8 border-t border-white/5 grid grid-cols-2 gap-8">
              <div className="text-center p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                <div className="text-2xl font-black text-white tracking-tighter">{conversionFunnel.conversionRate}%</div>
                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mt-2">Cvr Rate</div>
              </div>
              <div className="text-center p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                <div className={`text-2xl font-black tracking-tighter ${parseFloat(churnRate) > 10 ? 'text-red-400' : 'text-green-400'}`}>{churnRate}%</div>
                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mt-2">Churn Vol</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
