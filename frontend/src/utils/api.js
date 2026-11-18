import { auth } from '../config/firebase'; // Adjusted path to firebase init file

const LOCAL_MODE = import.meta.env.VITE_LOCAL_MODE === 'true';
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const LOCAL_PROVIDER_KEY = 'copygen_local_provider_key';
const LOCAL_PROVIDER = 'copygen_local_provider';
const LOCAL_DATA = 'copygen_local_data_v1';

const loadLocalData = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(LOCAL_DATA) || 'null');
    if (saved) return saved;
  } catch (_) {}
  return {
    profile: { name: 'Local User', email: 'local@copygen.local', agencyName: '', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    notifications: { genComplete: true, weeklySum: true, monthlyRep: false, lowCredits: true, billing: true, newFeatures: true, tips: false, security: true },
    clients: [{ _id: 'local-client', id: 'local-client', name: 'My Workspace', industry: '', website: '', outputCount: 0 }],
    brands: [],
    outputs: [],
    templates: []
  };
};

const saveLocalData = (data) => localStorage.setItem(LOCAL_DATA, JSON.stringify(data));
const localId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

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
  const data = loadLocalData();
  const [pathname, queryString = ''] = path.split('?');
  const query = new URLSearchParams(queryString);

  if (pathname === '/api/clients') {
    if (method === 'GET') return data.clients;
    if (method === 'POST') {
      const client = { ...body, _id: localId('client'), id: localId('client'), outputCount: 0 };
      data.clients.push(client); saveLocalData(data); return client;
    }
    const id = pathname ? path.split('/').pop() : null;
    if (method === 'PUT') {
      const index = data.clients.findIndex(client => client._id === id || client.id === id);
      if (index >= 0) data.clients[index] = { ...data.clients[index], ...body };
      saveLocalData(data); return data.clients[index] || body;
    }
  }
  if (pathname.startsWith('/api/clients/')) {
    const id = pathname.split('/').pop();
    const index = data.clients.findIndex(client => client._id === id || client.id === id);
    if (method === 'PUT') { data.clients[index] = { ...data.clients[index], ...body }; saveLocalData(data); return data.clients[index]; }
    if (method === 'DELETE') { data.clients.splice(index, 1); saveLocalData(data); return { success: true }; }
  }
  if (pathname === '/api/brand' || pathname.startsWith('/api/brand/')) {
    const clientId = query.get('clientId') || pathname.split('/').pop();
    if (method === 'GET') {
      if (pathname === '/api/brand' && !clientId) return data.brands;
      return { profile: data.brands.find(brand => brand.clientId === clientId) || { clientId, clientName: data.clients.find(client => client._id === clientId)?.name || 'My Workspace', isNew: true } };
    }
    if (method === 'POST' || method === 'PUT') {
      const saved = { ...body, _id: body?._id || localId('brand'), clientId: body?.clientId || clientId };
      const index = data.brands.findIndex(brand => brand.clientId === saved.clientId);
      if (index >= 0) data.brands[index] = saved; else data.brands.push(saved);
      saveLocalData(data); return saved;
    }
    if (method === 'DELETE') { data.brands = data.brands.filter(brand => brand._id !== clientId && brand.clientId !== clientId); saveLocalData(data); return { success: true }; }
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
    const result = json.data !== undefined ? json.data : json.output || json;
    const output = { ...(result.output || result), _id: localId('output'), id: localId('output'), createdAt: new Date().toISOString(), clientId: body?.clientId || 'local-client' };
    data.outputs.unshift(output);
    const client = data.clients.find(item => item._id === output.clientId || item.id === output.clientId);
    if (client) client.outputCount = (client.outputCount || 0) + 1;
    saveLocalData(data);
    return output;
  }
  if (pathname === '/api/outputs' || pathname.startsWith('/api/outputs/')) {
    if (method === 'GET') {
      if (pathname !== '/api/outputs') return data.outputs.find(output => output._id === pathname.split('/').pop());
      let outputs = [...data.outputs];
      if (query.get('clientId')) outputs = outputs.filter(output => output.clientId === query.get('clientId'));
      if (query.get('contentType')) outputs = outputs.filter(output => output.contentType === query.get('contentType'));
      if (query.get('search')) outputs = outputs.filter(output => JSON.stringify(output).toLowerCase().includes(query.get('search').toLowerCase()));
      return { outputs, total: outputs.length, pages: Math.max(1, Math.ceil(outputs.length / 10)) };
    }
    const id = pathname.split('/').pop();
    if (method === 'PUT') { const index = data.outputs.findIndex(output => output._id === id); data.outputs[index] = { ...data.outputs[index], ...body }; saveLocalData(data); return data.outputs[index]; }
    if (method === 'DELETE') { data.outputs = data.outputs.filter(output => output._id !== id); saveLocalData(data); return { success: true }; }
  }
  if (pathname === '/api/templates' || pathname.startsWith('/api/templates/')) {
    if (method === 'GET') return data.templates;
    if (method === 'POST') { const template = { ...body, _id: localId('template'), createdAt: new Date().toISOString() }; data.templates.push(template); saveLocalData(data); return template; }
    const id = pathname.split('/').pop();
    if (method === 'PUT') { const index = data.templates.findIndex(template => template._id === id); data.templates[index] = { ...data.templates[index], ...body }; saveLocalData(data); return data.templates[index]; }
    if (method === 'DELETE') { data.templates = data.templates.filter(template => template._id !== id); saveLocalData(data); return { success: true }; }
  }
  if (pathname.startsWith('/api/analytics/')) {
    if (pathname.endsWith('/summary')) return { summary: { totalGenerations: data.outputs.length, activeClients: data.clients.length, brandVoices: data.brands.length, favoriteOutputs: data.outputs.filter(output => output.favorited).length } };
    if (pathname.endsWith('/volume')) return [];
    if (pathname.endsWith('/breakdown')) return [];
    if (pathname.endsWith('/top-clients')) return data.clients.map(client => ({ name: client.name, generations: data.outputs.filter(output => output.clientId === client._id).length }));
  }
  if (method === 'GET' && pathname === '/api/auth/notifications') return data.notifications;
  if (method === 'PUT' && pathname === '/api/auth/notifications') { data.notifications = { ...data.notifications, ...body }; saveLocalData(data); return data.notifications; }
  if (method === 'PUT' && pathname === '/api/auth/profile') { data.profile = { ...data.profile, ...body }; saveLocalData(data); return data.profile; }
  if (method === 'GET' && pathname === '/api/transactions') return [];
  if (method === 'GET' && pathname === '/api/auth/me') return { user: { ...data.profile, plan: 'free', generationsLimit: 999999, generationsUsed: data.outputs.length } };
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

  toggleFavorite: (id, favorited) => request('PUT', `/api/outputs/${id}`, { favorited }),

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
    if (LOCAL_MODE) {
      const blob = new Blob([JSON.stringify(loadLocalData(), null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `copygen-local-data-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
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
  deleteAccount: (body) => {
    if (LOCAL_MODE) {
      localStorage.removeItem(LOCAL_DATA);
      localStorage.removeItem(LOCAL_PROVIDER_KEY);
      localStorage.removeItem(LOCAL_PROVIDER);
      return Promise.resolve({ success: true });
    }
    return request('DELETE', '/api/auth/account', body);
  },

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
