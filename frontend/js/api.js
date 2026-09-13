import { API_BASE_URL } from './config.js';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './auth.js';

export class ApiError extends Error {
  constructor(status, data) {
    super((data && (data.detail || data.error)) || 'API xatosi yuz berdi');
    this.status = status;
    this.data = data;
  }
}

async function tryRefreshToken() {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) throw new Error('refresh failed');
    const data = await res.json();
    setTokens(data.access, refresh);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

async function request(path, { method = 'GET', body, auth = false, params } = {}) {
  let url = `${API_BASE_URL}${path}`;
  if (params) {
    const cleaned = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
    const qs = new URLSearchParams(cleaned).toString();
    if (qs) url += `?${qs}`;
  }

  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const doFetch = () => fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });

  // Render'ning bepul xizmati uzoq turgandan keyin "uyqudan uyg'onadi" — birinchi so'rov
  // ba'zan vaqt yetishmasligi yoki vaqtinchalik xatolik bilan tugaydi. Shu holatlarda
  // bir marta kutib, qayta urinib ko'ramiz (foydalanuvchiga darhol xato ko'rsatmasdan).
  let response;
  try {
    response = await doFetch();
    if (response.status >= 502 && response.status <= 504) {
      await new Promise((r) => setTimeout(r, 3000));
      response = await doFetch();
    }
  } catch {
    await new Promise((r) => setTimeout(r, 3000));
    response = await doFetch();
  }

  if (response.status === 401 && auth) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${getAccessToken()}`;
      response = await doFetch();
    }
  }

  if (!response.ok) {
    let data = {};
    try { data = await response.json(); } catch { /* body yo'q bo'lishi mumkin */ }
    throw new ApiError(response.status, data);
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
  delete: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
};
