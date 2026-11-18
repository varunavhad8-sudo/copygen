import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  CreditCard, 
  Bell, 
  Code, 
  AlertTriangle, 
  Lock, 
  Check, 
  Copy, 
  Eye, 
  EyeOff, 
  Download, 
  RotateCcw, 
  ChevronDown, 
  X, 
  AlertCircle,
  Clock,
  ArrowRight,
  LogOut,
  Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { userAPI, authAPI, providerAPI } from '../utils/api';
import { useUser } from '../context/UserContext';
import { auth } from '../config/firebase';
import RazorpayCheckout from '../components/RazorpayCheckout';
import DodoCheckout from '../components/DodoCheckout';


const Settings = () => {
  const navigate = useNavigate();
  const successTimeout = useRef(null);

  // --- STATE ---
  const [activeTab, setActiveTab] = useState('account');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [profileDirty, setProfileDirty] = useState(false);

  // Data States
  const [profile, setProfile] = useState({
    name: 'Varun Avhad',
    email: 'varun@example.com',
    agencyName: 'Avhad Digital',
    timezone: 'Asia/Kolkata (IST)'
  });

  const [notifications, setNotifications] = useState({
    genComplete: true,
    weeklySum: true,
    monthlyRep: false,
    lowCredits: true,
    billing: true,
    newFeatures: true,
    tips: false,
    security: true // Required
  });

  // Usage States
  const [usage, setUsage] = useState({
    used: 0,
    total: 5,
    remaining: 5,
    percentage: 0
  });

  const [transactions, setTransactions] = useState([]);

  // Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [successBanner, setSuccessBanner] = useState(null);

  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutProvider, setCheckoutProvider] = useState(null); // 'razorpay' | 'dodo'
  const [selectedPlanKey, setSelectedPlanKey] = useState(null);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState('monthly');
  // Admin-only: override which payment gateway to use. 'auto' = detect by currency.
  const [adminPaymentGateway, setAdminPaymentGateway] = useState('auto');
  const [providerSettings, setProviderSettings] = useState(null);
  const [providerInputs, setProviderInputs] = useState({ openai: '', anthropic: '', gemini: '' });
  const [providerSaving, setProviderSaving] = useState(null);
  const [providerMessage, setProviderMessage] = useState(null);

  const [billingCycle, setBillingCycle] = useState('monthly');
  const { user, refreshUser } = useUser();

  const planDisplay = {
    free: 'Free Plan',
    starter: 'Starter Plan',
    growth: 'Growth Plan',
    agency: 'Agency Plan',
  };

  // Pre-fill form when user loads:
  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        agencyName: user.agencyName || '',
        timezone: user.timezone || 'UTC',
      });
      
      const used = user.generationsUsed || 0;
      const limits = { free: 10, starter: 300, growth: 1000, agency: 3000 };
      const total = limits[user.plan] || 10;
      const actualTotal = user.generationsLimit ?? total;

      setUsage({
        used,
        total: user.generationsLimit ?? total,
        remaining: Math.max(0, (user.generationsLimit ?? total) - used),
        percentage: Math.min(100, (used / (user.generationsLimit ?? total)) * 100)
      });
    }
  }, [user]);

  // --- DATA FETCH ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const notificationData = await userAPI.getNotifications();

        if (notificationData) {
          setNotifications(prev => ({ ...prev, ...notificationData }));
        }

        const transData = await userAPI.getTransactions();
        if (transData) {
          setTransactions(transData);
        }

        const providerData = await providerAPI.get();
        if (providerData) setProviderSettings(providerData);

      } catch (err) {
        console.error("Failed to fetch additional settings", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- Detect return from payment ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      setActiveTab('billing');
      setSuccessBanner('🎉 Payment successful! Your plan has been activated.');
      setTimeout(() => setSuccessBanner(null), 6000);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // --- ACTIONS ---
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
    setProfileDirty(true);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setProfileError(null);
    try {
      await userAPI.updateProfile({
        name: profile.name,
        agencyName: profile.agencyName,
        timezone: profile.timezone,
      });
      await refreshUser(); // update context
      setProfileDirty(false);
      setSuccessBanner('Changes saved successfully');
      setTimeout(() => setSuccessBanner(null), 3000);
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePlanChange = (planKey, cycle) => {
    if (user?.plan === planKey) return;
    const isIndian = !user?.country || user?.country === 'IN' || user?.currency === 'INR';
    setSelectedPlanKey(planKey);
    setSelectedBillingCycle(cycle || billingCycle);
    // Respect admin gateway override; otherwise detect by currency
    const provider = adminPaymentGateway !== 'auto'
      ? adminPaymentGateway
      : (isIndian ? 'razorpay' : 'dodo');
    setCheckoutProvider(provider);
    setShowCheckout(true);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/');
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const toggleNotification = (key) => {
    if (key === 'security') return; // Cannot toggle
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const triggerSuccess = () => {
    setShowSuccess(true);
    if (successTimeout.current) clearTimeout(successTimeout.current);
    successTimeout.current = setTimeout(() => setShowSuccess(false), 3000);
  };


  const handleSaveNotifications = async () => {
    setIsSaving(true);
    try {
      await userAPI.updateNotifications(notifications);
      triggerSuccess();
    } catch (err) {
      console.error("Failed to save notifications", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProvider = async (provider) => {
    const apiKey = providerInputs[provider].trim();
    if (!apiKey) return;
    setProviderSaving(provider);
    setProviderMessage(null);
    try {
      await providerAPI.saveKey(provider, apiKey);
      const refreshed = await providerAPI.get();
      setProviderSettings(refreshed);
      setProviderInputs(prev => ({ ...prev, [provider]: '' }));
      setProviderMessage({ type: 'success', text: `${provider} key saved securely.` });
    } catch (err) {
      setProviderMessage({ type: 'error', text: err.message });
    } finally {
      setProviderSaving(null);
    }
  };

  const handleRemoveProvider = async (provider) => {
    setProviderSaving(provider);
    setProviderMessage(null);
    try {
      await providerAPI.removeKey(provider);
      setProviderSettings(await providerAPI.get());
      setProviderMessage({ type: 'success', text: `${provider} key removed.` });
    } catch (err) {
      setProviderMessage({ type: 'error', text: err.message });
    } finally {
      setProviderSaving(null);
    }
  };

  const handleSetProvider = async (provider) => {
    try {
      await providerAPI.setActive(provider);
      setProviderSettings(await providerAPI.get());
      setProviderMessage({ type: 'success', text: `${provider} is now the active provider.` });
    } catch (err) {
      setProviderMessage({ type: 'error', text: err.message });
    }
  };
  
  const handleExportData = async () => {
    try {
      await userAPI.exportData();
    } catch (err) {
      console.error("Export failed", err);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await userAPI.deleteAccount({ confirmText: 'DELETE' });
      await auth.signOut();
      navigate('/');
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // --- STYLING HELPERS ---
  const NavItem = ({ id, icon: Icon, label, danger = false }) => {
    const isActive = activeTab === id;
    return (
      <button 
        onClick={() => setActiveTab(id)}
        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-3 transition-all ${
          isActive 
            ? (danger ? 'bg-red-500/10 text-red-400' : 'bg-purple-600/20 text-purple-400') 
            : 'text-slate-400 hover:text-white hover:bg-[#252b3b]'
        } ${danger && !isActive ? 'text-red-400/70 hover:text-red-400' : ''}`}
      >
        <Icon size={18} />
        {label}
      </button>
    );
  };

  const Toggle = ({ isOn, onToggle, disabled = false }) => (
    <button 
      disabled={disabled}
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
        isOn ? 'bg-purple-600' : 'bg-[#252b3b] border border-[#2a2f42]'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
        isOn ? 'translate-x-5' : 'translate-x-0'
      }`}></div>
    </button>
  );

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-[#0f1117] p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your account, billing, and preferences.</p>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8 items-start">
        
        {/* Left Nav Column */}
        <aside className="lg:sticky lg:top-6 space-y-2">
          <div className="bg-[#1a1f2e] border border-[#2a2f42] rounded-xl overflow-hidden p-2">
            <NavItem id="account" icon={User} label="Account" />
            <NavItem id="providers" icon={Code} label="AI Providers" />
            <NavItem id="billing" icon={CreditCard} label="Billing & Plan" />
            <NavItem id="notifications" icon={Bell} label="Notifications" />
            <NavItem id="danger" icon={AlertTriangle} label="Danger Zone" danger />
          </div>

          <div className="bg-[#1a1f2e] border border-[#2a2f42] rounded-xl overflow-hidden p-2 mt-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-all text-sm font-semibold"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Right Content Column */}
        <main className="min-w-0">

          {/* TAB: AI PROVIDERS */}
          {activeTab === 'providers' && (
            <div className="bg-[#1a1f2e] border border-[#2a2f42] rounded-xl p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-white font-semibold text-base">AI Provider Keys</h2>
              <p className="text-slate-400 text-xs mt-1 max-w-2xl">
                Add your own provider key for self-hosted generation. Keys are encrypted by the backend and are never shown in full after saving.
              </p>

              {providerMessage && (
                <div className={`mt-5 rounded-lg border px-4 py-3 text-sm ${providerMessage.type === 'error' ? 'border-red-500/30 bg-red-500/10 text-red-300' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'}`}>
                  {providerMessage.text}
                </div>
              )}

              <div className="mt-6 space-y-5 max-w-2xl">
                {[
                  { id: 'openai', label: 'OpenAI', hint: 'GPT models' },
                  { id: 'anthropic', label: 'Anthropic', hint: 'Claude models' },
                  { id: 'gemini', label: 'Google Gemini', hint: 'Gemini models' },
                ].map(provider => {
                  const status = providerSettings?.providers?.[provider.id];
                  const isActive = providerSettings?.activeProvider === provider.id;
                  return (
                    <div key={provider.id} className="rounded-xl border border-[#2a2f42] bg-[#151a26] p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-white text-sm font-semibold">{provider.label}</h3>
                            {isActive && <span className="text-[10px] uppercase tracking-wide text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-1 rounded">Active</span>}
                          </div>
                          <p className="text-slate-500 text-xs mt-1">{provider.hint} {status?.masked ? `• ${status.masked}` : '• Not configured'}</p>
                        </div>
                        {status?.configured && !isActive && (
                          <button onClick={() => handleSetProvider(provider.id)} className="text-xs text-purple-300 hover:text-white">Use this provider</button>
                        )}
                      </div>
                      <div className="mt-4 flex flex-col sm:flex-row gap-2">
                        <input
                          type="password"
                          value={providerInputs[provider.id]}
                          onChange={e => setProviderInputs(prev => ({ ...prev, [provider.id]: e.target.value }))}
                          placeholder={status?.configured ? 'Enter a replacement key' : 'Paste provider API key'}
                          className="flex-1 bg-[#252b3b] border border-[#2a2f42] rounded-lg px-3 py-2.5 text-white text-sm focus:border-purple-500 focus:outline-none"
                          autoComplete="off"
                        />
                        <button onClick={() => handleSaveProvider(provider.id)} disabled={!providerInputs[provider.id].trim() || providerSaving === provider.id} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-50">
                          {providerSaving === provider.id ? 'Saving...' : 'Save key'}
                        </button>
                        {status?.configured && (
                          <button onClick={() => handleRemoveProvider(provider.id)} disabled={providerSaving === provider.id} className="border border-red-500/30 text-red-300 hover:bg-red-500/10 px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-50">Remove</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-200/80 leading-relaxed">
                Never paste provider keys into frontend code, screenshots, issues, or public documentation. For a server-wide self-hosted setup, configure provider keys in the backend environment instead.
              </div>
            </div>
          )}
          
          {/* TAB 1: ACCOUNT */}
          {activeTab === 'account' && (
            <div className="bg-[#1a1f2e] border border-[#2a2f42] rounded-xl p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-white font-semibold text-base">Profile Information</h2>
              <div className="border-b border-[#2a2f42] my-5"></div>
              
              {/* Avatar Row */}
              <div className="flex items-center gap-6 mb-8">
                <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {profile.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Profile Photo</p>
                  <p className="text-slate-500 text-xs mt-0.5">JPG, PNG or GIF. Max 2MB.</p>
                  <div className="flex items-center gap-3 mt-2.5">
                    <button className="text-xs bg-[#252b3b] border border-[#2a2f42] text-slate-300 px-3 py-1.5 rounded-lg opacity-50 cursor-not-allowed">Upload Photo</button>
                    <button className="text-xs text-slate-500 hover:text-red-400 transition-colors">Remove</button>
                  </div>
                  <p className="text-slate-600 text-[10px] mt-1.5">Photo upload coming soon</p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-6 max-w-xl">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1.5 block">Full Name</label>
                  <input 
                    type="text"
                    name="name"
                    value={profile.name}
                    onChange={handleProfileChange}
                    className="w-full bg-[#252b3b] border border-[#2a2f42] rounded-lg px-4 py-2.5 text-white text-sm focus:border-purple-500 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1.5 block">Email Address</label>
                  <div className="relative">
                    <input 
                      type="email"
                      value={profile.email}
                      readOnly
                      className="w-full bg-[#1e2435] border border-[#2a2f42] rounded-lg px-4 py-2.5 text-white/60 text-sm cursor-not-allowed outline-none"
                    />
                    <Lock size={14} className="text-slate-500 absolute right-4 top-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-slate-500 text-[10px] mt-1.5 ml-1">Email cannot be changed. Contact support if needed.</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1.5 block">Agency / Company Name</label>
                  <input 
                    type="text"
                    name="agencyName"
                    value={profile.agencyName}
                    onChange={handleProfileChange}
                    placeholder="Your agency name"
                    className="w-full bg-[#252b3b] border border-[#2a2f42] rounded-lg px-4 py-2.5 text-white text-sm focus:border-purple-500 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1.5 block">Timezone</label>
                  <div className="relative">
                    <select 
                      name="timezone"
                      value={profile.timezone}
                      onChange={handleProfileChange}
                      className="w-full bg-[#252b3b] border border-[#2a2f42] rounded-lg px-4 py-2.5 text-white text-sm appearance-none cursor-pointer focus:border-purple-500 focus:outline-none pr-10"
                    >
                      <option>UTC</option>
                      <option>America/New_York (EST)</option>
                      <option>America/Chicago (CST)</option>
                      <option>America/Los_Angeles (PST)</option>
                      <option>Europe/London (GMT)</option>
                      <option>Europe/Paris (CET)</option>
                      <option>Asia/Kolkata (IST)</option>
                      <option>Asia/Tokyo (JST)</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Save Section */}
              <div className="mt-10 pt-6 border-t border-[#2a2f42] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  {profileDirty && (
                    <div className="text-amber-400 text-[11px] font-bold flex items-center gap-1.5 animate-pulse uppercase tracking-wider">
                      <AlertCircle size={14} /> Unsaved Changes
                    </div>
                  )}
                  {successBanner && (
                    <div className="text-green-400 text-[11px] font-bold flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 uppercase tracking-wider">
                      <Check size={14} /> {successBanner}
                    </div>
                  )}
                  {profileError && (
                    <div className="text-red-400 text-[11px] font-bold flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 uppercase tracking-wider">
                      <AlertCircle size={14} /> {profileError}
                    </div>
                  )}
                </div>
                <button 
                  onClick={handleSaveProfile}
                  disabled={isSaving || !profileDirty}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 px-8 rounded-lg text-sm transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>

              {/* Logout Section */}
              <div className="pt-8 border-t border-[#2a2f42] mt-8">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-red-400 hover:text-red-300 font-semibold transition-colors px-1"
                >
                  <LogOut size={18} />
                  <span>Sign out of account</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: BILLING & PLAN */}
          {activeTab === 'billing' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-[#1a1f2e] border border-[#2a2f42] rounded-xl p-6">
                <h2 className="text-white font-semibold text-base">Current Plan</h2>
                
                <div className="bg-purple-600/10 border border-purple-600/30 rounded-xl p-5 mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-purple-400 text-[10px] font-bold uppercase tracking-widest">{planDisplay[user?.plan] || 'Free Plan'}</span>
                    <h3 className="text-white text-2xl font-bold mt-1">
                      {user?.currency === 'INR' 
                        ? (user?.plan === 'starter' ? '₹5,699' : user?.plan === 'growth' ? '₹11,399' : user?.plan === 'agency' ? '₹22,799' : '₹0')
                        : (user?.plan === 'starter' ? '$99' : user?.plan === 'growth' ? '$199' : user?.plan === 'agency' ? '$399' : '$0')
                      }
                      <span className="text-slate-500 text-sm font-normal">/ month</span>
                    </h3>
                    <p className="text-slate-400 text-xs mt-1">Billed monthly • Active subscription</p>
                  </div>
                  <div className="flex items-center gap-2 bg-green-500/20 text-green-400 text-xs px-3 py-1.5 rounded-full font-bold w-fit">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                    Active
                  </div>
                </div>

                {/* Usage Bar */}
                <div className="mt-8">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-400 text-sm">Generations Used</span>
                    <span className="text-white text-sm font-bold">{usage.used} / {usage.total}</span>
                  </div>
                  <div className="bg-[#252b3b] rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-purple-600 h-full rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: `${usage.percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-slate-500 text-xs mt-3 flex items-center gap-1.5">
                    <Info size={12} />
                    {usage.remaining} generations remaining this month.
                  </p>
                </div>
              </div>


              {/* Plan Grid */}
              <div className="bg-[#1a1f2e] border border-[#2a2f42] rounded-xl p-6">
                <h2 className="text-white font-semibold text-base">Plans</h2>
                <p className="text-slate-400 text-xs mt-1">Upgrade or downgrade at any time.</p>
                
                {showCheckout ? (
                  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl">
                      <button
                        onClick={() => setShowCheckout(false)}
                        className="absolute top-4 right-4 z-10 text-slate-400 hover:text-white"
                      >
                        <X size={24} />
                      </button>
                      {checkoutProvider === 'razorpay'
                        ? <RazorpayCheckout
                            user={user}
                            initialPlanKey={selectedPlanKey}
                            initialBillingCycle={selectedBillingCycle}
                            onPlanUpdate={() => { refreshUser(); setShowCheckout(false); }}
                          />
                        : <DodoCheckout
                            initialPlanKey={selectedPlanKey}
                            initialBillingCycle={selectedBillingCycle}
                          />
                      }
                    </div>
                  </div>
                ) : (
                  (() => {
                    const isIndian = !user?.country  // no country set → default Indian
                      || user?.country === 'IN'
                      || user?.currency === 'INR';

                    const plans = [
                      {
                        key: 'starter',
                        label: 'Starter',
                        tag: '🎉 Launch Offer',
                        inr: { monthly: { original: '₹8,199', discounted: '₹5,699' }, yearly: { original: '₹88,549', discounted: '₹79,699' } },
                        usd: { monthly: { original: '$99', discounted: '$69' }, yearly: { original: '$1,069', discounted: '$962' } },
                        features: ['300 generations/mo', 'Up to 10 clients', 'Basic brand voice', 'All 12 formats', 'Email support'],
                      },
                      {
                        key: 'growth',
                        label: 'Pro',
                        tag: '🔥 Popular',
                        inr: { monthly: { original: '₹16,399', discounted: '₹11,399' }, yearly: { original: '₹1,77,109', discounted: '₹1,59,399' } },
                        usd: { monthly: { original: '$199', discounted: '$139' }, yearly: { original: '$2,149', discounted: '$1,934' } },
                        features: ['1000 generations/mo', 'Up to 30 clients', 'Full brand voice memory', 'All 12 formats', 'Priority support', 'Analytics dashboard'],
                      },
                      {
                        key: 'agency',
                        label: 'Agency',
                        tag: '⭐ Best Value',
                        inr: { monthly: { original: '₹32,799', discounted: '₹22,799' }, yearly: null },
                        usd: { monthly: { original: '$399', discounted: '$279' }, yearly: { original: '$4,309', discounted: '$3,878' } },
                        features: ['3000 generations/mo', 'Up to 100 clients', 'Dedicated support', 'Custom templates', 'White-label ready'],
                      },
                    ];

                    return (
                      <>
                        {/* ── Admin-only: Payment Gateway Override ──────────────────── */}
                {user?.isAdmin && (
                  <div className="mb-6 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">⚡ Admin Override</span>
                      <span className="text-[10px] text-slate-500">Payment Gateway</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {['auto', 'razorpay', 'dodo'].map(gw => (
                        <button
                          key={gw}
                          onClick={() => setAdminPaymentGateway(gw)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                            adminPaymentGateway === gw
                              ? gw === 'razorpay'
                                ? 'bg-blue-600 text-white'
                                : gw === 'dodo'
                                ? 'bg-purple-600 text-white'
                                : 'bg-amber-500 text-black'
                              : 'bg-[#2a2f42] text-slate-400 hover:text-white'
                          }`}
                        >
                          {gw === 'auto' ? '🔁 Auto' : gw === 'razorpay' ? '🇮🇳 Razorpay' : '🌍 Dodo'}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2">
                      {adminPaymentGateway === 'auto'
                        ? 'Currently: Razorpay for IN users, Dodo for others.'
                        : `Forced: All users will be sent to ${adminPaymentGateway === 'razorpay' ? 'Razorpay' : 'Dodo'}.`}
                    </p>
                  </div>
                )}

                {/* Monthly / Yearly Toggle */}
                        <div className="flex items-center gap-3 mt-6 mb-6">
                          <span className={`text-xs font-bold ${billingCycle === 'monthly' ? 'text-white' : 'text-slate-500'}`}>Monthly</span>
                          <button
                            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                            className={`relative w-12 h-6 rounded-full transition-colors ${billingCycle === 'yearly' ? 'bg-purple-600' : 'bg-[#2a2f42]'}`}
                          >
                            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${billingCycle === 'yearly' ? 'left-7' : 'left-1'}`} />
                          </button>
                          <span className={`text-xs font-bold ${billingCycle === 'yearly' ? 'text-white' : 'text-slate-500'}`}>
                            Annual <span className="text-[#c9a84c] ml-1">Save 10%</span>
                          </span>
                        </div>

                        {/* Plan Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {plans.map(plan => {
                            const currency = isIndian ? plan.inr : plan.usd;
                            const pricing = (billingCycle === 'yearly' && currency.yearly) ? currency.yearly : currency.monthly;
                            const isYearlyUnavailable = billingCycle === 'yearly' && !currency.yearly;
                            const isCurrent = user?.plan === plan.key;
                            const planOrder = ['free', 'starter', 'growth', 'agency'];
                            const currentIdx = planOrder.indexOf(user?.plan || 'free');
                            const planIdx = planOrder.indexOf(plan.key);
                            const isUpgrade = planIdx > currentIdx;

                            return (
                              <div key={plan.key} className={`bg-[#252b3b] border ${isCurrent ? 'border-purple-500/50' : 'border-[#2a2f42]'} rounded-xl p-5 flex flex-col gap-3`}>
                                <div>
                                  <h4 className="text-white font-bold text-base">{plan.label}</h4>
                                  <span className="text-[10px] text-[#c9a84c] font-bold uppercase tracking-wider">{plan.tag}</span>
                                </div>

                                <div>
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-white text-2xl font-bold">{pricing.discounted}</span>
                                    <span className="text-slate-500 text-xs">/mo</span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-slate-500 text-xs line-through">{pricing.original}</span>
                                    {isYearlyUnavailable && <span className="text-[10px] text-amber-400 font-bold">Monthly only</span>}
                                  </div>
                                  {billingCycle === 'yearly' && !isYearlyUnavailable && (
                                    <span className="text-[10px] text-[#c9a84c] font-bold">Billed annually · Save 10%</span>
                                  )}
                                </div>

                                <ul className="space-y-1.5 flex-1">
                                  {plan.features.map(f => (
                                    <li key={f} className="flex items-center gap-2 text-slate-400 text-[11px]">
                                      <Check size={12} className="text-green-400 shrink-0" /> {f}
                                    </li>
                                  ))}
                                </ul>

                                <button
                                  onClick={() => handlePlanChange(plan.key, billingCycle)}
                                  disabled={isCurrent}
                                  className={`w-full mt-2 py-2.5 text-xs font-bold rounded-lg transition-all ${
                                    isCurrent ? 'text-slate-500 cursor-not-allowed border border-[#2a2f42]'
                                    : isUpgrade ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                    : 'text-slate-400 hover:text-white border border-[#2a2f42]'
                                  }`}
                                >
                                  {isCurrent ? 'Current Plan' : isUpgrade ? 'Upgrade' : 'Downgrade'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    );
                  })()
                )}
              </div>

              {/* Billing History */}
              <div className="bg-[#1a1f2e] border border-[#2a2f42] rounded-xl p-6 overflow-hidden">
                <h2 className="text-white font-semibold text-base mb-5">Billing History</h2>
                <div className="overflow-x-auto -mx-6">
                  <table className="w-full text-left">
                    <thead className="bg-[#1e2433]">
                      <tr>
                        <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Date</th>
                        <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Plan</th>
                        <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Amount</th>
                        <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Invoice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2f42]">
                      {transactions.length > 0 ? (
                        transactions.map((row) => (
                          <tr key={row._id} className="hover:bg-[#252b3b]/30 transition-colors group">
                            <td className="px-6 py-4 text-sm text-slate-300">
                              {new Date(row.date).toLocaleDateString('en-US', { 
                                month: 'short', day: 'numeric', year: 'numeric' 
                              })}
                            </td>
                            <td className="px-6 py-4 text-sm text-white font-medium capitalize">
                              {row.plan} Plan
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-300 font-mono">
                              {row.currency === 'INR' ? '₹' : '$'}{row.amount.toFixed(2)}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                row.status === 'Paid' ? 'bg-green-500/10 text-green-400' : 
                                row.status === 'Pending' ? 'bg-amber-500/10 text-amber-400' : 
                                'bg-red-500/10 text-red-400'
                              }`}>
                                {row.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-[10px] text-slate-500 font-medium">#{row.paymentId ? row.paymentId.slice(-8) : 'N/A'}</span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="px-6 py-12 text-center text-slate-500 text-sm italic">
                            No billing history found.
                          </td>
                        </tr>
                      )}
                    </tbody>

                  </table>
                </div>
              </div>
              
              {showCheckout && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                  <div className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl">
                    <button
                      onClick={() => setShowCheckout(false)}
                      className="absolute top-4 right-4 z-10 text-slate-400 hover:text-white"
                    >
                      <X size={24} />
                    </button>
                    {checkoutProvider === 'razorpay'
                      ? <RazorpayCheckout user={user} onPlanUpdate={() => { refreshUser(); setShowCheckout(false); }} />
                      : <DodoCheckout />
                    }
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="bg-[#1a1f2e] border border-[#2a2f42] rounded-xl p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-white font-semibold text-base">Notification Preferences</h2>
              <p className="text-slate-400 text-xs mt-1">Choose what updates you receive by email.</p>
              
              <div className="mt-8 divide-y divide-[#2a2f42]">
                {[
                  { id: 'genComplete', title: 'Generation Complete', desc: 'Get notified when AI finishes generating your copy' },
                  { id: 'weeklySum', title: 'Weekly Usage Summary', desc: 'Receive a weekly report of your generation activity' },
                  { id: 'monthlyRep', title: 'Monthly Usage Report', desc: 'Get your monthly usage breakdown and stats' },
                  { id: 'lowCredits', title: 'Low Credits Warning', desc: 'Alert when you have less than 10 generations remaining' },
                  { id: 'billing', title: 'Billing Reminders', desc: 'Invoice and payment notifications' },
                  { id: 'newFeatures', title: 'New Feature Announcements', desc: 'Be first to know about new CopyGen features' },
                  { id: 'tips', title: 'Tips & Best Practices', desc: 'Occasional tips on getting better AI copy results' },
                  { id: 'security', title: 'Account Security Alerts', desc: 'Login from new device, password changes', required: true }
                ].map(setting => (
                  <div key={setting.id} className="py-4 flex justify-between items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-medium">{setting.title}</span>
                        {setting.required && (
                          <div className="flex items-center gap-1 bg-[#252b3b] border border-[#2a2f42] text-slate-500 text-[9px] px-1.5 py-0.5 rounded font-black uppercase">
                            <Lock size={10} /> Required
                          </div>
                        )}
                      </div>
                      <p className="text-slate-500 text-xs mt-1 leading-relaxed">{setting.desc}</p>
                    </div>
                    <Toggle 
                      isOn={notifications[setting.id]} 
                      onToggle={() => toggleNotification(setting.id)} 
                      disabled={setting.required}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-[#2a2f42] flex justify-end">
                <button 
                  onClick={handleSaveNotifications}
                  disabled={isSaving}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 px-8 rounded-lg text-sm transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </div>
          )}



          {/* TAB 5: DANGER ZONE */}
          {activeTab === 'danger' && (
            <div className="bg-[#1a1f2e] border border-red-500/10 rounded-xl p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={18} className="text-red-400" />
                <h2 className="text-red-400 font-bold text-base">Danger Zone</h2>
              </div>
              <p className="text-slate-500 text-xs">These actions are permanent and cannot be undone.</p>
              
              <div className="mt-6 divide-y divide-[#2a2f42]">
                {/* Export Data */}
                <div className="py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="text-white text-sm font-bold">Export All Data</h4>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">Download all your clients, brand voices, outputs, and settings as JSON.</p>
                  </div>
                  <button className="flex items-center justify-center gap-2 px-4 py-2 bg-[#252b3b] hover:bg-[#2a2f42] border border-[#2a2f42] text-white text-xs font-bold rounded-lg transition-all">
                    <Download size={14} /> Export Data
                  </button>
                </div>

                {/* Reset Analytics */}
                <div className="py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="text-white text-sm font-bold">Reset Analytics Data</h4>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">Clear all generation history and analytics. Your outputs and clients are kept.</p>
                  </div>
                  <button className="flex items-center justify-center gap-2 px-4 py-2 bg-[#252b3b] hover:bg-amber-500/10 border border-transparent hover:border-amber-400/30 text-amber-400 text-xs font-bold rounded-lg transition-all">
                    <RotateCcw size={14} /> Reset Analytics
                  </button>
                </div>

                {/* Delete Account */}
                <div className="py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="text-red-400 text-sm font-bold">Delete Account</h4>
                    <p className="text-red-400/60 text-xs mt-1 leading-relaxed">Permanently delete your account, all clients, brand voices, outputs, and cancel your subscription.</p>
                  </div>
                  <button 
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="px-6 py-2 bg-red-600/10 border border-red-600/30 text-red-400 hover:bg-red-600 hover:text-white hover:border-red-600 rounded-lg text-sm font-bold transition-all shadow-xl shadow-red-600/5"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>



      {/* DELETE ACCOUNT MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1a1f2e] border border-red-500/20 rounded-2xl w-full max-w-md shadow-[0_0_50px_rgba(220,38,38,0.1)] p-8 my-auto animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
              <AlertTriangle size={32} className="text-red-500" />
            </div>
            <h2 className="text-white font-bold text-2xl">Delete Your Account?</h2>
            <p className="text-slate-400 text-sm mt-4 leading-relaxed">This will permanently and immediately:</p>
            
            <ul className="mt-4 space-y-2.5">
              {[
                'Delete all 8 clients',
                'Remove all brand voice profiles',
                'Permanently erase all 47 outputs',
                'Cancel your Pro Plan subscription',
                'Delete all account personal data'
              ].map(item => (
                <li key={item} className="flex items-start gap-2.5 text-slate-300 text-sm">
                  <X size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mt-6">
              <p className="text-red-400 text-xs font-bold leading-relaxed">
                This action is irreversible. You will not be able to recover your data after deletion.
              </p>
            </div>

            <div className="mt-8">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2.5 block">Type <span className="text-red-500">DELETE</span> to confirm:</label>
              <input 
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className={`w-full bg-[#0f1117] border ${deleteConfirmText && deleteConfirmText !== 'DELETE' ? 'border-red-500' : 'border-[#2a2f42]'} rounded-lg px-4 py-3 text-white text-center font-black tracking-[0.2em] focus:outline-none transition-all`}
              />
            </div>

            <div className="mt-8 flex gap-4">
              <button 
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmText('');
                }}
                className="flex-1 px-4 py-3 bg-[#252b3b] hover:bg-[#2a2f42] text-white font-bold rounded-lg transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || isSaving}
                className={`flex-1 px-4 py-3 rounded-lg text-white font-bold transition-all flex items-center justify-center gap-2 ${
                  deleteConfirmText === 'DELETE' 
                    ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20' 
                    : 'bg-red-600/30 cursor-not-allowed opacity-50'
                }`}
              >
                {isDeleting ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Deleting...</>
                ) : (
                  'Delete My Account'
                )}
              </button>
            </div>
            {deleteError && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center font-medium animate-in slide-in-from-top-1">
                {deleteError}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
