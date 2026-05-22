import { apiDelete, apiGet, apiPost, apiPut } from '../../../shared/utils/apiClient';

export type ReminderPayload = {
  type: 'VAT' | 'Corporate Tax' | 'Other';
  title: string;
  dueDate: string;
  emailEnabled?: boolean;
  status?: 'pending' | 'completed';
};

export async function listReminders() {
  const response = await apiGet('/api/reminders');
  return response?.data || [];
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