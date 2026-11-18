import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  ChevronDown, 
  TrendingUp, 
  TrendingDown, 
  Bookmark, 
  Users, 
  Zap, 
  Info, 
  BarChart2, 
  Sparkles, 
  Mic, 
  Clock,
  ArrowUp,
  ArrowDown,
  ChevronRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Area, 
  AreaChart,
  PieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { useNavigate, useLocation } from 'react-router-dom';
import { analyticsAPI, clientsAPI } from '../utils/api';

const DATE_RANGES = [
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: '3m', label: 'Last 3 months' },
  { id: '1y', label: 'This year' }
];

const COLORS = ["#7c3aed", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const Analytics = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Parse clientId from URL if present
  const queryParams = new URLSearchParams(location.search);
  const initialClientId = queryParams.get('client') || '';

  // --- STATE ---
  const [dateRange, setDateRange] = useState('30d');
  const [selectedClientId, setSelectedClientId] = useState(initialClientId);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [activityData, setActivityData] = useState([]);
  const [formatsData, setFormatsData] = useState([]);
  const [clientsData, setClientsData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);

  // --- FETCH CLIENTS ---
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const data = await clientsAPI.getAll();
        const list = Array.isArray(data) ? data : data.clients || [];
        setClients(list);
      } catch (err) {
        console.error('Failed to fetch clients:', err);
      }
    };
    fetchClients();
  }, []);

  // --- DATA FETCH ---
  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      try {
        const [overview, activity, formats, clientsList, recent] = 
          await Promise.all([
            analyticsAPI.getOverview(dateRange, selectedClientId).catch(() => ({ totalGenerations: 0, activeClients: 0, brandVoices: 0, favoriteOutputs: 0 })),
            analyticsAPI.getActivity(dateRange === '7d' ? 7 : 
              dateRange === '30d' ? 30 : 
              dateRange === '90d' ? 90 : 365, selectedClientId).catch(() => []),
            analyticsAPI.getFormats(dateRange, selectedClientId).catch(() => []),
            analyticsAPI.getClients(dateRange).catch(() => []), // Global top clients
            analyticsAPI.getRecent(selectedClientId).catch(() => []),
          ]);
        
        setStats(overview?.summary || overview);
        setActivityData(Array.isArray(activity) ? activity 
          : activity.usageVolume || activity.data || []);
        setFormatsData(Array.isArray(formats) ? formats 
          : formats.breakdown || formats.data || []);
        setClientsData(Array.isArray(clientsList) ? clientsList 
          : clientsList.topClients || clientsList.data || []);
        setRecentActivity(Array.isArray(recent) ? recent 
          : recent.outputs || recent.data || []);
      } catch (err) {
        console.error('[Analytics] Critical failure:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, [dateRange, selectedClientId]);

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  // --- HELPERS ---
  const activeRangeLabel = DATE_RANGES.find(r => r.id === dateRange)?.label;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#252b3b] border border-[#2a2f42] rounded-lg px-3 py-2 shadow-xl">
          <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">{label}</p>
          <p className="text-white text-sm font-semibold">{payload[0].value} generations</p>
        </div>
      );
    }
    return null;
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'generation': return <Sparkles size={16} className="text-purple-400" />;
      case 'save': return <Bookmark size={16} className="text-blue-400" />;
      case 'client': return <Users size={16} className="text-green-400" />;
      case 'voice': return <Mic size={16} className="text-orange-400" />;
      default: return <Zap size={16} className="text-yellow-400" />;
    }
  };

  const getActivityBg = (type) => {
    switch (type) {
      case 'generation': return 'bg-purple-600/20';
      case 'save': return 'bg-blue-600/20';
      case 'client': return 'bg-green-600/20';
      case 'voice': return 'bg-orange-600/20';
      default: return 'bg-yellow-600/20';
    }
  };

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-[#0f1117] p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-slate-400 text-sm mt-1">
            {selectedClientId 
              ? `Performance data for ${clients.find(c => c._id === selectedClientId)?.name || 'Client'}`
              : 'Track your generation activity, usage, and output performance.'}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Client Selector */}
          <div className="relative">
            <div 
              onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
              className="bg-[#1a1f2e] border border-[#2a2f42] rounded-lg px-4 py-2.5 text-white text-sm flex items-center gap-3 cursor-pointer hover:border-purple-500/50 transition-all shadow-lg shadow-black/20 min-w-[180px]"
            >
              <Users size={16} className="text-slate-400" />
              <span className="font-medium truncate max-w-[120px]">
                {selectedClientId ? (clients.find(c => c._id === selectedClientId)?.name || 'Loading...') : 'All Clients'}
              </span>
              <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ml-auto ${isClientDropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            {isClientDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-[#1a1f2e] border border-[#2a2f42] rounded-xl shadow-2xl z-20 py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <button 
                  onClick={() => {
                    setSelectedClientId('');
                    setIsClientDropdownOpen(false);
                    navigate('/app/analytics');
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-all flex items-center gap-2 ${!selectedClientId ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-[#252b3b]'}`}
                >
                  <Users size={14} />
                  All Clients
                </button>
                <div className="h-[1px] bg-[#2a2f42] my-1 mx-2"></div>
                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                  {clients.length === 0 ? (
                    <div className="px-4 py-2 text-xs text-slate-500 italic">No clients found</div>
                  ) : (
                    clients.map(client => (
                      <button 
                        key={client._id}
                        onClick={() => {
                          setSelectedClientId(client._id);
                          setIsClientDropdownOpen(false);
                          navigate(`/app/analytics?client=${client._id}`);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-all flex items-center gap-2 ${selectedClientId === client._id ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-[#252b3b]'}`}
                      >
                        <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                        <span className="truncate">{client.name}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Date Range Selector */}
          <div className="relative">
            <div 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="bg-[#1a1f2e] border border-[#2a2f42] rounded-lg px-4 py-2.5 text-white text-sm flex items-center gap-3 cursor-pointer hover:border-purple-500/50 transition-all shadow-lg shadow-black/20 min-w-[160px]"
            >
              <Calendar size={16} className="text-slate-400" />
              <span className="font-medium">{activeRangeLabel}</span>
              <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ml-auto ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a1f2e] border border-[#2a2f42] rounded-xl shadow-2xl z-20 py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {DATE_RANGES.map(range => (
                  <button 
                    key={range.id}
                    onClick={() => {
                      setDateRange(range.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-all ${dateRange === range.id ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-[#252b3b]'}`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* No Data Banner */}
      {!isLoading && stats?.totalGenerations === 0 && (
        <div className="bg-purple-600/10 border border-purple-600/20 rounded-xl px-5 py-4 mb-6 flex flex-col sm:flex-row items-center gap-3 animate-in slide-in-from-top-4 duration-300">
          <Info size={18} className="text-purple-400 flex-shrink-0" />
          <p className="text-purple-300 text-sm text-center sm:text-left">
            You haven't generated any copy yet. Start generating to see your analytics data.
          </p>
          <button 
            onClick={() => navigate('/app/generate')}
            className="text-purple-400 text-sm font-bold hover:underline ml-auto flex items-center gap-1.5"
          >
            Generate Now <ArrowUp size={14} className="rotate-45" />
          </button>
        </div>
      )}

      {/* Top Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Stat 1: Generations */}
        <div className="bg-[#1a1f2e] border border-[#2a2f42] rounded-xl p-5 hover:border-purple-500/30 transition-colors group">
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-3 w-24 bg-[#252b3b] rounded"></div>
              <div className="h-8 w-16 bg-[#252b3b] rounded"></div>
              <div className="h-4 w-32 bg-[#252b3b] rounded-full"></div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Generations</span>
                <TrendingUp size={16} className="text-purple-400" />
              </div>
              <div className="text-3xl font-bold text-white group-hover:text-purple-400 transition-colors">{stats?.totalGenerations || 0}</div>
              <div className="mt-3 flex items-center gap-1.5 bg-green-500/10 text-green-400 text-[10px] px-2 py-0.5 rounded-full font-bold w-fit">
                <ArrowUp size={10} /> +{stats?.changes?.generations || 0}% vs last month
              </div>
            </>
          )}
        </div>

        {/* Stat 2: Outputs Saved */}
        <div className="bg-[#1a1f2e] border border-[#2a2f42] rounded-xl p-5 hover:border-blue-500/30 transition-colors group">
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-3 w-24 bg-[#252b3b] rounded"></div>
              <div className="h-8 w-16 bg-[#252b3b] rounded"></div>
              <div className="h-4 w-32 bg-[#252b3b] rounded-full"></div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Outputs Saved</span>
                <Bookmark size={16} className="text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-white group-hover:text-blue-400 transition-colors">{stats?.outputsSaved || 0}</div>
              <div className="mt-3 text-slate-500 text-[11px] font-medium">
                {stats?.totalGenerations ? Math.round((stats.outputsSaved / stats.totalGenerations) * 100) : 0}% save rate
              </div>
            </>
          )}
        </div>

        {/* Stat 3: Active Clients */}
        <div className="bg-[#1a1f2e] border border-[#2a2f42] rounded-xl p-5 hover:border-green-500/30 transition-colors group">
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-3 w-24 bg-[#252b3b] rounded"></div>
              <div className="h-8 w-16 bg-[#252b3b] rounded"></div>
              <div className="h-4 w-32 bg-[#252b3b] rounded-full"></div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Active Clients</span>
                <Users size={16} className="text-green-400" />
              </div>
              <div className="text-3xl font-bold text-white group-hover:text-green-400 transition-colors">{stats?.activeClients || 0}</div>
              <div className="mt-3 text-slate-500 text-[11px] font-medium">
                {stats?.changes?.clients || 0} new this month
              </div>
            </>
          )}
        </div>

        {/* Stat 4: Avg/Day */}
        <div className="bg-[#1a1f2e] border border-[#2a2f42] rounded-xl p-5 hover:border-yellow-500/30 transition-colors group">
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-3 w-24 bg-[#252b3b] rounded"></div>
              <div className="h-8 w-16 bg-[#252b3b] rounded"></div>
              <div className="h-4 w-32 bg-[#252b3b] rounded-full"></div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Avg. per day</span>
                <Zap size={16} className="text-yellow-400" />
              </div>
              <div className="text-3xl font-bold text-white group-hover:text-yellow-400 transition-colors">{stats?.avgPerDay || 0}</div>
              <div className="mt-3 text-slate-500 text-[11px] font-medium">
                Based on last {dateRange === '30d' ? '30' : dateRange === '7d' ? '7' : '90'} days
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="space-y-4">
        {/* CHART 1: Generation Activity */}
        <div className="bg-[#1a1f2e] border border-[#2a2f42] rounded-xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-white font-semibold text-base">Generation Activity</h3>
              <p className="text-slate-500 text-xs mt-1">Daily generations over time</p>
            </div>
            {!isLoading && activityData.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-purple-600/10 border border-purple-600/20 rounded-full">
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                <span className="text-purple-400 text-[10px] font-bold uppercase tracking-wider">Live Tracking</span>
              </div>
            )}
          </div>

          <div className="h-64 w-full">
            {isLoading ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#151a28] rounded-lg border border-[#2a2f42] animate-pulse">
                <BarChart2 size={32} className="text-slate-700 mb-2" />
                <span className="text-slate-600 text-xs font-medium">Loading activity data...</span>
              </div>
            ) : activityData.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#151a28] rounded-lg border border-[#2a2f42]">
                <BarChart2 size={32} className="text-slate-700 mb-2" />
                <span className="text-slate-600 text-xs font-medium">No generation data yet</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="generationGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.3}/>
                      <stop offset="100%" stopColor="#7c3aed" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#2a2f42" strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#475569" 
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickFormatter={formatDate}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="#475569" 
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#7c3aed" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#generationGradient)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Row 2: Two Charts Side-by-Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* CHART 2: Top Formats (Pie) */}
          <div className="bg-[#1a1f2e] border border-[#2a2f42] rounded-xl p-6">
            <h3 className="text-white font-semibold text-base mb-6">Top Formats Used</h3>
            
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <div className="w-full sm:w-1/2 h-[220px]">
                {isLoading ? (
                  <div className="w-full h-full flex items-center justify-center bg-[#151a28] rounded-full border-8 border-[#252b3b] animate-pulse"></div>
                ) : formatsData.length === 0 ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-[#151a28] rounded-full border-8 border-[#252b3b]">
                    <span className="text-slate-700 text-xs">No data</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={formatsData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        animationDuration={1000}
                        stroke="none"
                      >
                        {formatsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Custom Legend */}
              <div className="w-full sm:w-1/2 space-y-3">
                {isLoading ? (
                  [...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-2 animate-pulse">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#252b3b]"></div>
                      <div className="h-3 w-full bg-[#252b3b] rounded"></div>
                    </div>
                  ))
                ) : (
                  formatsData.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="text-slate-300 text-xs font-medium flex-1 truncate">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white text-xs font-bold">{item.value}</span>
                        <span className="text-slate-500 text-[10px]">({Math.round((item.value / formatsData.reduce((a, b) => a + b.value, 0)) * 100)}%)</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* CHART 3: Top Clients (Bar) */}
          <div className="bg-[#1a1f2e] border border-[#2a2f42] rounded-xl p-6">
            <h3 className="text-white font-semibold text-base mb-6">Top Clients</h3>
            
            <div className="h-[220px] w-full">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-6 bg-[#252b3b] rounded w-full animate-pulse"></div>
                  ))}
                </div>
              ) : clientsData.length === 0 ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#151a28] rounded-lg border border-[#2a2f42]">
                  <span className="text-slate-700 text-xs">No client data yet</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    layout="vertical" 
                    data={clientsData} 
                    margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={80} 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(124, 58, 237, 0.05)' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-[#252b3b] border border-[#2a2f42] rounded-lg px-3 py-2 shadow-xl">
                              <p className="text-white text-sm font-semibold">{payload[0].value} generations</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="#7c3aed" 
                      radius={[0, 4, 4, 0]} 
                      barSize={18}
                      animationDuration={1000}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Row 3: Recent Activity Feed */}
        <div className="bg-[#1a1f2e] border border-[#2a2f42] rounded-xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-[#2a2f42] flex justify-between items-center bg-[#1e2433]">
            <h3 className="text-white font-semibold text-base">Recent Activity</h3>
            <button 
              onClick={() => navigate('/app/outputs')}
              className="text-purple-400 text-sm font-bold hover:text-purple-300 transition-colors flex items-center gap-1.5"
            >
              View All Outputs <ChevronRight size={14} />
            </button>
          </div>

          <div className="divide-y divide-[#2a2f42]">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-4 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-[#252b3b]"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/2 bg-[#252b3b] rounded"></div>
                    <div className="h-2 w-1/4 bg-[#252b3b] rounded"></div>
                  </div>
                </div>
              ))
            ) : recentActivity.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <Clock size={32} className="text-slate-700 mb-2" />
                <p className="text-slate-600 text-sm">No activity recorded yet</p>
              </div>
            ) : (
              recentActivity.map(event => (
                <div key={event.id} className="px-6 py-4 flex items-center gap-4 hover:bg-[#252b3b]/30 transition-colors cursor-default group">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform ${getActivityBg(event.type)}`}>
                    {getActivityIcon(event.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{event.generatedText || event.text}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{event.format || event.sub}</p>
                  </div>
                  <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                    {formatDate(event.createdAt || event.time)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
