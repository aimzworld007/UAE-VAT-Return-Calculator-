import { apiClient } from '../../../shared/utils/apiClient';

export type BusinessProfile = {
  id: string;
  userId?: string;
  businessName: string;
  trn?: string;
  emirate?: string;
  address?: string;
  phone?: string;
  email?: string;
  activity?: string;
  vatFilingFrequency?: string;
  corporateTaxYearStart?: string;
  corporateTaxYearEnd?: string;
  defaultVatPricingMode?: string;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export async function fetchBusinessProfileOverview() {
  return apiClient<{ data?: BusinessProfile | null; profiles?: BusinessProfile[] }>('/api/business-profile');
}

export async function listBusinessProfiles() {
  const response = await apiClient<{ data?: BusinessProfile[] }>('/api/business-profile/list');
  return response?.data || [];
}

export async function createBusinessProfile(payload: Partial<BusinessProfile>) {
  const response = await apiClient<{ data?: BusinessProfile }>('/api/business-profile', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return response?.data || null;
}

export async function updateBusinessProfile(id: string, payload: Partial<BusinessProfile>) {
  const response = await apiClient<{ data?: BusinessProfile }>(`/api/business-profile/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return response?.data || null;
}

export async function savePrimaryBusinessProfile(payload: Partial<BusinessProfile>) {
  const response = await apiClient<{ data?: BusinessProfile }>('/api/business-profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return response?.data || null;
}

export async function setDefaultBusinessProfile(id: string) {
  const response = await apiClient<{ data?: BusinessProfile }>(`/api/business-profile/${id}/default`, {
    method: 'PATCH',
  });
  return response?.data || null;
}

export async function deleteBusinessProfile(id: string) {
  await apiClient(`/api/business-profile/${id}`, { method: 'DELETE' });
}
