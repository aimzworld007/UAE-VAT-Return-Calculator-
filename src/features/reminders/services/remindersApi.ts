import { apiDelete, apiGet, apiPost, apiPut } from '../../../shared/utils/apiClient';

export type ReminderPayload = {
  type: 'VAT' | 'Corporate Tax' | 'Other';
  title: string;
  dueDate: string;
  emailEnabled?: boolean;
  status?: 'pending' | 'completed';
};

export type ReminderListFilters = {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'pending' | 'completed' | '';
  type?: 'VAT' | 'Corporate Tax' | 'Other' | '';
};

export async function listReminders(filters: ReminderListFilters = {}) {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  if (filters.type) params.set('type', filters.type);
  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await apiGet(`/api/reminders${query}`);
  return {
    items: response?.data || [],
    meta: response?.meta || { page: filters.page || 1, limit: filters.limit || 20, total: 0 },
  };
}

export async function listUpcomingReminders() {
  const response = await apiGet('/api/reminders/upcoming');
  return response?.data || [];
}

export async function createReminder(payload: ReminderPayload) {
  const response = await apiPost('/api/reminders', payload);
  return response?.data;
}

export async function updateReminder(id: string, payload: Partial<ReminderPayload>) {
  const response = await apiPut(`/api/reminders/${id}`, payload);
  return response?.data;
}

export async function deleteReminder(id: string) {
  await apiDelete(`/api/reminders/${id}`);
}

export async function sendReminderTestEmail(reminderId: string, to?: string) {
  const response = await apiPost(`/api/reminders/${reminderId}/test-email`, to ? { to } : {});
  return response?.data;
}
