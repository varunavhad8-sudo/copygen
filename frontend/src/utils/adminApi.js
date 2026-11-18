
const adminFetch = async (path, options = {}) => {
  const secret = localStorage.getItem('cg_admin_secret');
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'admin-secret': secret,
      ...options.headers,
    },
  });

  const json = await response.json();
  
  if (!response.ok) {
    throw new Error(json.error || json.message || `Error ${response.status}: ${response.statusText}`);
  }
  
  return json;
};

export const adminAPI = {
  getStats: () => adminFetch('/api/admin/stats'),
  getHealth: () => adminFetch('/api/admin/health'),
  getUsers: () => adminFetch('/api/admin/users'),
  getRevenue: () => adminFetch('/api/admin/revenue'),
  getAiUsage: () => adminFetch('/api/admin/ai-usage'),
  getOutputs: () => adminFetch('/api/admin/outputs'),
  getAnalytics: () => adminFetch('/api/admin/analytics'),
  resetAllUsage: () => adminFetch('/api/admin/reset-usage', { method: 'POST' }),
  
  // User Mutations
  updateUser: (id, data) => adminFetch(`/api/admin/users/${id}`, { method: 'PATCH', body: data }),
  resetUserUsage: (id) => adminFetch(`/api/admin/users/${id}/reset`, { method: 'POST' }),
  deleteUser: (id) => adminFetch(`/api/admin/users/${id}`, { method: 'DELETE' }),

  // Output Mutations
  updateOutput: (id, data) => adminFetch(`/api/admin/outputs/${id}`, { method: 'PATCH', body: data }),
};
