import { apiGet, apiPatch, apiPost, apiPut } from '../../shared/utils/apiClient';

export async function fetchAdminSummary() {
  const response = await apiGet('/api/admin/summary');
  return response?.data;
}

export async function fetchAdminUsers(search = '') {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  const response = await apiGet(`/api/admin/users${query}`);
  return response?.data?.users || [];
}

export async function updateUserRole(userId: string, role: 'user' | 'superadmin') {
  const response = await apiPatch(`/api/users/${userId}/role`, { role });
  return response?.data?.user;
}

export async function fetchSmtpSettings() {
  const response = await apiGet('/api/admin/smtp-settings');
  return response?.data;
}

export async function saveSmtpSettings(payload: any) {
  const response = await apiPut('/api/admin/smtp-settings', payload);
  return response?.data;
}

export async function sendSmtpTestEmail(to: string) {
  const response = await apiPost('/api/admin/smtp-settings/test-email', { to });
  return response?.data;
}

export async function fetchAuditLogs(filters: { user?: string; module?: string; action?: string; startDate?: string; endDate?: string } = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await apiGet(`/api/admin/audit-logs${query}`);
  return response?.data || [];
}