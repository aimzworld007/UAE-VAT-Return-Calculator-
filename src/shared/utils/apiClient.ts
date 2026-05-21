const TOKEN_KEY = 'fta_tax_auth_token';

function getBaseUrl() {
  const envBase = (import.meta as any).env?.VITE_API_URL || (import.meta as any).env?.VITE_API_BASE_URL;
  return envBase || '';
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (!token) localStorage.removeItem(TOKEN_KEY);
  else localStorage.setItem(TOKEN_KEY, token);
}

export async function apiClient<T = any>(url: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers || {});
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');

  const token = getStoredToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${getBaseUrl()}${url}`, { credentials: 'include', ...init, headers });
  const contentType = response.headers.get('content-type') || '';

  let json: any = null;
  if (contentType.includes('application/json')) {
    json = await response.json();
  } else {
    const text = await response.text();
    json = { message: text || `API returned non-JSON response (${response.status})` };
  }

  if (response.status === 401 || response.status === 403) {
    setStoredToken(null);
    const error = new Error('SESSION_EXPIRED');
    (error as any).status = response.status;
    throw error;
  }

  if (!response.ok) {
    const error = new Error(json?.message || 'Request failed');
    (error as any).status = response.status;
    throw error;
  }
  return json;
}

export const apiGet = (url: string) => apiClient(url);
export const apiPost = (url: string, body?: unknown) => apiClient(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
export const apiPut = (url: string, body?: unknown) => apiClient(url, { method: 'PUT', body: body ? JSON.stringify(body) : undefined });
export const apiPatch = (url: string, body?: unknown) => apiClient(url, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined });
export const apiDelete = (url: string) => apiClient(url, { method: 'DELETE' });
