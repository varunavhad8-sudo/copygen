import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  ChevronDown, 
  Info, 
  Minus, 
  Plus, 
  Mic, 
  AlertTriangle, 
  RotateCcw, 
  Copy, 
  Check, 
  Bookmark, 
  BookmarkCheck, 
  ThumbsUp, 
  ThumbsDown,
  User,
  Clock,
  AlertCircle,
  X,
  Globe
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { generateAPI, clientsAPI, brandVoiceAPI, seoAPI } from '../utils/api';
import { useUser } from '../context/UserContext';
import FormattedOutput from '../components/FormattedOutput';
import FactChecker from '../components/FactChecker';

const Generate = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Form State
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('');
  const [goal, setGoal] = useState('');
  const [platform, setPlatform] = useState('');
  const [keyMessage, setKeyMessage] = useState('');
  const [toneOverride, setToneOverride] = useState('');
  const [variations, setVariations] = useState(1);
  const [customFormat, setCustomFormat] = useState('');
  const [customGoal, setCustomGoal] = useState('');
  const [customPlatform, setCustomPlatform] = useState('');
  const [targetKeyword, setTargetKeyword] = useState('');
  const [wordCount, setWordCount] = useState('auto');
  const [loadedTemplate, setLoadedTemplate] = useState(null);

  // UI State
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState([]);
  const [clients, setClients] = useState([]);
  const [brandVoice, setBrandVoice] = useState(null);
  const [loadingBrandVoice, setLoadingBrandVoice] = useState(false);

  
  const [errors, setErrors] = useState({});
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [savedOutputs, setSavedOutputs] = useState(new Set());
  const [expandedIndex, setExpandedIndex] = useState(new Set());
  const [generateError, setGenerateError] = useState(null);

  const { user, refreshUser } = useUser();

  // Hardcoded Formats
  const formats = [
    { value: "social-post", label: "📱 Social Media Post" },
    { value: "facebook-ad", label: "📣 Facebook Ad Copy" },
    { value: "google-ad", label: "🔍 Google Ad (Headline + Description)" },
    { value: "seo", label: "🎯 SEO Optimization" },
    { value: "seo-blog", label: "✍️ SEO Blog Post" },
    { value: "email-subject", label: "📧 Email Subject Line" },
    { value: "cold-email", label: "📨 Cold Email Body" },
    { value: "product-desc", label: "📦 Product Description" },
    { value: "blog-intro", label: "📝 Blog Post Introduction" },
    { value: "landing-headline", label: "🖥️ Landing Page Headline" },
    { value: "cta-button", label: "🎯 CTA Button Text" },
    { value: "instagram-caption", label: "📸 Instagram Caption" },
    { value: "brand-tagline", label: "⚡ Brand Tagline" },
    { value: "youtube-desc", label: "🎬 YouTube Video Description" },
    { value: "other", label: "➕ Other (Custom Format)" },
  ];

  // Fetch Clients on Mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const data = await clientsAPI.getAll();
        setClients(Array.isArray(data) ? data : data.clients || []);
      } catch (err) {
        console.error('Failed to fetch clients:', err);
      }
    };
    fetchClients();
  }, []);

  // Pre-select format if passed via navigation state (Templates page)
  useEffect(() => {
    if (location.state?.selectedFormat) {
      const templateId = location.state.selectedFormat;
      const passedTemplate = location.state.template;

      const systemFormatIds = [
        'social-post', 'facebook-ad', 'google-ad', 'email-subject', 
        'cold-email', 'product-desc', 'blog-intro', 'landing-headline', 
        'cta-button', 'instagram-caption', 'brand-tagline', 'youtube-desc'
      ];

      // 1. Check if system template
      if (systemFormatIds.includes(templateId)) {
        setSelectedFormat(templateId);
        
        // Smart defaults based on template ID
        if (templateId === 'social-post' || templateId === 'instagram-caption') {
          setPlatform('Instagram');
          setGoal('Engagement');
        } else if (templateId === 'facebook-ad') {
          setPlatform('Facebook');
          setGoal('Conversion');
        } else if (templateId === 'google-ad') {
          setPlatform('other');
          setCustomPlatform('Google Search');
          setGoal('Conversion');
        } else if (templateId === 'cold-email' || templateId === 'email-subject') {
          setPlatform('Email');
          setGoal('Conversion');
        } else if (templateId === 'blog-intro') {
          setPlatform('Blog');
          setGoal('Education');
        } else if (templateId === 'landing-headline' || templateId === 'cta-button') {
          setPlatform('Website');
          setGoal('Conversion');
        } else if (templateId === 'brand-tagline') {
          setPlatform('Website');
          setGoal('Awareness');
        } else if (templateId === 'youtube-desc') {
          setPlatform('other');
          setCustomPlatform('YouTube');
          setGoal('Awareness');
        } else if (templateId === 'product-desc') {
          setPlatform('Website');
          setGoal('Conversion');
        }
      } else if (passedTemplate) {
        // 2. It's a custom template!
        setLoadedTemplate(passedTemplate);
        setSelectedFormat(templateId);

        // Pre-populate key message
        if (passedTemplate.promptStructure || passedTemplate.briefText) {
          setKeyMessage(passedTemplate.promptStructure || passedTemplate.briefText);
        }

        // Smart defaults based on category
        const cat = (passedTemplate.category || '').toLowerCase();
        if (cat.includes('social')) {
          setPlatform('LinkedIn');
          setGoal('Engagement');
        } else if (cat.includes('ad')) {
          setPlatform('Facebook');
          setGoal('Conversion');
        } else if (cat.includes('email')) {
          setPlatform('Email');
          setGoal('Conversion');
        } else if (cat.includes('cta')) {
          setPlatform('Website');
          setGoal('Conversion');
        } else if (cat.includes('content')) {
          setPlatform('Blog');
          setGoal('Education');
        }
      }

      // Clear the state so refreshing doesn't re-apply it
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  // Fetch Brand Voice when client changes
  useEffect(() => {
    if (!selectedClient) {
      setBrandVoice(null);
      return;
    }

    const fetchBrandVoice = async () => {
      setLoadingBrandVoice(true);
      try {
        const response = await brandVoiceAPI.getByClient(selectedClient);
        const voice = response?.profile || response?.data?.profile || response?.data || (Array.isArray(response) ? response[0] : response);
        setBrandVoice(voice || null);
      } catch (err) {
        setBrandVoice(null);
      } finally {
        setLoadingBrandVoice(false);
      }
    };
    fetchBrandVoice();
  }, [selectedClient]);

  const validateForm = () => {
    const newErrors = {};
    if (!selectedClient) newErrors.client = "Please select a client";
    if (!selectedFormat) newErrors.format = "Please select a format";
    if (!goal) newErrors.goal = "Please select a goal";
    if (!platform) newErrors.platform = "Please select a platform";
    if (keyMessage.length < 20) newErrors.keyMessage = "Please write at least 20 characters in your key message";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenerate = async () => {
    // 1. Validate
    const newErrors = {};
    if (!selectedClient) newErrors.client = 'Please select a client';
    if (!selectedFormat || (selectedFormat === 'other' && !customFormat.trim())) {
      newErrors.format = selectedFormat === 'other' ? 'Please specify the custom format' : 'Please select a format';
    }
    if (!goal || (goal === 'other' && !customGoal.trim())) {
      newErrors.goal = goal === 'other' ? 'Please specify the custom goal' : 'Please select a goal';
    }
    if (!platform || (platform === 'other' && !customPlatform.trim())) {
      newErrors.platform = platform === 'other' ? 'Please specify the custom platform' : 'Please select a platform';
    }
    if (keyMessage.trim().length < 20) newErrors.keyMessage = 'Please write at least 20 characters';

    if ((selectedFormat === 'seo' || selectedFormat === 'seo-blog') && !targetKeyword.trim()) {
      newErrors.targetKeyword = 'Target keyword is required for SEO content';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    setGenerateError(null);
    setIsGenerating(true);
    
    try {
      let data;
      if (selectedFormat === 'seo-blog') {
        data = await seoAPI.generate({
          topic: keyMessage.trim(),
          clientId: selectedClient,
          targetKeyword: targetKeyword.trim(),
          wordCount: parseInt(String(wordCount).replace(/[^0-9]/g, ''), 10) || 1000
        });
      } else {
        const isCustomTemplate = selectedFormat && !formats.some(f => f.value === selectedFormat);
        let contentTypeToSend = selectedFormat;
        if (isCustomTemplate && loadedTemplate) {
          contentTypeToSend = loadedTemplate.name;
        }

        data = await generateAPI.generate({
          clientId: selectedClient,
          contentType: contentTypeToSend === 'other' ? customFormat : contentTypeToSend,
          goal: goal === 'other' ? customGoal : goal,
          platform: platform === 'other' ? customPlatform : platform,
          length: wordCount === 'auto' ? undefined : `${wordCount} words`,
          briefText: keyMessage.trim(),
          toneOverride: toneOverride.trim() || undefined,
          variations,
          targetKeyword: (selectedFormat === 'seo' || selectedFormat === 'seo-blog') ? targetKeyword : undefined
        });
      }
      
      let outputArray = [];
      if (Array.isArray(data)) {
        outputArray = data;
      } else if (data.outputs) {
        outputArray = data.outputs;
      } else if (data.output) {
        outputArray = [data.output];
      } else if (data.text) {
        outputArray = [data];
      } else {
        outputArray = [data];
      }
      
      // Normalize results to ensure they always have a displayable 'generatedText'
      const normalized = outputArray.map(item => {
        // If it's an SEO blog post, preserve the full object for FormattedOutput
        if (selectedFormat === 'seo-blog') {
          return {
            ...item,
            generatedText: item.article || item.generatedText, // Fallback
            fullData: item // Keep the whole object (FAQs, Meta, FactCheck)
          };
        }
        
        // Handle legacy or non-SEO formats
        if (!item.generatedText && item.article) {
          return { ...item, generatedText: item.article };
        }
        if (item.output && item.output.generatedText) {
          return item.output;
        }
        return item;
      });
      
      setResults(normalized);
      
      // Refresh user to update generation count in pill
      await refreshUser();
      
      // Scroll to results
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ 
          behavior: 'smooth' 
        });
      }, 100);
      
    } catch (err) {
      console.error('Generation Error:', err);
      if (err.status === 403) {
        setGenerateError('You have reached your plan limit. Upgrade your plan to continue generating.');
      } else if (err.status === 401) {
        setGenerateError('Session expired. Please refresh the page and try again.');
      } else if (err.status === 400 && err.data?.errors) {
        // Extract express-validator errors
        const validationMsg = err.data.errors.map(e => e.msg).join(', ');
        setGenerateError(`Validation Failed: ${validationMsg}`);
      } else {
        setGenerateError(err.message || 'Generation failed. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async (text, index) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSave = async (index) => {
    const result = results[index];
    if (result._id || result.id) {
      // Already saved or has an ID from backend
      return;
    }
    // This part is optional as backend usually auto-saves
  };

  const toggleExpand = (index) => {
    setExpandedIndex(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const getFormatLabel = (val) => {
    const found = formats.find(f => f.value === val);
    if (found) return found.label;
    if (loadedTemplate && val === loadedTemplate._id) {
      return `✨ Custom Template: ${loadedTemplate.name}`;
    }
    return val;
  };

  const getFormatBadgeStyle = (format) => {
    if (!format) return 'bg-slate-500/20 text-slate-400';
    const f = format.toLowerCase();
    if (f.includes('social') || f.includes('instagram')) return 'bg-blue-500/20 text-blue-400';
    if (f.includes('email')) return 'bg-yellow-500/20 text-yellow-400';
    if (f.includes('ad')) return 'bg-orange-500/20 text-orange-400';
    if (f.includes('blog') || f.includes('landing')) return 'bg-green-500/20 text-green-400';
    return 'bg-slate-500/20 text-slate-400';
  };

  console.log('USER OBJECT:', JSON.stringify(user));

  return (
    <div className="min-h-screen bg-[#0f1117] p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        
        {/* LEFT SIDE — Title block */}
        <div>
          <h1 className="text-2xl font-bold text-white">
            Generate Copy
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Create on-brand copy for your clients in seconds.
          </p>
        </div>

        {/* RIGHT SIDE — Generations remaining pill */}
        <div className="flex items-center gap-1.5 bg-purple-600/10 border border-purple-600/20 
          text-purple-400 text-xs px-3 py-2 rounded-full whitespace-nowrap mt-1">
          <span className="text-purple-400">✦</span>
          <span>{user 
            ? `${user.generationsUsed ?? 0} / ${user.generationsLimit ?? 0} generations remaining`
            : '— / — generations remaining'
          }</span>
        </div>

      </div>

      <div className="lg:grid lg:grid-cols-[1fr_380px] gap-6 items-start">
        {/* LEFT COLUMN: Generation Form */}
        <div className="space-y-6">
          {generateError && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 
              text-red-400 px-4 py-3 rounded-lg mb-4">
              <AlertCircle size={16} />
              <span className="text-sm">{generateError}</span>
              <button onClick={() => setGenerateError(null)} 
                className="ml-auto text-red-400 hover:text-red-300">
                <X size={14} />
              </button>
            </div>
          )}

          <div className="bg-[#1a1f2e] border border-[#2a2f42] rounded-xl overflow-hidden">
            {/* Section 1: Client & Format */}
            <div className="p-6 border-b border-[#2a2f42]">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 block">
                Step 1 — Select Client & Format
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="text-sm text-slate-400 mb-1 block">Client</label>
                  <div className="relative">
                    <select 
                      value={selectedClient}
                      onChange={(e) => setSelectedClient(e.target.value)}
                      className={`bg-[#252b3b] border ${errors.client ? 'border-red-500' : 'border-[#2a2f42]'} rounded-lg px-3 py-2.5 text-white text-sm w-full appearance-none cursor-pointer focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500`}
                    >
                      <option value="" disabled>Select a client...</option>
                      {clients.map(client => (
                        <option key={client._id || client.id} value={client._id || client.id}>{client.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                  {errors.client && <p className="text-red-400 text-xs mt-1">{errors.client}</p>}
                </div>

                <div className="relative">
                  <label className="text-sm text-slate-400 mb-1 block">Copy Format</label>
                  <div className="relative">
                    <select 
                      value={selectedFormat}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedFormat(val);
                        // Clear loadedTemplate if user selects another standard format
                        if (val !== (loadedTemplate?._id || loadedTemplate?.id)) {
                          setLoadedTemplate(null);
                        }
                      }}
                      className={`bg-[#252b3b] border ${errors.format ? 'border-red-500' : 'border-[#2a2f42]'} rounded-lg px-3 py-2.5 text-white text-sm w-full appearance-none cursor-pointer focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500`}
                    >
                      <option value="" disabled>Select format...</option>
                      {loadedTemplate && selectedFormat === loadedTemplate._id && (
                        <option value={loadedTemplate._id}>
                          ✨ Custom Template: {loadedTemplate.name}
                        </option>
                      )}
                      {formats.map(f => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                  {errors.format && <p className="text-red-400 text-xs mt-1">{errors.format}</p>}
                  
                  {selectedFormat === 'other' && (
                    <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <input 
                        type="text"
                        value={customFormat}
                        onChange={(e) => setCustomFormat(e.target.value)}
                        placeholder="What format do you need? e.g. Whitepaper, Press Release..."
                        className="bg-[#252b3b] border border-purple-500/50 rounded-lg px-3 py-2 text-white text-sm w-full focus:border-purple-500 outline-none transition-all"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Strategy & Brief */}
            <div className="p-6 border-b border-[#2a2f42] space-y-6">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                Step 2 — Strategy & Brief
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="text-sm text-slate-400 mb-1 block">Content Goal</label>
                  <div className="relative">
                    <select 
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      className={`bg-[#252b3b] border ${errors.goal ? 'border-red-500' : 'border-[#2a2f42]'} rounded-lg px-3 py-2.5 text-white text-sm w-full appearance-none cursor-pointer focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500`}
                    >
                      <option value="" disabled>Select goal...</option>
                      <option value="Engagement">Engagement (Likes, Comments)</option>
                      <option value="Conversion">Conversion (Sales, Signups)</option>
                      <option value="Education">Education (Informative)</option>
                      <option value="Awareness">Awareness (Reach, Visibility)</option>
                      <option value="Trust Building">Trust Building (Authority)</option>
                      <option value="other">Other (Custom Goal)</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                  {goal === 'other' && (
                    <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <input 
                        type="text"
                        value={customGoal}
                        onChange={(e) => setCustomGoal(e.target.value)}
                        placeholder="Specify your goal..."
                        className="bg-[#252b3b] border border-purple-500/50 rounded-lg px-3 py-2 text-white text-sm w-full focus:border-purple-500 outline-none transition-all"
                      />
                    </div>
                  )}
                </div>

                <div className="relative">
                  <label className="text-sm text-slate-400 mb-1 block">Platform</label>
                  <div className="relative">
                    <select 
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value)}
                      className={`bg-[#252b3b] border ${errors.platform ? 'border-red-500' : 'border-[#2a2f42]'} rounded-lg px-3 py-2.5 text-white text-sm w-full appearance-none cursor-pointer focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500`}
                    >
                      <option value="" disabled>Select platform...</option>
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="Instagram">Instagram</option>
                      <option value="Email">Email</option>
                      <option value="Blog">Blog</option>
                      <option value="X/Twitter">X/Twitter</option>
                      <option value="Website">Website</option>
                      <option value="other">Other (Custom Platform)</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                  {platform === 'other' && (
                    <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <input 
                        type="text"
                        value={customPlatform}
                        onChange={(e) => setCustomPlatform(e.target.value)}
                        placeholder="Specify the platform..."
                        className="bg-[#252b3b] border border-purple-500/50 rounded-lg px-3 py-2 text-white text-sm w-full focus:border-purple-500 outline-none transition-all"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="text-sm text-slate-400 mb-1 block">Target Word Count</label>
                  <div className="relative">
                    <select 
                      value={wordCount}
                      onChange={(e) => setWordCount(e.target.value)}
                      className="bg-[#252b3b] border border-[#2a2f42] rounded-lg px-3 py-2.5 text-white text-sm w-full appearance-none cursor-pointer focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      <option value="auto">Auto (AI Decides)</option>
                      {(selectedFormat === 'seo-blog' || selectedFormat === 'blog' || selectedFormat === 'article') ? (
                        <>
                          <option value="500">Short (500 words)</option>
                          <option value="1000">Standard (1000 words)</option>
                          <option value="1500">Detailed (1500 words)</option>
                          <option value="2000">Comprehensive (2000 words)</option>
                          <option value="3000">Epic (3000 words)</option>
                        </>
                      ) : (
                        <>
                          <option value="50">Micro (50 words)</option>
                          <option value="150">Concise (150 words)</option>
                          <option value="300">Standard (300 words)</option>
                          <option value="500">Long (500 words)</option>
                          <option value="1000">Deep Dive (1000 words)</option>
                        </>
                      )}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="relative">
                  {/* Reserved for future option */}
                </div>
              </div>

              {(selectedFormat === 'seo' || selectedFormat === 'seo-blog') && (
                <div className="pt-2 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="relative">
                    <label className="text-sm text-slate-400 mb-1 block">Target Keyword</label>
                    <input 
                      type="text"
                      value={targetKeyword}
                      onChange={(e) => setTargetKeyword(e.target.value)}
                      placeholder="e.g. digital marketing agency"
                      className={`bg-[#252b3b] border ${errors.targetKeyword ? 'border-red-500' : 'border-[#2a2f42]'} rounded-lg px-3 py-2.5 text-white text-sm w-full focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all`}
                    />
                    {errors.targetKeyword && <p className="text-red-400 text-xs mt-1">{errors.targetKeyword}</p>}
                  </div>
                </div>
              )}

              <div className="relative">
                <label className="text-sm text-slate-400 mb-1 block">Key Message</label>
                <textarea 
                  value={keyMessage}
                  onChange={(e) => setKeyMessage(e.target.value.slice(0, 500))}
                  placeholder="What is the #1 thing to communicate? e.g. Our new tool saves marketers 10 hours a week using AI..."
                  className={`bg-[#252b3b] border ${errors.keyMessage ? 'border-red-500' : 'border-[#2a2f42]'} rounded-lg p-3 text-white text-sm w-full resize-none min-h-[100px] focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder:text-slate-600`}
                />
                <div className="absolute bottom-3 right-3 text-slate-500 text-xs">
                  {keyMessage.length} / 500
                </div>
              </div>

            </div>
            {/* Section 3: Options */}
            <div className="p-6 border-b border-[#2a2f42]">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 block">
                Step 3 — Options
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <label className="text-sm text-slate-400">Tone Override</label>
                    <div className="group relative">
                      <Info size={14} className="text-slate-500 cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        Leave blank to use client's Brand Voice tone
                      </div>
                    </div>
                  </div>
                  <input 
                    type="text"
                    value={toneOverride}
                    onChange={(e) => setToneOverride(e.target.value)}
                    placeholder="e.g. Bold, Witty, Luxury..."
                    className="bg-[#252b3b] border border-[#2a2f42] rounded-lg px-3 py-2.5 text-white text-sm w-full focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Generate Button Area */}
            <div className="p-6">
              {isGenerating ? (
                <button disabled className="bg-purple-600/50 cursor-not-allowed py-3 rounded-lg w-full flex items-center justify-center gap-3 transition-all">
                  <div className="border-2 border-white/20 border-t-white rounded-full w-4 h-4 animate-spin"></div>
                  <span className="text-white font-semibold">Generating your copy...</span>
                </button>
              ) : (
                <button 
                  onClick={handleGenerate}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg w-full text-base transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <span className="text-lg leading-none">✦</span> Generate Copy
                </button>
              )}
              
              <div className="flex items-center justify-center gap-6 mt-4 text-slate-500 text-xs">
                <span className="flex items-center gap-1.5">🔒 Secure</span>
                <span className="flex items-center gap-1.5">⚡ &lt; 3 sec</span>
                <span className="flex items-center gap-1.5">✓ Brand-aware</span>
              </div>
            </div>
          </div>


        </div>

        {/* RIGHT COLUMN: Brand Voice Preview Panel */}
        <div className="hidden lg:block sticky top-6">
          <div className="bg-[#1a1f2e] border border-[#2a2f42] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#2a2f42] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic size={16} className="text-purple-400" />
                <span className="text-sm font-semibold text-white">Brand Voice</span>
              </div>
              <span className="bg-green-500/10 text-green-400 text-xs px-2 py-0.5 rounded-full font-medium">Auto-applied</span>
            </div>

            {!selectedClient ? (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <Mic size={32} className="text-slate-700 mb-3" />
                <p className="text-slate-500 text-xs leading-relaxed">
                  Select a client to preview<br />their brand voice
                </p>
              </div>
            ) : loadingBrandVoice ? (
              <div className="p-6 space-y-4">
                <div className="animate-pulse bg-[#252b3b] rounded h-4 w-1/4"></div>
                <div className="flex gap-2">
                  <div className="animate-pulse bg-[#252b3b] rounded-full h-6 w-16"></div>
                  <div className="animate-pulse bg-[#252b3b] rounded-full h-6 w-16"></div>
                </div>
                <div className="animate-pulse bg-[#252b3b] rounded h-4 w-1/3"></div>
                <div className="animate-pulse bg-[#252b3b] rounded h-16 w-full"></div>
              </div>
            ) : brandVoice ? (
              <div className="p-4 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Archetype</label>
                    <p className="text-white text-sm font-semibold capitalize flex items-center gap-1.5">
                      {brandVoice.archetype || 'Not Set'}
                    </p>
                  </div>
                  <div className="text-right">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Website</label>
                    {brandVoice.website ? (
                      <a href={brandVoice.website} target="_blank" rel="noopener noreferrer" className="text-purple-400 text-[11px] font-medium hover:underline flex items-center justify-end gap-1">
                        Visit <Globe size={10} />
                      </a>
                    ) : (
                      <p className="text-slate-500 text-[11px] italic">Not Set</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1.5">Tone & Voice</label>
                  <div className="flex flex-wrap gap-1.5">
                    {(brandVoice.selectedTones || []).map(t => (
                      <span key={t} className="bg-purple-600/20 text-purple-400 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">{t}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1.5">Emotional Triggers</label>
                  <div className="flex flex-wrap gap-1.5">
                    {(brandVoice.emotionalTriggers || []).map(t => (
                      <span key={t} className="bg-blue-500/10 text-blue-400 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-blue-500/20">{t}</span>
                    ))}
                    {(!brandVoice.emotionalTriggers || brandVoice.emotionalTriggers.length === 0) && <span className="text-slate-600 text-[10px] italic">None set</span>}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1.5">Keywords</label>
                  <div className="flex flex-wrap gap-1.5">
                    {(brandVoice.keywords || []).map(w => (
                      <span key={w} className="bg-green-500/10 text-green-400 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-green-500/20">{w}</span>
                    ))}
                    {(!brandVoice.keywords || brandVoice.keywords.length === 0) && <span className="text-slate-600 text-[10px] italic">None set</span>}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1.5">Target Audience</label>
                  <p className="text-slate-300 text-xs leading-relaxed line-clamp-2 italic">
                    "{brandVoice.targetAudience}"
                  </p>
                </div>

                <div className="bg-purple-600/5 rounded-lg p-3 mt-4 border border-purple-600/10">
                  <p className="text-slate-500 text-[10px] leading-normal font-medium">
                    <span className="text-purple-400 font-bold">✓ STRATEGY ACTIVE:</span> High-fidelity context from this profile will be injected into the AI prompt.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-6 flex flex-col items-center justify-center text-center">
                <AlertTriangle size={24} className="text-yellow-400 mb-2" />
                <h4 className="text-yellow-400 text-sm font-semibold">No brand voice set up</h4>
                <p className="text-slate-500 text-[11px] mt-1 mb-4 leading-normal">
                  Generating without brand voice uses default general settings.
                </p>
                <button 
                  onClick={() => navigate('/app/brand-voice')}
                  className="text-purple-400 text-xs font-semibold hover:underline flex items-center gap-1"
                >
                  Set Up Brand Voice →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>



      

      {/* FULL WIDTH RESULTS & STATES SECTION */}
      <div className="mt-12 pb-20">
        {isGenerating ? (
          <div className="bg-[#1a1f2e] border border-purple-500/30 rounded-3xl p-20 flex flex-col items-center justify-center text-center space-y-8 shadow-2xl shadow-purple-500/10 animate-in fade-in zoom-in duration-500">
            <div className="relative">
              <div className="w-32 h-32 border-4 border-purple-500/10 border-t-purple-500 rounded-full animate-spin"></div>
              <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-purple-400 animate-pulse" size={48} />
            </div>
            <div className="space-y-3">
              <h3 className="text-white font-black text-3xl uppercase tracking-tight">Crafting Premium Copy</h3>
              <p className="text-slate-400 text-lg max-w-md mx-auto font-medium">
                Our AI is analyzing your brand voice and brief to generate high-converting variations.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="w-3 h-3 rounded-full bg-purple-500 animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-3 h-3 rounded-full bg-purple-500 animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-3 h-3 rounded-full bg-purple-500 animate-bounce"></div>
            </div>
          </div>
        ) : results.length > 0 ? (
          <div id="results-section" className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center justify-between border-b border-[#2a2f42] pb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-500/20 p-2 rounded-xl">
                    <Sparkles className="text-purple-400" size={24} />
                  </div>
                  <h2 className="text-3xl font-black text-white tracking-tight uppercase">Generated Results</h2>
                </div>
                <p className="text-slate-500 text-sm pl-14 font-medium italic">
                  Tailored perfectly to your brand strategy and target audience.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 text-sm font-bold shadow-lg shadow-purple-500/20"
                >
                  <RotateCcw size={18} />
                  <span>Regenerate Content</span>
                </button>
              </div>
            </div>

            <div className="space-y-12">
              {results.map((result, idx) => (
                <div key={result._id || idx} className="bg-[#1a1f2e] border border-[#2a2f42] rounded-[40px] overflow-hidden hover:border-purple-500/30 transition-all duration-700 group shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]">
                  <div className="px-10 py-8 border-b border-[#2a2f42] flex items-center justify-between bg-gradient-to-r from-[#1f2537]/80 to-[#1a1f2e]">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 font-black text-xl border border-purple-500/20 shadow-inner">
                        {idx + 1}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] uppercase font-black tracking-[0.25em] ${getFormatBadgeStyle(result.format || result.contentType)} w-fit px-2.5 py-1 rounded-md`}>
                            {(result.format || result.contentType || '').replace('-', ' ')}
                          </span>
                          <span className="text-white/20 text-[10px] font-black uppercase tracking-widest">•</span>
                          <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Creative Variation</span>
                        </div>
                        <h3 className="text-white font-bold text-lg mt-1 group-hover:text-purple-400 transition-colors">Draft {idx + 1}</h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleCopy(result.text || result.generatedText, idx)}
                        className="p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-[#2a2f42]"
                        title="Copy to Clipboard"
                      >
                        {copiedIndex === idx ? <Check size={20} className="text-green-400" /> : <Copy size={20} />}
                      </button>
                      <button 
                        onClick={() => handleSave(idx)}
                        className="p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-[#2a2f42]"
                        title="Save to Outputs"
                      >
                        {savedOutputs.has(idx) ? <BookmarkCheck size={20} className="text-purple-400" /> : <Bookmark size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="p-10 md:p-16">
                    <FormattedOutput 
                      content={result.fullData || result.generatedText || result.text} 
                      contentType={result.format || result.contentType || selectedFormat}
                    />
                    
                    {/* Fact Checker Integration for Content */}
                    <div className="mt-16 pt-16 border-t border-white/5">
                      <FactChecker 
                        content={result.generatedText || result.text}
                      />
                    </div>
                  </div>

                  <div className="px-8 py-4 border-t border-[#2a2f42] bg-[#151a28]/50 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                        <User size={14} className="text-purple-500" />
                        <span>{result.clientName || clients.find(c => (c._id || c.id) === result.clientId)?.name || 'Client'}</span>
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                      <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                        {getFormatLabel(result.format || result.contentType)}
                      </div>
                    </div>
                    {result.createdAt && (
                      <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                        <Clock size={14} />
                        <span>{new Date(result.createdAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-[#1a1f2e] border border-dashed border-[#2a2f42] rounded-3xl p-20 flex flex-col items-center justify-center text-center opacity-60 hover:opacity-100 transition-opacity duration-500">
            <div className="bg-[#252b3b] p-6 rounded-2xl mb-6">
              <Sparkles className="text-slate-600" size={48} />
            </div>
            <h3 className="text-slate-300 font-bold text-2xl uppercase tracking-wider">Ready to generate?</h3>
            <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto font-medium">
              Fill out the brief above and click generate to see the magic happen across the full page.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Generate;
