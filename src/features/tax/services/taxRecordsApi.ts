import { apiDelete, apiGet, apiPost, apiPut } from '../../../shared/utils/apiClient';

export async function createTaxRecord(payload: {
  taxType: 'VAT' | 'CORPORATE';
  businessProfileId?: string | null;
  periodType?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  inputPayload: Record<string, unknown>;
  resultPayload: Record<string, unknown>;
}) {
  const response = await apiPost('/api/tax-records', payload);
  return response;
}

export async function listTaxRecords() {
  const response = await apiGet('/api/tax-records');
  return response?.data?.records || [];
}

export async function getTaxRecord(id: string) {
  const response = await apiGet(`/api/tax-records/${id}`);
  return response?.data?.record;
}

export async function updateTaxRecord(
  id: string,
  payload: Partial<{
    periodStart: string | null;
    periodEnd: string | null;
    inputPayload: Record<string, unknown>;
    resultPayload: Record<string, unknown>;
  }>
) {
  const response = await apiPut(`/api/tax-records/${id}`, payload);
  return response?.data?.record;
}

export async function deleteTaxRecord(id: string) {
  const response = await apiDelete(`/api/tax-records/${id}`);
  return response?.data?.id;
}
