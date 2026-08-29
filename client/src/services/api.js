const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD
    ? 'https://naratika-api.onrender.com/api'
    : '/api');

export function getAuthToken() {
  return localStorage.getItem('novel_auth_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('novel_auth_token', token);
  } else {
    localStorage.removeItem('novel_auth_token');
  }
}

export async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json.message || 'Terjadi kesalahan pada server');
  }

  return json;
}

// API methods
export const api = {
  // Auth
  register: (data) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => apiRequest('/auth/me'),

  // Novels
  getNovels: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/novels${qs ? `?${qs}` : ''}`);
  },
  getNovelDetail: (id) => apiRequest(`/novels/${id}`),
  createNovel: (data) => apiRequest('/novels', { method: 'POST', body: JSON.stringify(data) }),

  // Chapters
  getChapter: (novelId, chapterId) => apiRequest(`/novels/${novelId}/chapters/${chapterId}`),
  createChapter: (novelId, data) => apiRequest(`/novels/${novelId}/chapters`, { method: 'POST', body: JSON.stringify(data) }),
  unlockChapter: (chapterId, method = 'token') => apiRequest(`/chapters/${chapterId}/unlock`, { method: 'POST', body: JSON.stringify({ method }) }),

  // Library
  getLibrary: () => apiRequest('/library'),
  toggleBookmark: (novelId) => apiRequest('/library/bookmark', { method: 'POST', body: JSON.stringify({ novel_id: novelId }) }),
  saveProgress: (data) => apiRequest('/library/progress', { method: 'POST', body: JSON.stringify(data) }),

  // AdMob & Monetization
  getAdConfig: () => apiRequest('/ads/config'),
  updateAdConfig: (data) => apiRequest('/admin/ads/config', { method: 'PUT', body: JSON.stringify(data) }),
  claimAdReward: () => apiRequest('/ads/claim-reward', { method: 'POST' }),

  // Dashboards
  getAuthorDashboard: () => apiRequest('/author/dashboard'),
  getAdminDashboard: () => apiRequest('/admin/dashboard'),
  toggleFeatureNovel: (novelId) => apiRequest(`/admin/novels/${novelId}/feature`, { method: 'PUT' }),
};
