import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Star, 
  MoreVertical, 
  Trash, 
  Clock, 
  Mic, 
  Copy, 
  Check, 
  SearchX, 
  ChevronLeft, 
  ChevronRight,
  ArrowRight,
  Filter,
  Sparkles,
  AlertCircle,
  X,
  Mail,
  Globe,
  Calendar,
  Grid
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { outputsAPI, clientsAPI } from '../utils/api';
import { parseContent } from '../utils/parseContent';

// --- CONSTANTS ---
const FORMATS = [
  "Social Media Post",
  "Facebook Ad Copy",
  "Google Search Ad",
  "Email Subject Line",
  "Cold Email Body",
  "Product Description",
  "Blog Post Intro",
  "Landing Page Headline",
  "CTA Button Text",
  "Instagram Caption",
  "Brand Tagline",
  "YouTube Description"
];

// --- UTILS ---
const getAvatarGradient = (name = 'Client') => {
  const gradients = [
    'from-[#8b5cf6] to-[#c9a84c]',
    'from-indigo-600 to-[#c9a84c]',
    'from-purple-600 to-amber-500',
    'from-violet-600 to-yellow-500',
    'from-pink-600 to-orange-400'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
};

const formatRelativeTime = (dateString) => {
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now - past) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const Outputs = () => {
  const navigate = useNavigate();

  // --- STATE ---
  const [outputs, setOutputs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [contentTypeFilter, setContentTypeFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState('Newest First');
  const [clients, setClients] = useState([]);
  
  // UI States
  const [copiedCardId, setCopiedCardId] = useState(null);
  const [deleteConfirming, setDeleteConfirming] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [error, setError] = useState(null);

  // --- DATA FETCH ---
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const data = await clientsAPI.getAll();
        const clientList = Array.isArray(data) ? data : (data.clients || []);
        setClients(clientList.map(c => ({
          id: c._id,
          name: c.name
        })));
      } catch (err) {
        setError("Failed to load clients. Please try again.");
      }
    };
    fetchClients();
  }, []);

  const fetchOutputs = async (page = 1) => {
    setIsLoading(true);
    try {
      const selectedClient = clients.find(c => c.name === clientFilter);
      
      const data = await outputsAPI.getAll({
        page,
        limit: 10,
        contentType: contentTypeFilter || undefined,
        clientId: selectedClient ? selectedClient.id : undefined,
        search: searchQuery || undefined,
        favorited: favoritesOnly || undefined,
      });
      
      const list = data.outputs || data.data || (Array.isArray(data) ? data : []);
      const total = data.total || data.totalCount || list.length;
      const totalPagesCount = data.pages || Math.ceil(total / 10) || 1;
      
      setOutputs(list);
      setTotalCount(total);
      setTotalPages(totalPagesCount);
      setCurrentPage(page);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOutputs(1);
  }, [contentTypeFilter, clientFilter, searchQuery, favoritesOnly, sortBy, clients]);

  const filteredOutputs = useMemo(() => {
    return outputs.filter(o => {
      const text = o.generatedText || o.content || o.text || '';
      const clientName = o.clientId?.name || 'Unknown';
      const matchesSearch = text.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (o.contentType && o.contentType.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSearch;
    });
  }, [outputs, searchQuery]);

  const hasActiveFilters = searchQuery !== '' || contentTypeFilter !== '' || clientFilter !== '' || favoritesOnly;

  // --- ACTIONS ---
  const handleToggleFavorite = async (output) => {
    setOutputs(prev => prev.map(o => 
      o._id === output._id ? { ...o, favorited: !output.favorited } : o
    ));
    
    try {
      await outputsAPI.toggleFavorite(output._id, !output.favorited);
    } catch (err) {
      setError(err.message);
      setOutputs(prev => prev.map(o => 
        o._id === output._id ? { ...o, favorited: output.favorited } : o
      ));
    }
  };

  const handleDelete = async (outputId) => {
    try {
      await outputsAPI.delete(outputId);
      setOutputs(prev => prev.filter(o => o._id !== outputId));
      setTotalCount(prev => prev - 1);
      setDeleteConfirming(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCardId(id);
    setTimeout(() => setCopiedCardId(null), 2000);
  };

  const handleDownload = (output) => {
    const text = output.generatedText || output.content || output.text || '';
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `copygen-${output._id}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };



  const clearFilters = () => {
    setSearchQuery('');
    setContentTypeFilter('');
    setClientFilter('');
    setFavoritesOnly(false);
  };

  const getFormatBadgeColor = (type) => {
    if (!type) return 'bg-slate-500/10 border-slate-500/20 text-slate-400';
    const f = String(type).toLowerCase();
    if (f.includes('social') || f.includes('instagram')) return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
    if (f.includes('ad')) return 'bg-orange-500/10 border-orange-500/20 text-orange-400';
    if (f.includes('email')) return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
    if (f.includes('headline') || f.includes('description') || f.includes('intro') || f.includes('seo')) return 'bg-green-500/10 border-green-500/20 text-green-400';
    if (f.includes('cta') || f.includes('tagline')) return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
    return 'bg-purple-500/10 border-purple-500/20 text-purple-400';
  };

  // --- HIGH FIDELITY MICRO PREVIEWS ---
  const MicroPreview = ({ contentType, generatedText, clientName }) => {
    const type = (contentType || '').toLowerCase().replace(/[-]/g, '_');
    const parsed = parseContent(generatedText, contentType);

    const renderInner = () => {
      if (type.includes('social') || type.includes('instagram') || type.includes('caption')) {
        return (
          <div className="p-5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full bg-gradient-to-tr ${getAvatarGradient(clientName)} flex items-center justify-center text-[9px] font-black text-white shadow-sm`}>
                  {clientName?.[0] || 'C'}
                </div>
                <div className="text-left leading-none">
                  <span className="text-[10px] font-bold text-white tracking-wide flex items-center gap-1">
                    {clientName || 'Brand'}
                    <span className="w-2.5 h-2.5 rounded-full bg-[#c9a84c] flex items-center justify-center text-[6px] text-black">✓</span>
                  </span>
                  <span className="text-[8px] text-slate-500 font-semibold tracking-wide mt-0.5 block">Sponsored</span>
                </div>
              </div>
              <span className="text-[8px] bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Social Post</span>
            </div>
            
            <p className="text-[11px] text-slate-300 line-clamp-3 leading-relaxed tracking-wide text-left">
              {parsed.body}
            </p>
            
            {parsed.hashtags && parsed.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1.5">
                {parsed.hashtags.slice(0, 3).map((tag, i) => (
                  <span key={i} className="text-[#c9a84c] font-black text-[9px]">{tag}</span>
                ))}
              </div>
            )}
          </div>
        );
      }

      if (type.includes('ad') || type.includes('google')) {
        const isGoogle = type.includes('google');
        if (isGoogle) {
          return (
            <div className="p-5 space-y-2 text-left">
              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Globe size={11} className="text-slate-500" />
                  <span className="text-[9px] text-[#006621] font-bold">google.com/ad</span>
                </div>
                <span className="text-[8px] bg-orange-500/10 border border-orange-500/20 text-orange-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Search Ad</span>
              </div>
              <div className="text-[12px] text-[#1a0dab] font-bold underline line-clamp-1 leading-normal">{parsed.headline || parsed.title || 'Special Campaign Headline'}</div>
              <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed tracking-wide">{parsed.body}</p>
            </div>
          );
        }
        return (
          <div className="p-5 space-y-3 text-left">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="text-[9px] text-slate-500 font-bold tracking-wide uppercase">Ad Showcase Preview</div>
              <span className="text-[8px] bg-orange-500/10 border border-orange-500/20 text-orange-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Social Ad</span>
            </div>
            <div className="space-y-1">
              <div className="text-[12px] font-bold text-white line-clamp-1">{parsed.headline || 'Ad Campaign Headline'}</div>
              <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{parsed.body}</p>
            </div>
            {parsed.cta && (
              <div className="inline-block px-3 py-1 bg-[#c9a84c]/10 border border-[#c9a84c]/20 rounded-full text-[8px] font-black text-[#c9a84c] uppercase tracking-wider">
                {parsed.cta}
              </div>
            )}
          </div>
        );
      }

      if (type.includes('email')) {
        return (
          <div className="p-5 space-y-2.5 text-left">
            <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-1.5">
              <div className="flex items-center gap-1.5">
                <Mail size={12} className="text-purple-400" />
                <span className="text-[9px] text-slate-500">From: {clientName || 'CopyGen'}</span>
              </div>
              <span className="text-[8px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Email Client</span>
            </div>
            
            <div className="text-[11px] text-slate-300 font-bold line-clamp-1 leading-normal">
              <span className="text-slate-500 font-normal mr-1">Subject:</span> 
              {parsed.subject || parsed.title || 'No Subject Defined'}
            </div>
            
            <p className="text-[10.5px] text-slate-400 line-clamp-2 leading-relaxed tracking-wide border-t border-white/5 pt-2 mt-1.5">
              {parsed.body}
            </p>
          </div>
        );
      }

      if (type.includes('seo') || type.includes('blog') || type.includes('intro')) {
        return (
          <div className="p-5 space-y-3 text-left">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="text-[9px] text-slate-500 font-mono tracking-wide uppercase">SEO Workspace Document</div>
              <span className="text-[8px] bg-green-500/10 border border-green-500/20 text-green-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">SEO Blog</span>
            </div>
            
            <div className="text-[12px] font-black text-white line-clamp-1 uppercase tracking-wide">{parsed.metaTitle || parsed.title || 'Optimised Content Topic'}</div>
            <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{parsed.metaDescription || parsed.body}</p>
            
            {parsed.faq && parsed.faq.length > 0 && (
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white/5 border border-white/10 rounded-full text-[8px] text-[#c9a84c] font-black uppercase tracking-wider">
                FAQ ({parsed.faq.length})
              </div>
            )}
          </div>
        );
      }

      // Default fallback card
      return (
        <div className="p-5 space-y-3.5 text-left">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Standard Document Content</div>
            <span className="text-[8px] bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Copy Document</span>
          </div>
          {parsed.title && <div className="text-[12px] font-bold text-white line-clamp-1">{parsed.title}</div>}
          <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed tracking-wide">{parsed.body}</p>
        </div>
      );
    };

    return (
      <div className="h-[185px] w-full bg-[#12141c]/60 border-b border-white/5 overflow-hidden group-hover:bg-[#12141c]/90 transition-all duration-300 relative">
        {renderInner()}
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#0f1118] to-transparent pointer-events-none opacity-80" />
      </div>
    );
  };

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-[#0f1117] p-6 lg:p-8 space-y-8">
      
      {/* Premium Dashboard Header Banner */}
      <div className="bg-gradient-to-r from-[#171a26]/80 to-[#12141c]/40 border border-white/5 rounded-3xl p-6 lg:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-[0_15px_30px_-5px_rgba(0,0,0,0.5)]">
        <div className="text-left space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-[#c9a84c]/10 border border-[#c9a84c]/20 text-[#c9a84c] px-3 py-1 rounded-full select-none">
            <Sparkles size={12} className="animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">CopyGen Library</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-white uppercase tracking-wider leading-none">Content Hub</h1>
          <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
            All your generated marketing copy — verified, strategically optimized, and ready to deploy.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto self-start md:self-center">

          
          <div className="bg-[#1a1c26] border border-white/5 text-slate-400 text-xs px-4 py-3 rounded-2xl whitespace-nowrap font-semibold shadow-inner select-none">
            <span className="text-white font-black font-mono mr-1.5">{totalCount}</span> Outputs
          </div>
        </div>
      </div>
      
      {error && (
        <div className="p-4.5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3.5 text-red-400 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle size={18} />
          <span className="font-medium text-left">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400/50 hover:text-red-400 transition-colors p-1 hover:bg-red-500/10 rounded-lg">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Modernized Glassmorphic Filter Board */}
      <div className="bg-[#12141c]/90 border border-white/10 rounded-2xl p-5 lg:p-6 shadow-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-center">
          
          {/* Search Box */}
          <div className="relative lg:col-span-4">
            <Search size={16} className="text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keywords, format or client..."
              className="w-full bg-[#1b1c2b] border border-white/5 rounded-xl pl-11 pr-4 py-3 text-white text-xs placeholder:text-slate-500 focus:border-[#c9a84c]/50 focus:outline-none transition-all duration-300 shadow-inner"
            />
          </div>

          {/* Format Select */}
          <div className="relative lg:col-span-2">
            <select 
              value={contentTypeFilter}
              onChange={(e) => setContentTypeFilter(e.target.value)}
              className="w-full bg-[#1b1c2b] border border-white/5 rounded-xl pl-4 pr-10 py-3 text-white text-xs font-semibold appearance-none cursor-pointer focus:border-[#c9a84c]/50 focus:outline-none transition-all duration-300"
            >
              <option value="">All Formats</option>
              {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Client Select */}
          <div className="relative lg:col-span-2">
            <select 
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="w-full bg-[#1b1c2b] border border-white/5 rounded-xl pl-4 pr-10 py-3 text-white text-xs font-semibold appearance-none cursor-pointer focus:border-[#c9a84c]/50 focus:outline-none transition-all duration-300"
            >
              <option value="">All Clients</option>
              {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Sort Selection */}
          <div className="relative lg:col-span-2">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-[#1b1c2b] border border-white/5 rounded-xl pl-4 pr-10 py-3 text-white text-xs font-semibold appearance-none cursor-pointer focus:border-[#c9a84c]/50 focus:outline-none transition-all duration-300"
            >
              <option>Newest First</option>
              <option>Oldest First</option>
              <option>By Client</option>
              <option>By Type</option>
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Favorites Switch Switcher */}
          <div className="lg:col-span-2 flex items-center justify-between sm:justify-start gap-3 bg-[#1b1c2b] border border-white/5 py-3 px-4 rounded-xl select-none">
            <span className="text-slate-400 text-xs font-bold whitespace-nowrap">Favorites</span>
            <button 
              onClick={() => setFavoritesOnly(!favoritesOnly)}
              className={`relative w-10 h-5.5 rounded-full transition-all duration-300 focus:outline-none ${favoritesOnly ? 'bg-[#c9a84c]' : 'bg-[#12141c]'}`}
            >
              <div className={`absolute top-1 left-1 bg-white w-3.5 h-3.5 rounded-full transition-transform duration-300 ${favoritesOnly ? 'translate-x-4.5 bg-black' : 'translate-x-0'}`}></div>
            </button>
          </div>

        </div>

        {/* Results summary indicators */}
        <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-4 px-1.5 select-none">
          <span className="text-slate-500 text-xs font-semibold">
            Showing <span className="text-slate-300">{filteredOutputs.length}</span> of <span className="text-slate-300">{totalCount}</span> marketing outputs
          </span>
          {hasActiveFilters && (
            <button 
              onClick={clearFilters}
              className="text-[#c9a84c] text-xs font-black uppercase tracking-wider hover:underline flex items-center gap-1 transition-all"
            >
              Clear Filter Panel
            </button>
          )}
        </div>
      </div>

      {/* Main Outputs List Canvas */}
      <div className="space-y-6">
        {isLoading ? (
          // Rich Skeleton Loading list
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-[#12141c]/50 border border-white/5 rounded-2xl h-72 animate-pulse"></div>
            ))}
          </div>
        ) : filteredOutputs.length === 0 ? (
          // Empty State Layouts
          hasActiveFilters ? (
            <div className="bg-[#12141c]/50 border border-white/10 rounded-3xl min-h-[350px] flex flex-col items-center justify-center p-8 text-center">
              <SearchX size={44} className="text-slate-600 mb-4 animate-bounce" />
              <h2 className="text-white font-black uppercase tracking-wide text-lg">No content results match</h2>
              <p className="text-slate-400 text-sm mt-2 max-w-sm leading-relaxed">Try adjusting your filters, keyword search parameters, or clear search queries entirely.</p>
              <button 
                onClick={clearFilters}
                className="bg-[#c9a84c] hover:bg-[#ebd082] text-black font-black uppercase tracking-widest text-xs py-3.5 px-6 rounded-xl mt-6 transition-all duration-200 shadow-lg shadow-[#c9a84c]/10"
              >
                Reset Filter Panel
              </button>
            </div>
          ) : (
            <div className="bg-[#12141c]/50 border border-white/10 rounded-3xl min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
              <div className="bg-[#1b1c2b] p-6 rounded-full mb-6 border border-white/5 shadow-2xl relative">
                <FileText size={44} className="text-slate-500" />
                <Sparkles size={16} className="text-[#c9a84c] absolute right-4 top-4 animate-ping" />
              </div>
              <h2 className="text-white font-black uppercase tracking-wider text-xl">Your Copy Sandbox is Empty</h2>
              <p className="text-slate-400 text-sm max-w-xs mt-3 leading-relaxed">
                Unlock high-converting strategic content blocks! Build marketing copies on the sandbox workbench.
              </p>
              <button 
                onClick={() => navigate('/app/generate')}
                className="bg-[#c9a84c] hover:bg-[#ebd082] text-black font-black uppercase tracking-widest text-xs py-4 px-8 rounded-xl mt-8 transition-all duration-200 shadow-xl shadow-[#c9a84c]/20"
              >
                Begin Copy Generation
              </button>
            </div>
          )
        ) : (
          // Upgraded 2-Column Grid Layout for premium density
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredOutputs.map(output => {
              const text = output.generatedText || output.content || output.text || '';
              const clientName = output.clientId?.name || 'Unknown';
              
              return (
                <div 
                  key={output._id}
                  className="bg-gradient-to-b from-[#12141c]/80 to-[#0f1118]/60 border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/20 hover:shadow-[0_15px_30px_rgba(139,92,246,0.05)] transition-all duration-300 group flex flex-col justify-between"
                >
                  
                  {/* Card Header Spec line */}
                  <div className="px-5 py-4 bg-[#171a26]/40 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {/* Format Badge */}
                      <span className={`text-[8.5px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border select-none ${getFormatBadgeColor(output.contentType)}`}>
                        {output.contentType}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar size={12} className="text-slate-500" />
                      <span className="text-[10px] text-slate-400 font-bold select-none">{formatRelativeTime(output.createdAt)}</span>
                    </div>
                  </div>

                  {/* Mid Segment: Client Brand Spec & Title */}
                  <div className="px-5 py-3 border-b border-white/5 bg-[#171a26]/10 flex items-center justify-between text-left select-none">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full bg-gradient-to-tr ${getAvatarGradient(clientName)} flex items-center justify-center text-[9px] font-black text-white shadow-md`}>
                        {clientName[0]}
                      </div>
                      <span className="text-white text-xs font-bold tracking-wide">{clientName}</span>
                    </div>

                    {output.brandVoiceName && (
                      <div className="flex items-center gap-1 bg-purple-500/10 border border-purple-500/25 px-2.5 py-0.5 rounded-full">
                        <Mic size={10} className="text-purple-400" />
                        <span className="text-purple-400 text-[8.5px] font-black uppercase tracking-wider">{output.brandVoiceName}</span>
                      </div>
                    )}
                  </div>

                  {/* Clickable Workspace Micro Preview */}
                  <div 
                    onClick={() => navigate(`/app/outputs/${output._id}`)} 
                    className="cursor-pointer group-hover:scale-[1.005] transition-all duration-300 relative"
                    title="Open in AI Copy Workspace"
                  >
                    <MicroPreview 
                      contentType={output.contentType}
                      generatedText={text}
                      clientName={clientName}
                    />
                    {/* Hover Visual Backdrop Overlay */}
                    <div className="absolute inset-0 bg-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex items-center justify-center">
                      <div className="bg-[#12141c] border border-[#c9a84c]/20 text-[#c9a84c] text-[9px] font-black uppercase tracking-[0.2em] py-2.5 px-4 rounded-xl shadow-2xl transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        Open Workspace
                      </div>
                    </div>
                  </div>

                  {/* Upgraded Card Footer Panel */}
                  <div className="px-5 py-4 bg-[#12141c]/50 flex items-center justify-between gap-4 border-t border-white/5">
                    
                    <div className="flex items-center gap-3">
                      {/* Favorite Button pill */}
                      <button 
                        onClick={() => handleToggleFavorite(output)}
                        className={`p-2 rounded-xl border transition-all ${output.favorited ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' : 'text-slate-500 border-white/5 hover:text-yellow-400 hover:bg-yellow-400/5'}`}
                        title={output.favorited ? 'Remove from favorites' : 'Mark as favorite'}
                      >
                        <Star size={14} fill={output.favorited ? 'currentColor' : 'none'} />
                      </button>

                      {/* Inline Delete confirmation panel */}
                      {deleteConfirming === output._id ? (
                        <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 rounded-xl px-2.5 py-1">
                          <span className="text-red-400 text-[9px] font-black uppercase tracking-wider mr-1">Confirm?</span>
                          <button 
                            onClick={() => handleDelete(output._id)}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold text-[8.5px] px-2 py-0.5 rounded uppercase transition-colors"
                          >
                            Yes
                          </button>
                          <button 
                            onClick={() => setDeleteConfirming(null)}
                            className="text-slate-400 hover:text-white font-bold text-[8.5px] px-1.5 py-0.5 rounded transition-colors"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setDeleteConfirming(output._id)}
                          className="p-2 text-slate-500 border border-transparent hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/10 rounded-xl transition-all"
                          title="Purge Output"
                        >
                          <Trash size={14} />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Copy Action */}
                      <button 
                        onClick={() => handleCopy(text, output._id)}
                        className={`flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${copiedCardId === output._id ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-[#1b1c2b] border-white/5 text-slate-400 hover:text-white hover:border-[#c9a84c]/50'}`}
                      >
                        {copiedCardId === output._id ? (
                          <><Check size={12} strokeWidth={2.5} /> Copied!</>
                        ) : (
                          <><Copy size={12} /> Copy</>
                        )}
                      </button>

                      {/* Download Action */}
                      <button 
                        onClick={() => handleDownload(output)}
                        className="flex items-center gap-1.5 px-4.5 py-2.5 bg-[#1b1c2b] border border-white/5 text-slate-400 hover:text-white hover:border-[#c9a84c]/50 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                        title="Download raw copy (.txt)"
                      >
                        <Download size={12} />
                        Download
                      </button>
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upgraded Premium Pagination Panel */}
      {!isLoading && filteredOutputs.length > 0 && (
        <div className="mt-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/5 pt-8 select-none">
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">
            Page <span className="text-white font-mono">{currentPage}</span> of <span className="text-white font-mono">{totalPages}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              disabled={currentPage === 1}
              onClick={() => fetchOutputs(currentPage - 1)}
              className="flex items-center gap-1 px-4 py-2.5 bg-[#12141c] border border-white/5 hover:border-purple-500/35 text-slate-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
            >
              <ChevronLeft size={14} />
              Prev
            </button>
            
            <div className="flex items-center gap-1.5">
              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button 
                    key={pageNum}
                    onClick={() => fetchOutputs(pageNum)}
                    className={`w-9 h-9 rounded-xl text-xs font-black font-mono transition-all duration-200 shadow-md ${currentPage === pageNum ? 'bg-[#c9a84c] text-black shadow-[#c9a84c]/10' : 'bg-[#12141c] border border-white/5 text-slate-400 hover:text-white hover:border-[#c9a84c]/30'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button 
              disabled={currentPage === totalPages}
              onClick={() => fetchOutputs(currentPage + 1)}
              className="flex items-center gap-1 px-4 py-2.5 bg-[#12141c] border border-white/5 hover:border-purple-500/35 text-slate-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Outputs;
