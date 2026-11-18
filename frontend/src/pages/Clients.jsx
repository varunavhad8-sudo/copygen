import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  ChevronDown, 
  MoreVertical, 
  Pencil, 
  Mic, 
  BarChart2, 
  Trash, 
  Globe, 
  ExternalLink, 
  User, 
  Clock, 
  X, 
  SearchX,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clientsAPI } from '../utils/api';

// Theme Constants
const INDUSTRIES = [
  "E-commerce", "SaaS", "Real Estate", "Healthcare", "Education", 
  "Finance", "Hospitality", "Retail", "Agency", "Other"
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'az', label: 'A-Z' },
  { value: 'generations', label: 'Most Generations' }
];

const AVATAR_COLORS = [
  'bg-purple-600', 'bg-blue-600', 'bg-emerald-600', 'bg-orange-600', 
  'bg-pink-600', 'bg-teal-600', 'bg-indigo-600', 'bg-rose-600'
];

const Clients = () => {
  const navigate = useNavigate();
  const menuRef = useRef(null);

  // --- STATE ---
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('All Industries');
  const [sortBy, setSortBy] = useState('newest');
  const [activeMenu, setActiveMenu] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filteredClients, setFilteredClients] = useState([]);
  const [error, setError] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    website: '',
    budget: '',
    contactName: '',
    contactEmail: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});

  // --- INITIAL FETCH ---
  useEffect(() => {
    const fetchClients = async () => {
      setIsLoading(true);
      try {
        const data = await clientsAPI.getAll();
        const list = Array.isArray(data) ? data : data.clients || [];
        setClients(list);
        setFilteredClients(list);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchClients();
  }, []);

  // --- HELPERS ---
  const getAvatarColor = (index) => AVATAR_COLORS[index % AVATAR_COLORS.length];
  
  const getInitials = (name) => {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // --- FILTERING & SORTING ---
  useEffect(() => {
    let result = [...clients];
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.industry?.toLowerCase().includes(q) ||
        c.website?.toLowerCase().includes(q)
      );
    }
    
    if (industryFilter && industryFilter !== 'All Industries' && industryFilter !== 'all') {
      result = result.filter(c => c.industry === industryFilter);
    }
    
    if (sortBy === 'az') result.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === 'newest') result.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt));
    if (sortBy === 'oldest') result.sort((a, b) => 
      new Date(a.createdAt) - new Date(b.createdAt));
    if (sortBy === 'generations') result.sort((a, b) => 
      (b.totalGenerations || 0) - (a.totalGenerations || 0));
    
    setFilteredClients(result);
  }, [clients, searchQuery, industryFilter, sortBy]);

  // --- ACTIONS ---
  const handleOpenModal = (client = null) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        industry: client.industry,
        website: client.website || '',
        budget: client.budget || '',
        contactName: client.contactName || '',
        contactEmail: client.contactEmail || '',
        notes: client.notes || ''
      });
    } else {
      setEditingClient(null);
      setFormData({
        name: '',
        industry: '',
        website: '',
        budget: '',
        contactName: '',
        contactEmail: '',
        notes: ''
      });
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Client name is required";
    
    if (formData.website && !formData.website.startsWith('http')) {
      newErrors.website = "Please enter a valid URL (starting with http:// or https://)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveClient = async () => {
    if (!formData.name.trim()) {
      setErrors({ name: 'Client name is required' });
      return;
    }
    setIsSaving(true);
    try {
      if (editingClient) {
        const updated = await clientsAPI.update(editingClient._id, formData);
        setClients(prev => 
          prev.map(c => c._id === editingClient._id ? updated : c)
        );
      } else {
        const created = await clientsAPI.create(formData);
        setClients(prev => [...prev, created]);
      }
      setIsModalOpen(false);
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClient = async () => {
    setIsDeleting(true);
    try {
      await clientsAPI.delete(deleteTarget._id);
      setClients(prev => prev.filter(c => c._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      setErrors(prev => ({ ...prev, delete: err.message }));
    } finally {
      setIsDeleting(false);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- RENDER HELPERS ---
  const SkeletonCard = () => (
    <div className="bg-[#1a1f2e] border border-[#2a2f42] rounded-xl h-52 animate-pulse flex flex-col p-5">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#252b3b]"></div>
          <div className="space-y-2">
            <div className="h-4 w-24 bg-[#252b3b] rounded"></div>
            <div className="h-3 w-16 bg-[#252b3b] rounded"></div>
          </div>
        </div>
        <div className="w-6 h-6 bg-[#252b3b] rounded"></div>
      </div>
      <div className="space-y-2 mt-2">
        <div className="h-3 w-full bg-[#252b3b] rounded"></div>
        <div className="h-3 w-3/4 bg-[#252b3b] rounded"></div>
      </div>
      <div className="mt-auto pt-4 border-t border-[#2a2f42] flex justify-between">
        <div className="h-3 w-16 bg-[#252b3b] rounded"></div>
        <div className="h-3 w-16 bg-[#252b3b] rounded"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f1117] p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Clients</h1>
          <p className="text-slate-400 text-sm mt-1">Manage all your agency's clients in one place.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition-all duration-200 flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus size={16} />
          Add Client
        </button>
      </div>

      {/* Search + Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-3 items-center mt-6">
        <div className="relative flex-1 w-full">
          <Search size={16} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search clients by name, industry, or website..."
            className="w-full bg-[#252b3b] border border-[#2a2f42] rounded-lg pl-9 pr-4 py-2.5 text-white text-sm placeholder:text-slate-500 focus:border-purple-500 focus:outline-none transition-colors"
          />
        </div>

        <div className="flex gap-3 w-full lg:w-auto">
          <div className="relative w-full lg:w-48">
            <select 
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="w-full bg-[#252b3b] border border-[#2a2f42] rounded-lg px-3 py-2.5 text-white text-sm appearance-none cursor-pointer focus:border-purple-500 focus:outline-none"
            >
              <option>All Industries</option>
              {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative w-full lg:w-44">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-[#252b3b] border border-[#2a2f42] rounded-lg px-3 py-2.5 text-white text-sm appearance-none cursor-pointer focus:border-purple-500 focus:outline-none"
            >
              {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Client Count */}
      <div className="mt-4 mb-6">
        <p className="text-slate-500 text-sm font-medium">
          Showing {filteredClients.length} {filteredClients.length === 1 ? 'client' : 'clients'}
        </p>
      </div>

      {/* Grid Area */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : clients.length === 0 ? (
        <div className="bg-[#1a1f2e] border border-[#2a2f42] rounded-xl min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-[#252b3b] flex items-center justify-center mb-6">
            <Users size={40} className="text-slate-600" />
          </div>
          <h2 className="text-white text-xl font-bold">No clients yet</h2>
          <p className="text-slate-400 text-sm max-w-xs mt-3 leading-relaxed">
            Add your first client to start generating on-brand copy and tracking performance across accounts.
          </p>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg mt-6 transition-all flex items-center gap-2"
          >
            <Plus size={18} />
            Add Your First Client
          </button>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <SearchX size={48} className="text-slate-700 mb-4" />
          <h3 className="text-white text-lg font-medium">No clients match your search</h3>
          <p className="text-slate-500 text-sm mt-1">Try a different name or filter</p>
          <button 
            onClick={() => { setSearchQuery(''); setIndustryFilter('All Industries'); }}
            className="text-purple-400 hover:text-purple-300 text-sm font-semibold mt-4 py-1 px-4 border border-purple-400/20 rounded-lg hover:bg-purple-400/10 transition-all"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client, idx) => (
            <div 
              key={client._id}
              className="bg-[#1a1f2e] border border-[#2a2f42] rounded-xl overflow-hidden hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-200 group"
            >
              {/* Card Top */}
              <div className="p-5">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${getAvatarColor(idx)}`}>
                      {getInitials(client.name)}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-base leading-tight group-hover:text-purple-400 transition-colors">
                        {client.name}
                      </h3>
                      <span className="bg-[#252b3b] text-slate-400 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md mt-1.5 inline-block">
                        {client.industry}
                      </span>
                    </div>
                  </div>

                  <div className="relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenu(activeMenu === client._id ? null : client._id);
                      }}
                      className={`p-1.5 rounded-lg transition-colors ${activeMenu === client._id ? 'bg-[#252b3b] text-white' : 'text-slate-500 hover:text-white hover:bg-[#252b3b]'}`}
                    >
                      <MoreVertical size={16} />
                    </button>

                    {activeMenu === client._id && (
                      <div 
                        ref={menuRef}
                        className="absolute right-0 top-full mt-2 w-44 bg-[#252b3b] border border-[#2a2f42] rounded-xl shadow-2xl z-20 py-1 overflow-hidden"
                      >
                        <button 
                          onClick={() => { setActiveMenu(null); handleOpenModal(client); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-[#2a2f42] transition-colors"
                        >
                          <Pencil size={14} /> Edit Client
                        </button>
                        <button 
                          onClick={() => navigate('/app/brand-voice', { 
                            state: { 
                              preselectedClient: {
                                _id: client._id,
                                name: client.name
                              },
                              openPanel: true  // signal to open the creation panel immediately
                            } 
                          })}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-[#2a2f42] transition-colors"
                        >
                          <Mic size={14} /> Add Brand Voice
                        </button>
                        <button 
                          onClick={() => navigate(`/app/analytics?client=${client._id}`)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-[#2a2f42] transition-colors"
                        >
                          <BarChart2 size={14} /> View Analytics
                        </button>
                        <div className="h-[1px] bg-[#2a2f42] my-1"></div>
                        <button 
                          onClick={() => { setActiveMenu(null); setDeleteTarget(client); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash size={14} /> Delete Client
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Website & Contact */}
                <div className="mt-4 space-y-2">
                  {client.website && (
                    <div 
                      onClick={() => window.open(client.website, '_blank')}
                      className="flex items-center gap-2 text-slate-400 text-xs hover:text-purple-400 transition-colors cursor-pointer w-fit"
                    >
                      <Globe size={13} className="text-slate-500" />
                      <span className="truncate max-w-[180px]">{client.website.replace('https://', '').replace('http://', '')}</span>
                      <ExternalLink size={10} className="text-slate-500" />
                    </div>
                  )}
                  {client.contactName && (
                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                      <User size={13} className="text-slate-500" />
                      <span>{client.contactName}</span>
                      {client.contactEmail && (
                        <span className="text-slate-600 truncate max-w-[120px]"> • {client.contactEmail}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 divide-x divide-[#2a2f42] border-t border-[#2a2f42] bg-[#1d2333]/30">
                <div className="py-3 px-2 text-center">
                  <div className="text-white font-semibold text-base">{client.totalGenerations || 0}</div>
                  <div className="text-slate-500 text-[10px] uppercase font-bold tracking-tight mt-0.5">Generations</div>
                </div>
                <div className="py-3 px-2 text-center">
                  <div className="text-white font-semibold text-base">{client.brandProfileId ? 1 : 0}</div>
                  <div className="text-slate-500 text-[10px] uppercase font-bold tracking-tight mt-0.5">Voices</div>
                </div>
                <div className="py-3 px-2 text-center">
                  <div className="text-white font-semibold text-base">{client.savedOutputs || 0}</div>
                  <div className="text-slate-500 text-[10px] uppercase font-bold tracking-tight mt-0.5">Saved</div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-5 py-3 border-t border-[#2a2f42] bg-[#151a28] flex justify-between items-center">
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                  <Clock size={12} />
                  <span>Last active: {client.updatedAt ? new Date(client.updatedAt).toLocaleDateString() : 'N/A'}</span>
                </div>
                <button 
                  onClick={() => navigate(`/app/analytics?client=${client._id}`)}
                  className="text-purple-400 text-xs font-semibold hover:text-purple-300 flex items-center gap-1 transition-colors"
                >
                  View Details →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD / EDIT CLIENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1f2e] border border-[#2a2f42] rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#2a2f42] flex justify-between items-center flex-shrink-0">
              <h2 className="text-white font-bold text-lg">{editingClient ? 'Edit Client' : 'Add Client'}</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white hover:bg-[#252b3b] rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
              {/* Name */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Client / Company Name <span className="text-red-400">*</span></span>
                </label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Acme Marketing Co."
                  className={`w-full bg-[#252b3b] border ${errors.name ? 'border-red-500' : 'border-[#2a2f42]'} rounded-lg px-4 py-2.5 text-white text-sm focus:border-purple-500 focus:outline-none transition-colors`}
                />
                {errors.name && <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1"><AlertCircle size={12}/> {errors.name}</p>}
              </div>

              {/* Industry */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1.5 block">Industry</label>
                <div className="relative">
                  <select 
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full bg-[#252b3b] border border-[#2a2f42] rounded-lg px-4 py-2.5 text-white text-sm appearance-none cursor-pointer focus:border-purple-500 focus:outline-none"
                  >
                    <option value="" disabled>Select industry...</option>
                    {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Website URL */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1.5 block">Website URL</label>
                <input 
                  type="text"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://..."
                  className={`w-full bg-[#252b3b] border ${errors.website ? 'border-red-500' : 'border-[#2a2f42]'} rounded-lg px-4 py-2.5 text-white text-sm focus:border-purple-500 focus:outline-none transition-colors`}
                />
                {errors.website && <p className="text-red-400 text-xs mt-1.5">{errors.website}</p>}
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Notes</span>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Optional</span>
                </label>
                <textarea 
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any important notes about this client, their goals, or special requirements..."
                  className="w-full bg-[#252b3b] border border-[#2a2f42] rounded-lg p-4 text-white text-sm h-24 resize-none focus:border-purple-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-[#2a2f42] flex gap-3 flex-shrink-0">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2.5 bg-[#252b3b] hover:bg-[#2a2f42] text-white font-semibold rounded-lg transition-colors border border-[#2a2f42]"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveClient}
                disabled={isSaving}
                className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  'Save Client'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1f2e] border border-[#2a2f42] rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Trash size={32} className="text-red-500" />
              </div>
              <h2 className="text-white font-bold text-xl">Delete {deleteTarget.name}?</h2>
              <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                This will permanently delete this client and <span className="text-white font-bold font-mono">ALL</span> associated brand voices and generated outputs. This cannot be undone.
              </p>

              <div className="mt-6 space-y-3 bg-[#1d2333] p-4 rounded-xl border border-[#2a2f42]">
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <Trash size={14} className="text-red-400" />
                  <span>{deleteTarget.brandVoicesCount} brand voice profiles will be deleted</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <Trash size={14} className="text-red-400" />
                  <span>{deleteTarget.totalGenerations} generated outputs will be deleted</span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[#2a2f42] flex gap-3">
              <button 
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 bg-[#252b3b] hover:bg-[#2a2f42] text-white font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteClient}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  'Delete Client'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
