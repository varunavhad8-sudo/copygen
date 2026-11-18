import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Mic, 
  Plus, 
  Search, 
  Trash2, 
  ChevronRight, 
  Save, 
  MessageSquare, 
  Sparkles,
  Info,
  ChevronDown,
  Globe,
  Settings,
  X,
  Check,
  AlertCircle,
  FileText,
  BarChart,
  User,
  Zap,
  Users,
  MoreVertical,
  Pencil,
  Copy,
  Trash,
  Clock,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { brandVoiceAPI, clientsAPI } from '../utils/api';
import { useLocation } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.copygen.in/v1';

const BrandVoice = () => {
  const location = useLocation();
  // State
  const [brandVoices, setBrandVoices] = useState([]);
  const stats = useMemo(() => ({
    voices: brandVoices.length,
    clients: new Set(brandVoices.map(v => v.clientId)).size,
    sampleCopy: brandVoices.filter(v => v.sampleCopy).length
  }), [brandVoices]);

  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingProfile, setIsFetchingProfile] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editingVoice, setEditingVoice] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenu, setActiveMenu] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successBanner, setSuccessBanner] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  // Form State
  const initialFormState = {
    clientId: '',
    tones: [],
    powerWords: [],
    avoidWords: [],
    audience: '',
    ctaStyle: 'direct',
    sampleCopy: '',
    notes: '',
    archetype: '',
    readingLevel: 'standard',
    formattingRules: [],
    usp: '',
    pricePositioning: 'mid-market',
    emotionalTriggers: [],
    keywords: [],
    website: '',
    customArchetype: '',
    customPricePositioning: '',
    customReadingLevel: '',
    customCTAStyle: ''
  };
  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});

  // Helper: Get Initials & Color
  const getAvatarData = (name) => {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const colors = [
      'bg-purple-600', 'bg-blue-600', 'bg-green-600', 
      'bg-orange-600', 'bg-pink-600', 'bg-teal-600'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = colors[Math.abs(hash) % colors.length];
    return { initials, color };
  };

  // Fetch Brand Voices and Clients on Mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [voicesData, clientsData] = await Promise.all([
          brandVoiceAPI.getAll(),
          clientsAPI.getAll(),
        ]);
        const voices = voicesData?.brandProfiles || voicesData?.data || (Array.isArray(voicesData) ? voicesData : []);
        const fetchedClients = clientsData?.clients || clientsData?.data || (Array.isArray(clientsData) ? clientsData : []);
        
        setBrandVoices(Array.isArray(voices) ? voices : []);
        setClients(Array.isArray(fetchedClients) ? fetchedClients : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Handle client pre-selection from location state (navigation)
  useEffect(() => {
    const state = location.state;
    if (!state) return;

    // If a client was pre-selected from the Clients page
    if (state.preselectedClient) {
      setFormData(prev => ({
        ...prev,
        clientId: state.preselectedClient._id,
        clientName: state.preselectedClient.name
      }));
    }

    // If told to open the panel immediately
    if (state.openPanel) {
      setIsPanelOpen(true);
    }

    // Clear the state so back-navigation doesn't re-trigger
    window.history.replaceState({}, document.title);
  }, [location.state]);

  // Auto-load brand voice details if the pre-selected client already has a profile
  useEffect(() => {
    if (!formData.clientId || brandVoices.length === 0 || editingVoice) return;

    const existingVoice = brandVoices.find(v => String(v.clientId) === String(formData.clientId));
    if (existingVoice) {
      setEditingVoice(existingVoice);
      setFormData({
        clientId: existingVoice.clientId,
        tones: Array.isArray(existingVoice.selectedTones) ? existingVoice.selectedTones : (existingVoice.selectedTones ? [existingVoice.selectedTones] : []),
        powerWords: existingVoice.powerWords || [],
        avoidWords: existingVoice.avoidWords || [],
        audience: existingVoice.targetAudience || '',
        ctaStyle: existingVoice.ctaStyle || 'direct',
        sampleCopy: existingVoice.sampleCopy || '',
        notes: existingVoice.notes || '',
        archetype: existingVoice.archetype || '',
        readingLevel: existingVoice.readingLevel || 'standard',
        formattingRules: existingVoice.formattingRules || [],
        usp: Array.isArray(existingVoice.usps) ? existingVoice.usps[0] : (existingVoice.usps || ''),
        pricePositioning: existingVoice.pricePositioning || 'mid-market',
        emotionalTriggers: existingVoice.emotionalTriggers || [],
        keywords: existingVoice.keywords || [],
        website: existingVoice.website || '',
        customArchetype: '',
        customPricePositioning: '',
        customReadingLevel: '',
        customCTAStyle: ''
      });
    }
  }, [formData.clientId, brandVoices, editingVoice]);

  const filteredVoices = useMemo(() => {
    return brandVoices.filter(v => {
      const client = clients.find(c => String(c._id || c.id) === String(v.clientId));
      const name = client?.name || v.clientName || '';
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [brandVoices, searchQuery, clients]);

  // Note: Combined fetch handled by on-mount Promise.all or manual refreshes
  // Keeping this effect if we need to auto-load form on client selection in some UI modes
  useEffect(() => {
    if (!selectedClient) return;
    const voice = brandVoices.find(v => v.clientId === (selectedClient.id || selectedClient._id));
    if (voice) {
      setFormData({
        clientId: voice.clientId,
        tones: Array.isArray(voice.selectedTones) ? voice.selectedTones : (voice.selectedTones ? [voice.selectedTones] : []),
        powerWords: voice.powerWords || [],
        avoidWords: voice.avoidWords || [],
        audience: voice.targetAudience || '',
        ctaStyle: voice.ctaStyle || 'direct',
        sampleCopy: voice.sampleCopy || '',
        notes: voice.notes || '',
        archetype: voice.archetype || '',
        readingLevel: voice.readingLevel || 'standard',
        formattingRules: voice.formattingRules || [],
        usp: Array.isArray(voice.usps) ? voice.usps[0] : (voice.usps || ''),
        pricePositioning: voice.pricePositioning || 'mid-market',
        emotionalTriggers: voice.emotionalTriggers || [],
        keywords: voice.keywords || [],
        website: voice.website || '',
        customArchetype: '',
        customPricePositioning: '',
        customReadingLevel: '',
        customCTAStyle: ''
      });
    } else {
      setFormData({ ...initialFormState, clientId: selectedClient.id || selectedClient._id });
    }
  }, [selectedClient, brandVoices]);

  // Actions
  const handleOpenCreate = () => {
    setEditingVoice(null);
    setFormData(initialFormState);
    setFormErrors({});
    setIsPanelOpen(true);
  };

  const handleOpenEdit = (voice) => {
    setEditingVoice(voice);
    setFormData({
      clientId: voice.clientId,
      tones: Array.isArray(voice.selectedTones) ? voice.selectedTones : (voice.selectedTones ? [voice.selectedTones] : []),
      powerWords: voice.powerWords || [],
      avoidWords: voice.avoidWords || [],
      audience: voice.targetAudience || '',
      ctaStyle: voice.ctaStyle || 'direct',
      sampleCopy: voice.sampleCopy || '',
      notes: voice.notes || '',
      archetype: voice.archetype || '',
      readingLevel: voice.readingLevel || 'standard',
      formattingRules: voice.formattingRules || [],
      usp: Array.isArray(voice.usps) ? voice.usps[0] : (voice.usps || ''),
      pricePositioning: voice.pricePositioning || 'mid-market',
      emotionalTriggers: voice.emotionalTriggers || [],
      keywords: voice.keywords || [],
      website: voice.website || '',
      customArchetype: '',
      customPricePositioning: '',
      customReadingLevel: '',
      customCTAStyle: ''
    });
    setFormErrors({});
    setIsPanelOpen(true);
    setActiveMenu(null);
  };

  const handleDeleteClick = (voice) => {
    setDeleteTarget(voice);
    setActiveMenu(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    
    setIsDeleting(true);
    try {
      await brandVoiceAPI.delete(deleteTarget._id);
      setBrandVoices(prev => prev.filter(v => v._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const payload = {
        clientId: formData.clientId,
        selectedTones: formData.tones,
        targetAudience: formData.audience,
        powerWords: formData.powerWords,
        avoidWords: formData.avoidWords,
        sampleCopy: formData.sampleCopy,
        notes: formData.notes,
        archetype: formData.archetype === 'other' ? formData.customArchetype : formData.archetype,
        readingLevel: formData.readingLevel === 'other' ? formData.customReadingLevel : formData.readingLevel,
        formattingRules: formData.formattingRules,
        usps: [formData.usp].filter(Boolean),
        pricePositioning: formData.pricePositioning === 'other' ? formData.customPricePositioning : formData.pricePositioning,
        ctaStyle: formData.ctaStyle === 'other' ? formData.customCTAStyle : formData.ctaStyle,
        emotionalTriggers: formData.emotionalTriggers,
        keywords: formData.keywords,
        website: formData.website
      };

      if (editingVoice) {
        const updated = await brandVoiceAPI.update(editingVoice._id, payload);
        setBrandVoices(prev => 
          prev.map(v => v._id === editingVoice._id ? updated : v)
        );
      } else {
        const created = await brandVoiceAPI.create(payload);
        setBrandVoices(prev => [...prev, created]);
      }
      setIsPanelOpen(false);
      setSuccessBanner({ message: editingVoice ? 'Brand voice updated successfully.' : 'Brand voice saved successfully.' });
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setSuccessBanner(null);
      }, 3000);
    } catch (err) {
      setSaveError(err.message || 'Failed to save brand voice');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTagInput = (field, value) => {
    if (!value.trim()) return;
    if (formData[field].includes(value.trim())) return;
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], value.trim()]
    }));
  };

  const removeTag = (field, tag) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter(t => t !== tag)
    }));
  };

  const toggleTone = (tone) => {
    setFormData(prev => {
      const tones = prev.tones.includes(tone)
        ? prev.tones.filter(t => t !== tone)
        : [...prev.tones, tone];
      return { ...prev, tones };
    });
  };

  return (
    <div className="min-h-screen bg-[#0f1117] p-6 lg:p-8 relative overflow-x-hidden">
      {/* Success Banner */}
      {successBanner && (
        <div className={`fixed top-6 right-6 z-[100] animate-in slide-in-from-right-4 fade-in duration-300 px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 border ${
          successBanner.type === 'delete' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'
        }`}>
          {successBanner.type === 'delete' ? <Trash size={18} /> : <Check size={18} />}
          <span className="font-medium text-sm">{successBanner.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Brand Voice</h1>
          <p className="text-slate-400 text-sm mt-1">Define each client's unique tone, style, and language rules.</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-all duration-200 shadow-lg shadow-purple-600/20"
        >
          <Plus size={16} />
          <span>Create Brand Voice</span>
        </button>
      </div>

      {/* Stats Bar */}
      <div className="flex flex-wrap gap-3 mb-8">
        <div className="bg-[#1a1f2e] border border-[#2a2f42] rounded-lg px-3 py-2 flex items-center gap-2 text-sm transition-all hover:border-[#3a3f52]">
          <Mic size={16} className="text-purple-400" />
          <span className="text-white font-medium">{brandVoices.length}</span>
          <span className="text-slate-500">Brand Voices</span>
        </div>
        <div className="bg-[#1a1f2e] border border-[#2a2f42] rounded-lg px-3 py-2 flex items-center gap-2 text-sm transition-all hover:border-[#3a3f52]">
          <Users size={16} className="text-blue-400" />
          <span className="text-white font-medium">{stats.clients}</span>
          <span className="text-slate-500">Clients Covered</span>
        </div>
        <div className="bg-[#1a1f2e] border border-[#2a2f42] rounded-lg px-3 py-2 flex items-center gap-2 text-sm transition-all hover:border-[#3a3f52]">
          <FileText size={16} className="text-green-400" />
          <span className="text-white font-medium">{stats.sampleCopy}</span>
          <span className="text-slate-500">With Sample Copy</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search brand voices..."
              className="bg-[#1a1f2e] border border-[#2a2f42] rounded-lg pl-10 pr-4 py-2 text-white text-sm w-full focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
            />
          </div>
          <div className="relative min-w-[180px]">
            <select className="bg-[#1a1f2e] border border-[#2a2f42] rounded-lg px-3 py-2 text-white text-sm w-full appearance-none cursor-pointer focus:border-purple-500 focus:outline-none">
              <option>All Clients</option>
              {clients.map(c => <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[#1a1f2e] border border-[#2a2f42] rounded-xl h-64 animate-pulse">
              <div className="p-5 flex gap-3">
                <div className="w-10 h-10 rounded-full bg-[#252b3b]"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[#252b3b] rounded w-1/2"></div>
                  <div className="h-3 bg-[#252b3b] rounded w-1/4"></div>
                </div>
              </div>
              <div className="px-5 space-y-2">
                <div className="h-4 bg-[#252b3b] rounded w-full"></div>
                <div className="h-4 bg-[#252b3b] rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      ) : brandVoices.length === 0 ? (
        <div className="bg-[#1a1f2e] border border-[#2a2f42] rounded-xl min-h-[400px] flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
          <div className="bg-[#252b3b] p-5 rounded-full mb-4">
            <Mic size={40} className="text-slate-600" />
          </div>
          <h3 className="text-white text-lg font-semibold">No brand voices yet</h3>
          <p className="text-slate-400 text-sm max-w-sm mt-2 leading-relaxed">
            Create a brand voice profile for each client to ensure all generated copy perfectly matches their unique tone and style.
          </p>
          <button 
            onClick={handleOpenCreate}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 px-6 rounded-lg mt-6 flex items-center gap-2 transition-all shadow-lg shadow-purple-600/20"
          >
            <Plus size={18} />
            Create Your First Brand Voice
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVoices.map((voice) => {
            const client = clients.find(c => String(c._id || c.id) === String(voice.clientId));
            const clientName = client?.name || voice.clientName || 'Unknown Client';
            const { initials, color } = getAvatarData(clientName);
            const tones = Array.isArray(voice.selectedTones) ? voice.selectedTones : (voice.selectedTones ? [voice.selectedTones] : []);

            return (
              <div 
                key={voice._id || voice.id}
                onClick={() => handleOpenEdit(voice)}
                className="bg-[#1a1f2e] border border-[#2a2f42] rounded-xl overflow-hidden hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-200 cursor-pointer group"
              >
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${color} shadow-inner`}>
                        {initials}
                      </div>
                      <div>
                        <h4 className="text-white font-semibold text-sm group-hover:text-purple-400 transition-colors">{voice.clientName}</h4>
                        <span className="text-slate-500 text-xs">Brand Voice</span>
                      </div>
                    </div>
                    <div className="relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenu(activeMenu === (voice._id || voice.id) ? null : (voice._id || voice.id));
                        }}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-[#252b3b] rounded-lg transition-all"
                      >
                        <MoreVertical size={16} />
                      </button>
                      {activeMenu === (voice._id || voice.id) && (
                        <div className="absolute right-0 top-full mt-1 bg-[#252b3b] border border-[#2a2f42] rounded-lg shadow-xl overflow-hidden z-20 min-w-[140px] animate-in fade-in slide-in-from-top-1">
                          <button onClick={(e) => { e.stopPropagation(); handleOpenEdit(voice); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-purple-600/20 hover:text-white transition-colors">
                            <Pencil size={14} /> Edit
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setActiveMenu(null); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-purple-600/20 hover:text-white transition-colors">
                            <Copy size={14} /> Duplicate
                          </button>
                          <div className="border-t border-[#2a2f42] my-0.5"></div>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(voice); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-400/10 transition-colors">
                            <Trash size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1">
                    {tones.slice(0, 3).map(t => (
                      <span key={t} className="bg-purple-600/20 text-purple-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tight">
                        {t}
                      </span>
                    ))}
                    {tones.length > 3 && (
                      <span className="bg-slate-700 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        +{tones.length - 3} more
                      </span>
                    )}
                  </div>

                  <div className="border-t border-[#2a2f42] my-4"></div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Power Words</span>
                      <span className="text-white text-xs font-medium">{voice.powerWords.length} words</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Avoid Words</span>
                      <span className="text-white text-xs font-medium">{voice.avoidWords.length} words</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">CTA Style</span>
                    <p className="text-slate-300 text-xs mt-1 line-clamp-1 italic capitalize">
                      {voice.ctaStyle === 'direct' ? 'Direct & Action-Oriented' : voice.ctaStyle.replace('-', ' ')}
                    </p>
                  </div>
                </div>

                <div className="bg-[#151a28] px-5 py-3 border-t border-[#2a2f42] flex justify-between items-center group-hover:bg-[#1a1f2e] transition-colors">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[10px]">
                    <Clock size={12} />
                    <span>Updated {new Date(voice.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <span className="text-purple-400 text-[11px] font-bold group-hover:translate-x-0.5 transition-transform">
                    Edit →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SLIDE-IN PANEL */}
      <div className={`fixed inset-0 z-50 transition-all duration-300 ${isPanelOpen ? 'visible' : 'invisible'}`}>
        <div 
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isPanelOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsPanelOpen(false)}
        ></div>
        <div className={`absolute right-0 top-0 h-full w-full max-w-[520px] bg-[#1a1f2e] border-l border-[#2a2f42] shadow-2xl flex flex-col transform transition-transform duration-300 ease-out ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex-shrink-0 p-6 border-b border-[#2a2f42] flex justify-between items-center bg-[#1a1f2e] z-10">
            <div>
              <h2 className="text-white font-bold text-lg">{editingVoice ? 'Edit Brand Voice' : 'Create Brand Voice'}</h2>
              {editingVoice && (
                <p className="text-slate-400 text-xs mt-0.5">
                  Configuring: {clients.find(c => (c._id || c.id) === editingVoice.clientId)?.name || editingVoice.clientName}
                </p>
              )}
            </div>
            <button onClick={() => setIsPanelOpen(false)} className="p-2 text-slate-400 hover:text-white hover:bg-[#252b3b] rounded-lg transition-all">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar bg-[#1a1f2e]">
            {/* --- SECTION 1: BRAND IDENTITY --- */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-[#2a2f42] pb-2 mb-4">
                Brand Identity
              </h3>
              
              <div className="space-y-6">
                {/* Field: Client Selector */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-1">
                      Client <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select 
                        value={formData.clientId}
                        onChange={(e) => {
                          const cid = e.target.value;
                          const voice = brandVoices.find(v => String(v.clientId) === String(cid));
                          if (voice) {
                            setEditingVoice(voice);
                            setFormData({
                              clientId: voice.clientId,
                              tones: Array.isArray(voice.selectedTones) ? voice.selectedTones : (voice.selectedTones ? [voice.selectedTones] : []),
                              powerWords: voice.powerWords || [],
                              avoidWords: voice.avoidWords || [],
                              audience: voice.targetAudience || '',
                              ctaStyle: voice.ctaStyle || 'direct',
                              sampleCopy: voice.sampleCopy || '',
                              notes: voice.notes || '',
                              archetype: voice.archetype || '',
                              readingLevel: voice.readingLevel || 'standard',
                              formattingRules: voice.formattingRules || [],
                              usp: Array.isArray(voice.usps) ? voice.usps[0] : (voice.usps || ''),
                              pricePositioning: voice.pricePositioning || 'mid-market',
                              emotionalTriggers: voice.emotionalTriggers || [],
                              keywords: voice.keywords || [],
                              website: voice.website || '',
                              customArchetype: '',
                              customPricePositioning: '',
                              customReadingLevel: '',
                              customCTAStyle: ''
                            });
                          } else {
                            setEditingVoice(null);
                            setFormData({
                              ...initialFormState,
                              clientId: cid
                            });
                          }
                        }}
                        className={`bg-[#252b3b] border ${formErrors.clientId ? 'border-red-500' : 'border-[#2a2f42]'} rounded-lg px-3 py-2.5 text-white text-sm w-full appearance-none cursor-pointer focus:border-purple-500 focus:outline-none transition-all`}
                      >
                        <option value="">Select a client...</option>
                        {clients.map(c => <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>)}
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-1">
                      Website URL
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                        <Globe size={14} />
                      </div>
                      <input 
                        type="url"
                        placeholder="https://example.com"
                        className="w-full bg-[#252b3b] border border-[#2a2f42] focus:border-purple-500 text-white text-sm rounded-lg pl-9 pr-4 py-2.5 outline-none transition-all"
                        value={formData.website}
                        onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Field: Archetype Grid */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Brand Archetype</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'hero', label: 'Hero', icon: '🛡️' },
                      { id: 'magician', label: 'Magician', icon: '🪄' },
                      { id: 'outlaw', label: 'Outlaw', icon: '⚡' },
                      { id: 'sage', label: 'Sage', icon: '📚' },
                      { id: 'innocent', label: 'Innocent', icon: '✨' },
                      { id: 'explorer', label: 'Explorer', icon: '🧭' },
                      { id: 'ruler', label: 'Ruler', icon: '👑' },
                      { id: 'creator', label: 'Creator', icon: '🎨' },
                      { id: 'caregiver', label: 'Caregiver', icon: '❤️' },
                      { id: 'everyman', label: 'Everyman', icon: '🤝' },
                      { id: 'jester', label: 'Jester', icon: '🎭' },
                      { id: 'lover', label: 'Lover', icon: '💖' },
                      { id: 'other', label: 'Other', icon: '➕' }
                    ].map(arch => (
                      <button 
                        key={arch.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, archetype: arch.id }))}
                        className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${
                          formData.archetype === arch.id 
                            ? 'bg-purple-600/20 border-purple-500 text-purple-300' 
                            : 'bg-[#252b3b] border-[#2a2f42] text-slate-500 hover:border-[#3a3f52]'
                        }`}
                      >
                        <span className="text-lg">{arch.icon}</span>
                        <span className="text-[10px] font-bold uppercase">{arch.label}</span>
                      </button>
                    ))}
                  </div>
                  {formData.archetype === 'other' && (
                    <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <input 
                        type="text"
                        value={formData.customArchetype}
                        onChange={(e) => setFormData(prev => ({ ...prev, customArchetype: e.target.value }))}
                        placeholder="Enter custom archetype..."
                        className="w-full bg-[#252b3b] border border-purple-500/50 rounded-lg px-4 py-2 text-white text-sm focus:border-purple-500 outline-none transition-all"
                      />
                    </div>
                  )}
                </div>

                {/* Field: USP */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Unique Selling Proposition (USP)</label>
                  <input 
                    type="text"
                    value={formData.usp}
                    onChange={(e) => setFormData(prev => ({ ...prev, usp: e.target.value }))}
                    placeholder="e.g. The only AI that prioritizes brand safety first."
                    className="w-full bg-[#252b3b] border border-[#2a2f42] rounded-lg px-4 py-2.5 text-white text-sm focus:border-purple-500 outline-none transition-all"
                  />
                </div>

                {/* Field: Price Positioning */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Price Positioning</label>
                  <div className="relative">
                    <select 
                      value={formData.pricePositioning}
                      onChange={(e) => setFormData(prev => ({ ...prev, pricePositioning: e.target.value }))}
                      className="bg-[#252b3b] border border-[#2a2f42] rounded-lg px-3 py-2.5 text-white text-sm w-full appearance-none cursor-pointer focus:border-purple-500 focus:outline-none transition-all"
                    >
                      <option value="luxury">Luxury (Highest end, exclusive)</option>
                       <option value="premium">Premium (High end, quality-focused)</option>
                      <option value="mid-market">Mid-market (Mass appeal, value)</option>
                      <option value="budget">Budget (Economy, price-focused)</option>
                      <option value="disruptor">Disruptor (New model, aggressive)</option>
                      <option value="other">Other (Custom Positioning)</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                  {formData.pricePositioning === 'other' && (
                    <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <input 
                        type="text"
                        value={formData.customPricePositioning}
                        onChange={(e) => setFormData(prev => ({ ...prev, customPricePositioning: e.target.value }))}
                        placeholder="Enter custom positioning..."
                        className="w-full bg-[#252b3b] border border-purple-500/50 rounded-lg px-4 py-2 text-white text-sm focus:border-purple-500 outline-none transition-all"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* --- SECTION 2: STRATEGIC INTELLIGENCE --- */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-[#2a2f42] pb-2 mb-4 mt-6">
                Strategic Intelligence
              </h3>

              <div className="space-y-6">
                {/* Field: Tone */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-300 flex items-center gap-1">
                    Brand Tone <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Professional', 'Casual', 'Bold', 'Playful', 'Empathetic', 'Authoritative', 'Witty', 'Luxury', 'Technical', 'Friendly', 'Energetic', 'Calm'].map(tone => (
                      <button 
                        key={tone}
                        type="button"
                        onClick={() => toggleTone(tone)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 ${
                          formData.tones.includes(tone) 
                            ? 'bg-purple-600/20 border-purple-500 text-purple-300 shadow-[0_0_10px_rgba(139,92,246,0.1)]' 
                            : 'bg-[#252b3b] border-[#2a2f42] text-slate-400 hover:border-purple-500/50'
                        }`}
                      >
                        {tone}
                      </button>
                    ))}
                    <button 
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, showOtherTone: !prev.showOtherTone }))}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 ${
                        formData.showOtherTone
                          ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                          : 'bg-[#252b3b] border-[#2a2f42] text-slate-400 hover:border-purple-500/50'
                      }`}
                    >
                      ➕ Other
                    </button>
                  </div>
                  {formData.showOtherTone && (
                    <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                      <input 
                        type="text"
                        placeholder="Type custom tone and press Enter..."
                        className="w-full bg-[#252b3b] border border-purple-500/50 rounded-lg px-3 py-1.5 text-white text-xs outline-none focus:border-purple-500 transition-all"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = e.target.value.trim();
                            if (val && !formData.tones.includes(val)) {
                              setFormData(prev => ({
                                ...prev,
                                tones: [...prev.tones, val]
                              }));
                              e.target.value = '';
                            }
                          }
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Field: Emotional Triggers */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Emotional Triggers</label>
                  <div className="bg-[#252b3b] border border-[#2a2f42] rounded-lg p-2 focus-within:border-purple-500 flex flex-wrap gap-1.5 min-h-[80px] cursor-text transition-all" onClick={(e) => e.currentTarget.querySelector('input').focus()}>
                    {formData.emotionalTriggers.map(tag => (
                      <span key={tag} className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-medium px-2 py-0.5 rounded flex items-center gap-1">
                        {tag}
                        <button onClick={() => removeTag('emotionalTriggers', tag)} className="hover:text-blue-300"><X size={10} /></button>
                      </span>
                    ))}
                    <input type="text" placeholder="Add trigger..." className="bg-transparent border-none p-0 text-white text-sm focus:ring-0 flex-1 min-w-[120px] outline-none placeholder:text-slate-600" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleTagInput('emotionalTriggers', e.target.value); e.target.value = ''; } }} />
                  </div>
                </div>

                {/* Field: Target Demographic */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Target Demographic</label>
                  <textarea value={formData.audience} onChange={(e) => setFormData(prev => ({ ...prev, audience: e.target.value }))} placeholder="e.g. Female entrepreneurs aged 25-40, high earners..." className="bg-[#252b3b] border border-[#2a2f42] rounded-lg p-3 text-white text-sm w-full resize-none h-24 focus:border-purple-500 outline-none transition-all placeholder:text-slate-600" />
                </div>

                {/* Field: Keywords to Include */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Keywords to Include</label>
                  <div className="bg-[#252b3b] border border-[#2a2f42] rounded-lg p-2 focus-within:border-purple-500 flex flex-wrap gap-1.5 min-h-[80px] cursor-text transition-all" onClick={(e) => e.currentTarget.querySelector('input').focus()}>
                    {formData.keywords.map(word => (
                      <span key={word} className="bg-green-500/10 border border-green-500/20 text-green-400 text-[11px] font-medium px-2 py-0.5 rounded flex items-center gap-1">
                        {word}
                        <button onClick={() => removeTag('keywords', word)} className="hover:text-green-300"><X size={10} /></button>
                      </span>
                    ))}
                    <input type="text" placeholder="Add keyword..." className="bg-transparent border-none p-0 text-white text-sm focus:ring-0 flex-1 min-w-[120px] outline-none placeholder:text-slate-600" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleTagInput('keywords', e.target.value); e.target.value = ''; } }} />
                  </div>
                </div>
              </div>
            </div>

            {/* --- SECTION 3: CONTENT STANDARDS --- */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-[#2a2f42] pb-2 mb-4 mt-6">
                Content Standards
              </h3>

              <div className="space-y-6">
                {/* Field: Reading Level */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Target Reading Level</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                       { id: 'simplified', label: 'Simplified', sub: 'Grade 5' },
                      { id: 'standard', label: 'Standard', sub: 'Grade 8' },
                      { id: 'expert', label: 'Expert', sub: 'Technical' },
                      { id: 'other', label: 'Other', sub: 'Custom' }
                    ].map(level => (
                      <button 
                        key={level.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, readingLevel: level.id }))}
                        className={`p-2 rounded-lg border text-left transition-all ${
                          formData.readingLevel === level.id 
                            ? 'bg-purple-600/20 border-purple-500 text-purple-300' 
                            : 'bg-[#252b3b] border-[#2a2f42] text-slate-500 hover:border-slate-600'
                        }`}
                      >
                        <p className="text-[11px] font-bold uppercase">{level.label}</p>
                        <p className="text-[9px] opacity-70">{level.sub}</p>
                      </button>
                    ))}
                  </div>
                  {formData.readingLevel === 'other' && (
                    <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <input 
                        type="text"
                        value={formData.customReadingLevel}
                        onChange={(e) => setFormData(prev => ({ ...prev, customReadingLevel: e.target.value }))}
                        placeholder="Enter custom reading level..."
                        className="w-full bg-[#252b3b] border border-purple-500/50 rounded-lg px-4 py-2 text-white text-sm focus:border-purple-500 outline-none transition-all"
                      />
                    </div>
                  )}
                </div>

                {/* Field: Formatting Rules */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Structural Rules</label>
                  <div className="bg-[#252b3b] border border-[#2a2f42] rounded-lg p-2 focus-within:border-purple-500 flex flex-wrap gap-1.5 min-h-[80px] cursor-text transition-all" onClick={(e) => e.currentTarget.querySelector('input').focus()}>
                    {formData.formattingRules.map(rule => (
                      <span key={rule} className="bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[11px] font-medium px-2 py-0.5 rounded flex items-center gap-1">
                        {rule}
                        <button onClick={() => removeTag('formattingRules', rule)} className="hover:text-purple-300"><X size={10} /></button>
                      </span>
                    ))}
                    <input type="text" placeholder="e.g. No Emojis..." className="bg-transparent border-none p-0 text-white text-sm focus:ring-0 flex-1 min-w-[120px] outline-none placeholder:text-slate-600" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleTagInput('formattingRules', e.target.value); e.target.value = ''; } }} />
                  </div>
                </div>

                {/* Field: CTA Style */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">CTA Preference</label>
                  <div className="relative">
                    <select 
                      value={formData.ctaStyle}
                      onChange={(e) => setFormData(prev => ({ ...prev, ctaStyle: e.target.value }))}
                      className="bg-[#252b3b] border border-[#2a2f42] rounded-lg px-3 py-2.5 text-white text-sm w-full appearance-none cursor-pointer focus:border-purple-500 focus:outline-none transition-all"
                    >
                      <option value="direct">Direct & Action-Oriented</option>
                      <option value="soft">Soft & Inviting</option>
                       <option value="question">Question-Based</option>
                      <option value="urgency">Urgency-Driven</option>
                      <option value="value">Value-First</option>
                      <option value="other">Other (Custom Style)</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                  {formData.ctaStyle === 'other' && (
                    <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <input 
                        type="text"
                        value={formData.customCTAStyle}
                        onChange={(e) => setFormData(prev => ({ ...prev, customCTAStyle: e.target.value }))}
                        placeholder="Enter custom CTA style..."
                        className="w-full bg-[#252b3b] border border-purple-500/50 rounded-lg px-4 py-2 text-white text-sm focus:border-purple-500 outline-none transition-all"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* --- SECTION 4: SAMPLES & CONTEXT --- */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-[#2a2f42] pb-2 mb-4 mt-6">
                Samples & Context
              </h3>

              <div className="space-y-6">
                {/* Field: Sample Copy */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Success Samples</label>
                  <textarea value={formData.sampleCopy} onChange={(e) => setFormData(prev => ({ ...prev, sampleCopy: e.target.value }))} placeholder="Paste existing copy that works..." className="bg-[#252b3b] border border-[#2a2f42] rounded-lg p-3 text-white text-sm w-full resize-none h-32 focus:border-purple-500 outline-none transition-all placeholder:text-slate-600" />
                </div>

                {/* Field: Notes */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Internal Notes</label>
                  <textarea value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} placeholder="Any other context for the AI..." className="bg-[#252b3b] border border-[#2a2f42] rounded-lg p-3 text-white text-sm w-full resize-none h-24 focus:border-purple-500 outline-none transition-all placeholder:text-slate-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 p-6 border-t border-[#2a2f42] bg-[#1a1f2e] flex gap-3 z-10">
            {saveError && <p className="text-red-400 text-xs mb-2 text-center">{saveError}</p>}
            <button 
              onClick={() => setIsPanelOpen(false)}
              className="flex-1 px-4 py-2.5 bg-transparent hover:bg-[#252b3b] border border-[#2a2f42] text-slate-300 text-sm font-semibold rounded-lg transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/20"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                'Save Brand Voice'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setDeleteTarget(null)}></div>
          <div className="bg-[#1a1f2e] border border-[#2a2f42] rounded-xl p-6 max-w-sm w-full relative z-10 animate-in zoom-in-95 duration-200">
            <div className="bg-red-500/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle size={24} className="text-red-400" />
            </div>
            <h3 className="text-white font-bold text-lg">Delete Brand Voice?</h3>
            <p className="text-slate-400 text-sm mt-2 leading-relaxed">
              This will permanently remove the brand voice for <span className="text-white font-semibold">{deleteTarget.clientName}</span>. This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 bg-transparent hover:bg-[#252b3b] border border-[#2a2f42] text-slate-300 text-sm font-semibold rounded-lg transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-500/20"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandVoice;
