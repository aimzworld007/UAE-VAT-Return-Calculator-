const TOKEN_KEY = 'auth_token';

function getBaseUrl() {
  const envBase = (import.meta as any).env?.VITE_API_BASE_URL;
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

  const response = await fetch(`${getBaseUrl()}${url}`, { credentials: 'include', ...init, headers });
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    const error = new Error(`API returned non-JSON response (${response.status})`);
    (error as any).status = response.status;
    throw error;
  }

  const json = await response.json();
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
