import { useState, useEffect } from 'react';
import { TrendingUp, Users, TrendingDown, AlertCircle, RefreshCw } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { adminAPI } from '../../../utils/api';
import { StatCard, SectionHeader, Card, PlanBadge, PLAN_PRICES } from '../components/shared';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a] border border-white/10 text-white text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-2xl shadow-2xl">
      <div className="text-white/30 mb-2">{label}</div>
      <div className="text-gold flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-gold" />
        {payload[0].value} active subscribers
      </div>
    </div>
  );
};

export default function RevenueTab({ convert, currency }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getRevenue();
      setData(res.data || res);
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  if (loading) return <div className="flex justify-center py-20"><RefreshCw size={24} className="animate-spin text-gold" /></div>;
  if (!data) return null;

  const growthPct = data.paidGrowthPct != null ? parseFloat(data.paidGrowthPct) : null;

  return (
    <div className="space-y-8">
      {/* Currency notice */}
      {currency && currency.code !== 'INR' && (
        <div className="flex items-center gap-3 px-5 py-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-blue-400">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span>Rates converted from INR · Source: Frankfurter API</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={TrendingUp}  label="Est. MRR"              value={convert(data.mrr)}     sub="Projected Monthly Revenue" />
        <StatCard icon={TrendingUp}  label="Est. ARR"              value={convert(data.arr)}     sub="Annualized Run Rate" />
        <StatCard icon={Users}       label="Net New Paid"          value={data.newPaidThisMonth} trend={growthPct} />
        <StatCard icon={TrendingDown} label="Churn Risks"          value={data.churned} color="text-amber-500" sub="Downgrades Scheduled" />
      </div>

      {/* 6-Month Chart */}
      <Card>
        <SectionHeader icon={TrendingUp} title="Growth Velocity (6 Months)" />
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.chartData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 10, fontWeight: 900, fill: '#ffffff20' }} 
                axisLine={false} 
                tickLine={false}
                dy={10}
              />
              <YAxis 
                allowDecimals={false} 
                tick={{ fontSize: 10, fontWeight: 900, fill: '#ffffff20' }} 
                axisLine={false} 
                tickLine={false}
              />
              <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ fill: 'rgba(255,255,255,0.02)' }} 
              />
              <Bar 
                dataKey="paid" 
                fill="#c9a84c" 
                radius={[8, 8, 0, 0]} 
                barSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Plan MRR Breakdown */}
      <Card>
        <SectionHeader icon={TrendingUp} title={`MRR Distribution (${currency?.code || 'INR'})`} />
        <div className="space-y-6 mt-4">
          {Object.entries(data.planBreakdown || {}).map(([plan, count]) => {
            const priceINR  = PLAN_PRICES[plan] || 0;
            const planMrrINR = count * priceINR;
            const pct = data.mrr > 0 ? Math.round((planMrrINR / data.mrr) * 100) : 0;
            return (
              <div key={plan} className="group">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-24 flex-shrink-0"><PlanBadge plan={plan} /></div>
                  <div className="flex-1 flex justify-between items-end">
                    <div className="text-[10px] font-black uppercase tracking-widest text-white/40">
                      {count} Units @ {convert(priceINR)}
                    </div>
                    <div className="text-sm font-black text-white">{convert(planMrrINR)}</div>
                  </div>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gold rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(201,168,76,0.4)]" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[9px] text-white/10 mt-10 font-black uppercase tracking-widest leading-relaxed">
          * Estimates based on standard price tiers. <br/> 
          {currency?.code !== 'INR' && 'Converted using live FX rates.'}
        </p>
      </Card>

      {/* Alerts */}
      {data.expiredSubscriptions > 0 && (
        <div className="flex items-start gap-4 p-6 bg-amber-500/5 border border-amber-500/10 rounded-[32px]">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 flex-shrink-0">
            <AlertCircle size={20} />
          </div>
          <div>
            <div className="font-black text-amber-400 text-sm uppercase tracking-tight">{data.expiredSubscriptions} Subscription Discrepancies</div>
            <div className="text-xs text-white/30 font-bold mt-1 leading-relaxed">
              Detected active accounts with past-due billing cycles. Manual audit via Razorpay recommended.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
