import { apiClient } from '../../../shared/utils/apiClient';

export type HistoryFilters = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
};

function buildHistoryQuery(filters: HistoryFilters = {}) {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  return params.toString() ? `?${params.toString()}` : '';
}

export async function listVatHistory(filters: HistoryFilters = {}) {
  const response = await apiClient<{ data?: any[]; meta?: any }>(`/api/vat-records${buildHistoryQuery(filters)}`);
  return { items: response?.data || [], meta: response?.meta || { page: filters.page || 1, limit: filters.limit || 20, total: 0 } };
}

export async function listCorporateTaxHistory(filters: HistoryFilters = {}) {
  const response = await apiClient<{ data?: any[]; meta?: any }>(`/api/corporate-tax-records${buildHistoryQuery(filters)}`);
  return { items: response?.data || [], meta: response?.meta || { page: filters.page || 1, limit: filters.limit || 20, total: 0 } };
}

export async function getVatHistoryRecord(id: string | number) {
  const response = await apiClient<{ data?: any }>(`/api/vat-records/${id}`);
  return response?.data;
}

export async function getCorporateTaxHistoryRecord(id: string | number) {
  const response = await apiClient<{ data?: any }>(`/api/corporate-tax-records/${id}`);
  return response?.data;
}

export async function deleteVatHistoryRecord(id: string | number) {
  await apiClient(`/api/vat-records/${id}`, { method: 'DELETE' });
}

export async function deleteCorporateTaxHistoryRecord(id: string | number) {
  await apiClient(`/api/corporate-tax-records/${id}`, { method: 'DELETE' });
}
