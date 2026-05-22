import React from 'react';
import { DashboardLayout } from '../../features/layouts/DashboardLayout';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}