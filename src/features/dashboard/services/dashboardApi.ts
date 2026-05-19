import { apiClient } from '../../../shared/utils/apiClient';

export type DashboardData = {
  user: { id: string; full_name?: string; email?: string } | null;
  businessProfile: Record<string, any> | null;
  vatCount: number;
  corporateTaxCount: number;
  totals: {
    sales: number;
    expenses: number;
    vatNet: number;
    corporateTaxEstimate: number;
  };
  upcomingReminders: Array<Record<string, any>>;
  recentVatRecords: Array<Record<string, any>>;
  recentCorporateTaxRecords: Array<Record<string, any>>;
};

export async function fetchDashboard(): Promise<DashboardData> {
  const response = await apiClient<{ data?: DashboardData }>('/api/dashboard');
  if (!response?.data) {
    throw new Error('Dashboard data is missing from server response.');
  }
  return response.data;
}
