import { apiClient } from '../../../shared/utils/apiClient';

export type DashboardData = {
  totalVatRecords: number;
  totalCorporateTaxRecords: number;
  latestVatPayable: number;
  latestCorporateTax: number;
  upcomingReminders: Array<Record<string, any>>;
  totalRevenueFromTaxRecords: number;
  recentRecords: Array<Record<string, any>>;
  platform?: {
    totalUsers: number;
    totalBusinesses: number;
    totalVatRecords: number;
    totalCorporateTaxRecords: number;
    pendingReminders: number;
  };
};

export async function fetchDashboard(): Promise<DashboardData> {
  const response = await apiClient<any>('/api/dashboard/summary');
  return response?.data || response;
}