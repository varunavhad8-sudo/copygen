import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Share2, 
  Megaphone, 
  Mail, 
  Send, 
  Package, 
  FileText, 
  Layout, 
  MousePointer, 
  Camera, 
  Zap, 
  Video, 
  ChevronDown, 
  X, 
  LayoutTemplate,
  Pencil,
  Trash,
  Info,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { templatesAPI } from '../utils/api';

// --- SYSTEM TEMPLATES CONSTANT ---
const SYSTEM_TEMPLATES = [
  { id: "social-post", name: "Social Media Post", description: "High-engagement posts for Instagram, LinkedIn, and Twitter", category: "Social", icon: Share2, color: "blue" },
  { id: "facebook-ad", name: "Facebook Ad Copy", description: "Scroll-stopping ad copy with headline, body, and CTA", category: "Ads", icon: Megaphone, color: "orange" },
  { id: "google-ad", name: "Google Search Ad", description: "Headline + description pairs optimized for quality score", category: "Ads", icon: Search, color: "yellow" },
  { id: "email-subject", name: "Email Subject Line", description: "High open-rate subject lines with A/B variations", category: "Email", icon: Mail, color: "purple" },
  { id: "cold-email", name: "Cold Email Body", description: "Personalized outreach emails that get replies", category: "Email", icon: Send, color: "teal" },
  { id: "product-desc", name: "Product Description", description: "Compelling product copy that converts browsers to buyers", category: "Content", icon: Package, color: "green" },
  { id: "blog-intro", name: "Blog Post Intro", description: "Hook readers in the first 150 words with a powerful opener", category: "Content", icon: FileText, color: "indigo" },
  { id: "landing-headline", name: "Landing Page Headline", description: "Above-the-fold headlines that communicate value instantly", category: "CTA", icon: Layout, color: "pink" },
  { id: "cta-button", name: "CTA Button Text", description: "Action-driven button copy that increases click-through rates", category: "CTA", icon: MousePointer, color: "rose" },
  { id: "instagram-caption", name: "Instagram Caption", description: "Captions with hooks, story, hashtag suggestions, and CTAs", category: "Social", icon: Camera, color: "pink" },
  { id: "brand-tagline", name: "Brand Tagline", description: "Memorable one-liners that define a brand's identity", category: "Content", icon: Zap, color: "amber" },
  { id: "youtube-desc", name: "YouTube Description", description: "SEO-optimized descriptions with timestamps and CTAs", category: "Content", icon: Video, color: "red" }
];

const CATEGORIES = ["All", "Social", "Ads", "Email", "Content", "CTA"];

const PROMPT_VARIABLES = [
  { key: '{brief}', label: 'User Brief' },
  { key: '{brandTone}', label: 'Tone' },
  { key: '{powerWords}', label: 'Power Words' },
  { key: '{audience}', label: 'Target Audience' },
  { key: '{ctaStyle}', label: 'CTA Style' }
];

