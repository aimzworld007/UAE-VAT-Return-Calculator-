import { apiClient } from '../../../shared/utils/apiClient';

export async function listVatHistory() {
  const response = await apiClient<{ data?: any[] }>('/api/vat-records');
  return response?.data || [];
}

export async function listCorporateTaxHistory() {
  const response = await apiClient<{ data?: any[] }>('/api/corporate-tax-records');
  return response?.data || [];
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
