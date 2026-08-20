const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('eh_token');
}

export function setToken(token) {
  localStorage.setItem('eh_token', token);
}

export function clearToken() {
  localStorage.removeItem('eh_token');
  localStorage.removeItem('eh_user');
}

export function getUser() {
  const u = localStorage.getItem('eh_user');
  return u ? JSON.parse(u) : null;
}

export function setUser(user) {
  localStorage.setItem('eh_user', JSON.stringify(user));
}

export function isLoggedIn() {
  return !!getToken();
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401 || res.status === 403) {
    clearToken();
    window.location.hash = '#/';
    throw new Error('Session expired. Please log in again.');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

async function requestFormData(path, formData, method = 'POST') {
  const token = getToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { method, headers, body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// Auth
export const api = {
  auth: {
    login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    me: () => request('/auth/me'),
  },

  dashboard: {
    stats: () => request('/dashboard/stats'),
    alerts: () => request('/dashboard/alerts'),
  },

  employees: {
    list: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/employees${q ? '?' + q : ''}`);
    },
    get: (id) => request(`/employees/${id}`),
    create: (data) => request('/employees', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/employees/${id}`, { method: 'DELETE' }),
    updateOnboarding: (id, data) => request(`/employees/${id}/onboarding`, { method: 'PUT', body: JSON.stringify(data) }),
  },

  documents: {
    list: (empId) => request(`/employees/${empId}/documents`),
    upload: (empId, formData) => requestFormData(`/employees/${empId}/documents`, formData),
    updateStatus: (docId, status, notes) => request(`/documents/${docId}/status`, { method: 'PUT', body: JSON.stringify({ status, notes }) }),
    delete: (docId) => request(`/documents/${docId}`, { method: 'DELETE' }),
  },

  categories: {
    list: () => request('/document-categories'),
    create: (data) => request('/document-categories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/document-categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/document-categories/${id}`, { method: 'DELETE' }),
  },

  leave: {
    list: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/leave${q ? '?' + q : ''}`);
    },
    create: (data) => request('/leave', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id, status, notes) => request(`/leave/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, notes }) }),
  },

  settings: {
    get: () => request('/settings'),
    update: (data) => request('/settings', { method: 'PUT', body: JSON.stringify(data) }),
    activityLog: () => request('/settings/activity'),
  },
};

export default api;
