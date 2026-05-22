const TOKEN_KEY = 'fta_tax_auth_token';

export class ApiError extends Error {
  status;
  code;
  payload;

  constructor(message, status, code, payload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.payload = payload;
  }
}

function readEnvBaseUrl() {
  const env = import.meta?.env || {};
  return env.VITE_API_URL || env.VITE_API_BASE_URL || '';
}

function normalizeUrl(path) {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = readEnvBaseUrl();
  if (!base) return path;
  if (path.startsWith('/')) return `${base}${path}`;
  return `${base}/${path}`;
}

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token) {
  try {
    if (!token) localStorage.removeItem(TOKEN_KEY);
    else localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Ignore localStorage failures.
  }
}

async function parseApiResponse(response) {
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.toLowerCase().includes('application/json')) {
    const text = await response.text().catch(() => '');
    throw new ApiError(
      `API returned non-JSON response (${response.status})`,
      response.status,
      'NON_JSON_RESPONSE',
      { preview: text.slice(0, 280) }
    );
  }

  return response.json();
}

export async function apiClient(url, init = {}) {
  const headers = new Headers(init.headers || {});

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getStoredToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(normalizeUrl(url), {
    ...init,
    credentials: 'include',
    headers,
  });

  let payload;
  try {
    payload = await parseApiResponse(response);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to parse API response', response.status, 'RESPONSE_PARSE_ERROR');
  }

  if (!response.ok) {
    const error = new ApiError(
      payload?.message || `Request failed with status ${response.status}`,
      response.status,
      payload?.code || 'REQUEST_FAILED',
      payload
    );

    if (response.status === 401 || response.status === 403) {
      setStoredToken(null);
    }

    throw error;
  }

  return payload;
}

export const apiGet = (url, init = {}) => apiClient(url, { ...init, method: 'GET' });
export const apiPost = (url, body, init = {}) => apiClient(url, { ...init, method: 'POST', body: body ? JSON.stringify(body) : undefined });
export const apiPut = (url, body, init = {}) => apiClient(url, { ...init, method: 'PUT', body: body ? JSON.stringify(body) : undefined });
export const apiPatch = (url, body, init = {}) => apiClient(url, { ...init, method: 'PATCH', body: body ? JSON.stringify(body) : undefined });
export const apiDelete = (url, init = {}) => apiClient(url, { ...init, method: 'DELETE' });