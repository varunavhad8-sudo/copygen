import { useState, useEffect } from 'react';
import { Zap, TrendingUp, RefreshCw, Cpu } from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { adminAPI } from '../../../utils/api';
import { StatCard, SectionHeader, Card, PlanBadge, EmptyState } from '../components/shared';

const MODEL_COLORS = ['#c9a84c', '#3b82f6', '#a855f7', '#10b981', '#f43f5e', '#f97316'];

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={900}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CustomTooltip = ({ active, payload, convert }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a] border border-white/10 text-white text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-2xl shadow-2xl">
      <div className="text-white/30 mb-2">{payload[0].name}</div>
      <div className="text-gold flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-gold" />
        {convert(payload[0].value)} spent
      </div>
    </div>
  );
};

export default function AiCostTab({ convert, currency }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getAiUsage()
      .then(res => setData(res.data || res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><RefreshCw size={24} className="animate-spin text-gold" /></div>;
  if (!data) return null;

  const monthTrend = data.lastMonthCost > 0
    ? (((data.thisMonthCost - data.lastMonthCost) / data.lastMonthCost) * 100).toFixed(1)
    : null;

  const avgCost = data.totalGenerations > 0 ? data.totalCost / data.totalGenerations : 0;

  return (
    <div className="space-y-8">
      {/* Currency notice */}
      {currency?.code !== 'INR' && (
        <div className="flex items-center gap-3 px-5 py-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-blue-400">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span>LLM Costs converted via live FX rates · {currency.code}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Zap}         label="Total Burn"            value={convert(data.totalCost)}     sub="Cumulative API Expense" />
        <StatCard icon={TrendingUp}  label="Monthly Burn"          value={convert(data.thisMonthCost)} trend={monthTrend != null ? parseFloat(monthTrend) : undefined} />
        <StatCard icon={TrendingUp}  label="Total Generations"     value={data.totalGenerations?.toLocaleString('en-IN')} />
        <StatCard icon={Cpu}         label="Unit Cost (Avg)"       value={convert(avgCost)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Model Donut Chart */}
        <Card>
          <SectionHeader icon={Cpu} title="Expense by Model" />
          <div className="h-[280px] w-full">
            {data.modelBreakdown?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.modelBreakdown}
                    dataKey="cost"
                    nameKey="name"
                    cx="50%" cy="50%"
                    innerRadius={70} outerRadius={110}
                    labelLine={false}
                    label={<CustomLabel />}
                    stroke="none"
                    paddingAngle={2}
                  >
                    {data.modelBreakdown.map((_, i) => (
                      <Cell key={i} fill={MODEL_COLORS[i % MODEL_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip convert={convert} />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle" 
                    iconSize={8}
                    formatter={(val) => <span className="text-[10px] font-black uppercase tracking-widest text-white/50 ml-2">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={Cpu} message="No AI data mapped" />
            )}
          </div>
        </Card>

        {/* Model Breakdown Table */}
        <Card>
          <SectionHeader icon={Zap} title="Compute Distribution" />
          {data.modelBreakdown?.length > 0 ? (
            <div className="space-y-4">
              {data.modelBreakdown.map((m, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 group transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: MODEL_COLORS[i % MODEL_COLORS.length], boxShadow: `0 0 10px ${MODEL_COLORS[i % MODEL_COLORS.length]}50` }} />
                    <span className="text-xs font-black uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">{m.name || 'Unknown Engine'}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-white tracking-tight">{m.count?.toLocaleString('en-IN')} gens</div>
                    <div className="text-[10px] font-black text-white/20 uppercase tracking-widest">{convert(m.cost)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Zap} message="Awaiting first compute..." />
          )}
        </Card>
      </div>

      {/* Top 10 Users by Cost */}
      <Card>
        <SectionHeader icon={Zap} title={`High-Intensity Consumers (${currency?.code || 'INR'})`} />
        {data.topUsers?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  {['Rank', 'Identity', 'Tier', 'Volume', 'Total Expense'].map(h => (
                    <th key={h} className="text-[9px] font-black uppercase tracking-widest text-white/20 pb-4 pr-6">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.topUsers.map((u, i) => (
                  <tr key={i} className="border-b border-white/[0.03] last:border-0 hover:bg-white/[0.01] transition-colors group">
                    <td className="py-5 pr-6 font-black text-white/10 text-xs italic tracking-widest">#{i + 1}</td>
                    <td className="py-5 pr-6">
                      <div className="font-black text-white text-sm tracking-tight">{u.name || 'Unknown Member'}</div>
                      <div className="text-[10px] text-white/20 font-bold">{u.email}</div>
                    </td>
                    <td className="py-5 pr-6"><PlanBadge plan={u.plan} /></td>
                    <td className="py-5 pr-6 font-black text-white text-xs opacity-70">{u.count?.toLocaleString('en-IN')} <span className="text-[10px] font-bold text-white/20 ml-1">UNITS</span></td>
                    <td className="py-5 font-black text-gold text-sm tracking-tight shadow-gold/20 drop-shadow-md">{convert(u.totalCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={Zap} message="No consumption records" />
        )}
      </Card>
    </div>
  );
}