const Templates = () => {
  const navigate = useNavigate();
  const promptRef = useRef(null);

  // --- STATE ---
  const [activeTab, setActiveTab] = useState('system'); // 'system' or 'custom'
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [customTemplates, setCustomTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [saveError, setSaveError] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'Other',
    description: '',
    promptStructure: ''
  });
  const [errors, setErrors] = useState({});

  // --- INITIAL FETCH (CUSTOM TEMPLATES) ---
  useEffect(() => {
    if (activeTab !== 'custom') return;
    const fetchTemplates = async () => {
      setIsLoading(true);
      try {
        const data = await templatesAPI.getAll();
        setCustomTemplates(Array.isArray(data) ? data 
          : data.templates || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTemplates();
  }, [activeTab]);

  // --- FILTERING ---
  const displayedSystemTemplates = useMemo(() => {
    return SYSTEM_TEMPLATES.filter(t => {
      const matchesCategory = activeCategory === 'All' || t.category === activeCategory;
      const matchesSearch = (t.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (t.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const displayedCustomTemplates = useMemo(() => {
    return customTemplates.filter(t => 
      (t.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (t.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [customTemplates, searchQuery]);

  // --- ACTIONS ---
  const handleUseTemplate = (template) => {
    const id = template.id || template._id;
    navigate('/app/generate', { state: { selectedFormat: id, template } });
  };

  const handleOpenModal = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        category: template.category,
        description: template.description,
        promptStructure: template.promptStructure
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        category: 'Other',
        description: '',
        promptStructure: ''
      });
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const insertVariable = (variable) => {
    const textarea = promptRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.promptStructure;
    const before = text.substring(0, start);
    const after = text.substring(end);

    setFormData({
      ...formData,
      promptStructure: before + variable + after
    });

    // Re-focus and set cursor position after variable
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Template name is required";
    if (!formData.promptStructure.trim()) newErrors.promptStructure = "Prompt structure is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveTemplate = async () => {
    if (!validateForm()) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      if (editingTemplate) {
        const response = await templatesAPI.update(editingTemplate._id, formData);
        const updated = response.template || response; // extract template object
        setCustomTemplates(prev => 
          prev.map(t => t._id === editingTemplate._id ? updated : t)
        );
      } else {
        const response = await templatesAPI.create(formData);
        const created = response.template || response; // extract template object
        console.log('[Templates] Created template:', created);
        setCustomTemplates(prev => [...prev, created]);
      }
      setIsModalOpen(false);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await templatesAPI.delete(deleteTarget._id);
      setCustomTemplates(prev => prev.filter(t => t._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // --- STYLING HELPERS ---
  const getColorClasses = (color) => {
    const map = {
      blue: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
      orange: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
      yellow: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
      purple: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
      teal: { bg: 'bg-teal-500/20', text: 'text-teal-400' },
      green: { bg: 'bg-green-500/20', text: 'text-green-400' },
      indigo: { bg: 'bg-indigo-500/20', text: 'text-indigo-400' },
      pink: { bg: 'bg-pink-500/20', text: 'text-pink-400' },
      rose: { bg: 'bg-rose-500/20', text: 'text-rose-400' },
      amber: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
      red: { bg: 'bg-red-500/20', text: 'text-red-400' },
    };
    return map[color] || map.purple;
  };

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-[#0f1117] p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Templates</h1>
          <p className="text-slate-400 text-sm mt-1">Pre-built formats and your custom templates — ready to generate.</p>
        </div>
        {activeTab === 'custom' && (
          <button 
            onClick={() => handleOpenModal()}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition-all duration-200 flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Plus size={16} />
            Create Template
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="inline-flex bg-[#1a1f2e] border border-[#2a2f42] rounded-lg p-1 mb-6">
        <button 
          onClick={() => setActiveTab('system')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all rounded-md ${activeTab === 'system' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
        >
          System Templates
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === 'system' ? 'bg-white/20 text-white' : 'bg-[#252b3b] text-slate-500'}`}>
            12
          </span>
        </button>
        <button 
          onClick={() => setActiveTab('custom')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all rounded-md ${activeTab === 'custom' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
        >
          My Templates
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === 'custom' ? 'bg-white/20 text-white' : 'bg-[#252b3b] text-slate-500'}`}>
            {customTemplates.length}
          </span>
        </button>
      </div>

      {/* SEARCH BAR (Common) */}
      <div className="relative w-full mb-6">
        <Search size={16} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search templates by name or description..."
          className="w-full bg-[#252b3b] border border-[#2a2f42] rounded-lg pl-9 pr-4 py-2.5 text-white text-sm placeholder:text-slate-500 focus:border-purple-500 focus:outline-none transition-colors"
        />
      </div>

      {/* SYSTEM TAB CONTENT */}
      {activeTab === 'system' && (
        <>
          {/* Category Filter Pills */}
          <div className="flex gap-2 flex-wrap mb-6">
            {CATEGORIES.map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-xs px-4 py-1.5 rounded-full font-medium transition-all border ${activeCategory === cat ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-600/20' : 'bg-[#252b3b] border-[#2a2f42] text-slate-400 hover:border-purple-500/50 hover:text-white'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedSystemTemplates.map(template => {
              const colors = getColorClasses(template.color);
              const Icon = template.icon;
              return (
                <div 
                  key={template.id}
                  onClick={() => handleUseTemplate(template)}
                  className="bg-[#1a1f2e] border border-[#2a2f42] rounded-xl p-5 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-200 group cursor-pointer flex flex-col"
                >
                  <div className="flex justify-between items-start">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors.bg}`}>
                      <Icon size={20} className={colors.text} />
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${colors.bg} ${colors.text}`}>
                      {template.category}
                    </span>
                  </div>

                  <h3 className="text-white font-semibold text-sm mt-4 group-hover:text-purple-400 transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-slate-400 text-xs mt-1.5 leading-relaxed flex-1">
                    {template.description}
                  </p>

                  <div className="mt-5 pt-4 border-t border-[#2a2f42]/50 flex justify-between items-center">
                    <div className="flex items-center gap-1.5 bg-green-500/10 text-green-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      <Zap size={10} />
                      INSTANT
                    </div>
                    <span className="text-purple-400 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      Use Template <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* CUSTOM TAB CONTENT */}
      {activeTab === 'custom' && (
        <>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-[#1a1f2e] border border-[#2a2f42] rounded-xl h-52 animate-pulse p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-lg bg-[#252b3b]"></div>
                    <div className="w-16 h-4 bg-[#252b3b] rounded"></div>
                  </div>
                  <div className="h-4 w-3/4 bg-[#252b3b] rounded mb-2"></div>
                  <div className="h-3 w-full bg-[#252b3b] rounded"></div>
                </div>
              ))}
            </div>
          ) : customTemplates.length === 0 ? (
            <div className="bg-[#1a1f2e] border border-[#2a2f42] rounded-xl min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-[#252b3b] flex items-center justify-center mb-6 shadow-xl border border-[#2a2f42]">
                <LayoutTemplate size={40} className="text-slate-600" />
              </div>
              <h2 className="text-white text-xl font-bold">No custom templates yet</h2>
              <p className="text-slate-400 text-sm max-w-xs mt-3 leading-relaxed">
                Build reusable prompt structures for copy formats you use repeatedly. Save hours every week.
              </p>
              <button 
                onClick={() => handleOpenModal()}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg mt-6 transition-all flex items-center gap-2 shadow-lg shadow-purple-600/20"
              >
                <Plus size={18} />
                Create Your First Template
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedCustomTemplates.map(template => (
                <div 
                  key={template._id}
                  className="bg-[#1a1f2e] border border-[#2a2f42] rounded-xl p-5 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-200 group flex flex-col"
                >
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-500/20 text-purple-400">
                      <FileText size={20} />
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {template.category}
                    </span>
                  </div>

                  <h3 className="text-white font-semibold text-sm mt-4">
                    {template.name}
                  </h3>
                  <p className="text-slate-400 text-xs mt-1.5 leading-relaxed flex-1">
                    {template.description}
                  </p>

                  <div className="mt-5 pt-4 border-t border-[#2a2f42]/50 flex justify-between items-center">
                    <button 
                      onClick={() => handleUseTemplate(template)}
                      className="text-purple-400 text-xs font-semibold hover:text-purple-300 flex items-center gap-1"
                    >
                      Use Template <ArrowRight size={14} />
                    </button>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleOpenModal(template)}
                        className="p-1.5 text-slate-500 hover:text-white hover:bg-[#252b3b] rounded-lg transition-all"
                        title="Edit Template"
                      >
                        <Pencil size={14} />
                      </button>
                      <button 
                        onClick={() => setDeleteTarget(template)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Delete Template"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1f2e] border border-[#2a2f42] rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#2a2f42] flex justify-between items-center flex-shrink-0">
              <h2 className="text-white font-bold text-lg">{editingTemplate ? 'Edit Template' : 'Create Custom Template'}</h2>
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
                <label className="text-sm font-medium text-slate-300 mb-1.5 block">Template Name <span className="text-red-400">*</span></label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Weekly Newsletter Intro"
                  className={`w-full bg-[#252b3b] border ${errors.name ? 'border-red-500' : 'border-[#2a2f42]'} rounded-lg px-4 py-2.5 text-white text-sm focus:border-purple-500 focus:outline-none transition-colors`}
                />
                {errors.name && <p className="text-red-400 text-xs mt-1.5">{errors.name}</p>}
              </div>

              {/* Category */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1.5 block">Category</label>
                <div className="relative">
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-[#252b3b] border border-[#2a2f42] rounded-lg px-4 py-2.5 text-white text-sm appearance-none cursor-pointer focus:border-purple-500 focus:outline-none"
                  >
                    {CATEGORIES.slice(1).concat("Other").map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1.5 block">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Short description of what this template generates"
                  className="w-full bg-[#252b3b] border border-[#2a2f42] rounded-lg p-4 text-white text-sm h-16 resize-none focus:border-purple-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Prompt Structure */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-slate-300">Prompt Structure <span className="text-red-400">*</span></label>
                  <div className="group relative">
                    <Info size={14} className="text-slate-500 cursor-help" />
                    <div className="absolute bottom-full right-0 mb-2 w-64 p-2 bg-[#0f1117] border border-[#2a2f42] text-slate-400 text-[10px] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 leading-relaxed">
                      This is the direct instruction given to the AI. Use variables below to inject user and client context dynamically.
                    </div>
                  </div>
                </div>
                
                {/* Variable Pills */}
                <div className="bg-[#252b3b] border border-[#2a2f42] rounded-lg p-3 mb-3">
                  <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-2">Click to insert variables:</p>
                  <div className="flex flex-wrap gap-2">
                    {PROMPT_VARIABLES.map(v => (
                      <button 
                        key={v.key}
                        onClick={() => insertVariable(v.key)}
                        className="bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 text-[11px] px-2.5 py-1 rounded border border-purple-500/20 transition-colors font-mono"
                      >
                        {v.key}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea 
                  ref={promptRef}
                  value={formData.promptStructure}
                  onChange={(e) => setFormData({ ...formData, promptStructure: e.target.value })}
                  placeholder="Write your AI instructions here...&#10;&#10;Example: Write a {brandTone} social media post for {audience}.&#10;&#10;Brief: {brief}&#10;&#10;Use power words: {powerWords}"
                  className={`w-full bg-[#0f1117] border ${errors.promptStructure ? 'border-red-500' : 'border-[#2a2f42]'} rounded-lg p-4 text-white text-sm h-40 resize-none focus:border-purple-500 focus:outline-none transition-colors font-mono leading-relaxed`}
                />
                {errors.promptStructure && <p className="text-red-400 text-xs mt-1.5">{errors.promptStructure}</p>}
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
                onClick={handleSaveTemplate}
                disabled={isSaving}
                className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  'Save Template'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1f2e] border border-[#2a2f42] rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Trash size={30} className="text-red-500" />
              </div>
              <h2 className="text-white font-bold text-lg">Delete Template?</h2>
              <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                "<span className="text-white">{deleteTarget.name}</span>" will be permanently removed. Outputs generated with it will not be affected.
              </p>
            </div>

            <div className="p-6 bg-[#151a28] border-t border-[#2a2f42] flex gap-3">
              <button 
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2 text-sm text-slate-300 hover:text-white font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteTemplate}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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

export default Templates;
