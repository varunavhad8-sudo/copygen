import { auth } from '../config/firebase'; // Adjusted path to firebase init file

const LOCAL_MODE = import.meta.env.VITE_LOCAL_MODE === 'true';
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const LOCAL_PROVIDER_KEY = 'copygen_local_provider_key';
const LOCAL_PROVIDER = 'copygen_local_provider';

const localProviderSettings = () => {
  const provider = localStorage.getItem(LOCAL_PROVIDER) || 'gemini';
  const key = localStorage.getItem(LOCAL_PROVIDER_KEY) || '';
  return {
    activeProvider: provider,
    providers: {
      openai: { configured: provider === 'openai' && !!key, masked: provider === 'openai' && key ? `${key.slice(0, 6)}...${key.slice(-4)}` : null },
      anthropic: { configured: provider === 'anthropic' && !!key, masked: provider === 'anthropic' && key ? `${key.slice(0, 6)}...${key.slice(-4)}` : null },
      gemini: { configured: provider === 'gemini' && !!key, masked: provider === 'gemini' && key ? `${key.slice(0, 6)}...${key.slice(-4)}` : null }
    }
  };
};

const localRequest = async (method, path, body = null) => {
  if (method === 'GET' && path === '/api/clients') {
    return [{ _id: 'local-client', name: 'My Workspace', industry: '', website: '' }];
  }
  if (method === 'GET' && path.startsWith('/api/brand/')) {
    return { profile: { clientId: 'local-client', clientName: 'My Workspace', isNew: true } };
  }
  if (path === '/api/briefs' || path === '/api/seo/generate') {
    const apiKey = localStorage.getItem(LOCAL_PROVIDER_KEY) || '';
    const provider = localStorage.getItem(LOCAL_PROVIDER) || 'gemini';
    if (!apiKey) throw new Error('Add an LLM provider key in Settings before generating content.');
    const localBody = path === '/api/seo/generate'
      ? { ...body, briefText: body?.topic, contentType: 'seo', provider, apiKey }
      : { ...body, provider, apiKey };
    const response = await fetch(`${BASE_URL}/api/local/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(localBody)
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.message || json.error || 'Local generation failed');
    return json.data !== undefined ? json.data : json.output || json;
  }
  if (method === 'GET' && path === '/api/auth/notifications') return {};
  if (method === 'GET' && path === '/api/transactions') return [];
  if (method === 'GET' && path === '/api/auth/me') return { user: { name: 'Local User', email: 'local@copygen.local', plan: 'free', generationsLimit: 999999, generationsUsed: 0 } };
  return {};
};

// Core request function — handles auth token, errors, response parsing
async function request(method, path, body = null) {
  if (LOCAL_MODE) return localRequest(method, path, body);
  // Get fresh Firebase token on every request
  const token = await auth.currentUser?.getIdToken();
  
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };
  
  if (body) {
    config.body = JSON.stringify(body);
  }
  
  const response = await fetch(`${BASE_URL}${path}`, config);
  const json = await response.json();
  
  if (!response.ok) {
    // Attach status to error so callers can check it
    const error = new Error(json.message || json.error || 'Request failed');
    error.status = response.status;
    error.data = json;
    throw error;
  }
  
  // Handle both { success: true, data: {...} } and direct object responses
  return json.data !== undefined ? json.data : json;
}

// Admin request function — handles admin-secret header
async function adminRequest(method, path, body = null) {
  const secret = localStorage.getItem('cg_admin_secret');
  
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(secret && { 'admin-secret': secret }),
    },
  };
  
  if (body) {
    config.body = JSON.stringify(body);
  }
  
  const response = await fetch(`${BASE_URL}${path}`, config);
  const json = await response.json();
  
  if (!response.ok) {
    const error = new Error(json.message || json.error || 'Admin request failed');
    error.status = response.status;
    error.data = json;
    throw error;
  }
  
  return json.data !== undefined ? json.data : json;
}

// ── AUTH ──────────────────────────────────────────────────────
export const authAPI = {
  // POST /api/auth/register — call after Firebase signup
  // body: { name, email, firebaseUid }
  register: (body) => request('POST', '/api/auth/register', body),

  // GET /api/auth/me — get current user profile + plan info
  getMe: () => request('GET', '/api/auth/me'),

  // PUT /api/auth/profile — update name, agencyName, timezone
  // body: { name, agencyName, timezone }
  updateProfile: (body) => request('PUT', '/api/auth/profile', body),
};

// ── CLIENTS ───────────────────────────────────────────────────
export const clientsAPI = {
  // GET /api/clients — fetch all clients for current user
  getAll: () => request('GET', '/api/clients'),

  // POST /api/clients — create new client
  // body: { name, industry, website, contactName, contactEmail, notes }
  create: (body) => request('POST', '/api/clients', body),

  // PUT /api/clients/:id — update client
  update: (id, body) => request('PUT', `/api/clients/${id}`, body),

  // DELETE /api/clients/:id — delete client
  delete: (id) => request('DELETE', `/api/clients/${id}`),
};

// ── BRAND VOICE (BrandProfile in backend) ─────────────────────
export const brandVoiceAPI = {
  // GET /api/brand — fetch all brand profiles for current user
  getAll: () => request('GET', '/api/brand'),

  // GET /api/brand?clientId=xxx — fetch brand voice for a specific client
  getByClient: (clientId) => request('GET', `/api/brand?clientId=${clientId}`),

  // GET /api/brand/stats — fetch counts for stats bar
  getStats: () => request('GET', '/api/brand/stats'),

  // POST /api/brand — create new brand profile
  // body: { clientId, toneOfVoice, targetAudience, uniqueSellingPoints,
  //         powerWords, avoidWords, ctaStyle, sampleCopy, notes }
  create: (body) => request('POST', '/api/brand', body),

  // PUT /api/brand/:id — update brand profile
  update: (id, body) => request('PUT', `/api/brand/${id}`, body),

  // DELETE /api/brand/:id — delete brand profile
  delete: (id) => request('DELETE', `/api/brand/${id}`),
};

// ── GENERATE (Briefs in backend) ───────────────────────────────
export const generateAPI = {
  // POST /api/briefs — trigger AI generation
  // body: { clientId, format, brief, toneOverride, variations }
  generate: (body) => request('POST', '/api/briefs', body),

  // GET /api/briefs/:id — get status of a generation (if async)
  getStatus: (id) => request('GET', `/api/briefs/${id}`),
};

// ── SEO ───────────────────────────────────────────────────────
export const seoAPI = {
  // POST /api/seo/generate — trigger SEO blog generation
  // body: { topic, clientId, targetKeyword, wordCount }
  generate: (body) => request('POST', '/api/seo/generate', body),
};

// ── OUTPUTS ───────────────────────────────────────────────────
export const outputsAPI = {
  // GET /api/outputs?page=1&limit=10&format=&clientId=&search=&favorited=
  getAll: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
    ).toString();
    return request('GET', `/api/outputs${query ? `?${query}` : ''}`);
  },

  // GET /api/outputs/:id — get single output
  getById: (id) => request('GET', `/api/outputs/${id}`),

  // PUT /api/outputs/:id — update output (content or status)
  update: (id, body) => request('PUT', `/api/outputs/${id}`, body),

  // DELETE /api/outputs/:id — delete output
  delete: (id) => request('DELETE', `/api/outputs/${id}`),

  // GET /api/outputs/export — download all as CSV
  // This one uses direct fetch since it returns a file, not JSON
  exportAll: async () => {
    const token = await auth.currentUser?.getIdToken();
    const response = await fetch(`${BASE_URL}/api/outputs/export`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `copygen-outputs-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },
};

// ── FACT CHECK ────────────────────────────────────────────────
export const factCheckAPI = {
  // POST /api/factcheck/check — scan content for factual claims
  // body: { content, outputId }
  check: (body) => request('POST', '/api/factcheck/check', body),
};

// ── CHECKOUT / PAYMENTS ───────────────────────────────────────
export const checkoutAPI = {
  // Dodo Payments (International) — mounted at /api/dodo
  dodo: {
    subscribe: (body) => request('POST', '/api/dodo/subscribe', body),
    status: () => request('GET', '/api/dodo/status'),
    cancel: () => request('POST', '/api/dodo/cancel'),
  },

  // Razorpay (India) — mounted at /api/razorpay
  razorpay: {
    subscribe: (body) => request('POST', '/api/razorpay/subscribe', body),
    verify: (body) => request('POST', '/api/razorpay/verify', body),
  },

  // GET /api/payments/portal — get Dodo Payments customer portal link
  getPortalLink: () => request('GET', '/api/payments/portal'),
};

// ── ONBOARDING ────────────────────────────────────────────────
export const onboardingAPI = {
  // GET /api/user/onboarding — get setup status
  getStatus: () => request('GET', '/api/auth/onboarding/status'),

  // POST /api/user/onboarding/complete — mark step as done
  // body: { stepId }
  completeStep: (body) => request('POST', '/api/auth/onboarding/complete', body),
};

// ── TEMPLATES ─────────────────────────────────────────────────
export const templatesAPI = {
  // GET /api/templates — fetch user's custom templates
  getAll: () => request('GET', '/api/templates'),

  // POST /api/templates — create custom template
  // body: { name, category, description, promptStructure }
  create: (body) => request('POST', '/api/templates', body),

  // PUT /api/templates/:id — update template
  update: (id, body) => request('PUT', `/api/templates/${id}`, body),

  // DELETE /api/templates/:id — delete template
  delete: (id) => request('DELETE', `/api/templates/${id}`),
};

// ── ANALYTICS ─────────────────────────────────────────────────
export const analyticsAPI = {
  // GET /api/analytics/summary — stats cards data
  getOverview: (range = '30d', clientId = '') =>
    request('GET', `/api/analytics/summary?range=${range}${clientId ? `&clientId=${clientId}` : ''}`),

  // GET /api/analytics/volume — daily generation chart data
  getActivity: (days = 30, clientId = '') => {
    const range = typeof days === 'number' ? `${days}d` : days;
    return request('GET', `/api/analytics/volume?range=${range}${clientId ? `&clientId=${clientId}` : ''}`);
  },

  // GET /api/analytics/breakdown — pie chart data
  getFormats: (range = '30d', clientId = '') =>
    request('GET', `/api/analytics/breakdown?range=${range}${clientId ? `&clientId=${clientId}` : ''}`),

  // GET /api/analytics/top-clients — bar chart data
  getClients: (range = '30d') =>
    request('GET', `/api/analytics/top-clients?range=${range}`),

  // GET /api/outputs?limit=10 — recent activity feed
  getRecent: (clientId = '') => 
    request('GET', `/api/outputs?limit=10${clientId ? `&clientId=${clientId}` : ''}`),
};

// ── USER / SETTINGS ───────────────────────────────────────────
export const userAPI = {
  // GET /api/auth/me — get full user profile
  getProfile: () => request('GET', '/api/auth/me'),

  // PUT /api/auth/profile — update profile
  updateProfile: (body) => request('PUT', `/api/auth/profile`, body),

  // GET /api/auth/notifications — get notification preferences
  getNotifications: () => request('GET', '/api/auth/notifications'),

  // PUT /api/auth/notifications — save notification preferences
  updateNotifications: (body) =>
    request('PUT', '/api/auth/notifications', body),

  // GET /api/auth/export — trigger data export
  exportData: async () => {
    const token = await auth.currentUser?.getIdToken();
    const response = await fetch(`${BASE_URL}/api/auth/export`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `copygen-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // DELETE /api/auth/account — delete account
  // body: { confirmText: "DELETE" }
  deleteAccount: (body) => request('DELETE', '/api/auth/account', body),

  // GET /api/transactions — get billing history
  getTransactions: () => request('GET', '/api/transactions'),
};

// ── PROVIDER SETTINGS ────────────────────────────────────────
// Provider secrets are sent only to the backend and are never returned in full.
export const providerAPI = {
  get: () => LOCAL_MODE ? Promise.resolve(localProviderSettings()) : request('GET', '/api/settings/providers'),
  saveKey: (provider, apiKey) => {
    if (LOCAL_MODE) {
      localStorage.setItem(LOCAL_PROVIDER, provider);
      localStorage.setItem(LOCAL_PROVIDER_KEY, apiKey);
      return Promise.resolve({ provider, configured: true });
    }
    return request('PUT', `/api/settings/providers/${provider}`, { apiKey });
  },
  removeKey: (provider) => {
    if (LOCAL_MODE) {
      if ((localStorage.getItem(LOCAL_PROVIDER) || 'gemini') === provider) localStorage.removeItem(LOCAL_PROVIDER_KEY);
      return Promise.resolve({ provider, configured: false });
    }
    return request('DELETE', `/api/settings/providers/${provider}`);
  },
  setActive: (provider) => {
    if (LOCAL_MODE) {
      localStorage.setItem(LOCAL_PROVIDER, provider);
      return Promise.resolve({ activeProvider: provider });
    }
    return request('PUT', '/api/settings/providers/active', { provider });
  },
};

// ── ADMIN ─────────────────────────────────────────────────────
export const adminAPI = {
  // GET /api/admin/stats — global overview
  getStats: () => adminRequest('GET', '/api/admin/stats'),

  // GET /api/admin/users — list all users
  getUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return adminRequest('GET', `/api/admin/users${query ? `?${query}` : ''}`);
  },

  // POST /api/admin/users — register new member
  createUser: (body) => adminRequest('POST', '/api/admin/users', body),

  // PATCH /api/admin/users/:id — update member profile/tier
  updateUser: (id, body) => adminRequest('PATCH', `/api/admin/users/${id}`, body),

  // DELETE /api/admin/users/:id — purge member
  deleteUser: (id) => adminRequest('DELETE', `/api/admin/users/${id}`),

  // POST /api/admin/users/:id/reset — reset usage
  resetUserUsage: (id) => adminRequest('POST', `/api/admin/users/${id}/reset`),

  // POST /api/admin/users/:id/plan — change user plan
  updateUserPlan: (id, plan) => adminRequest('POST', `/api/admin/users/${id}/plan`, { plan }),

  // GET /api/admin/revenue — billing overview
  getRevenue: () => adminRequest('GET', '/api/admin/revenue'),

  // GET /api/admin/growth — user growth charts
  getGrowth: () => adminRequest('GET', '/api/admin/growth'),

  // GET /api/admin/costs — AI cost tracking
  getCosts: () => adminRequest('GET', '/api/admin/costs'),

  // POST /api/admin/system/clear-cache — maintenance
  clearCache: () => adminRequest('POST', '/api/admin/system/clear-cache'),

  // GET /api/admin/analytics — growth metrics
  getAnalytics: () => adminRequest('GET', '/api/admin/analytics'),

  // GET /api/admin/ai-usage — provider costs
  getAiUsage: () => adminRequest('GET', '/api/admin/ai-usage'),

  // POST /api/admin/reset-usage — global reset
  resetAllUsage: () => adminRequest('POST', '/api/admin/reset-usage'),

  // GET /api/admin/outputs — manage all content
  getAllOutputs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return adminRequest('GET', `/api/admin/outputs${query ? `?${query}` : ''}`);
  },

  // PATCH /api/admin/outputs/:id — moderate content
  updateOutputStatus: (id, status) => adminRequest('PATCH', `/api/admin/outputs/${id}`, { status }),

  // GET /api/admin/health — system heartbeat
  getHealth: () => adminRequest('GET', '/api/admin/health'),
};
