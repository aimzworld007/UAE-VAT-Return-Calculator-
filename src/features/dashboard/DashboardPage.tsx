import React from 'react';
import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { RouteLink } from '../../components/Router';
import { useAuth } from '../../modules/auth/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { EmptyState } from '../../shared/components/EmptyState';
import { ErrorState } from '../../shared/components/ErrorState';
import { LoadingState } from '../../shared/components/LoadingState';
import { formatCurrency } from '../../shared/utils/formatCurrency';
import { fetchDashboard } from './services/dashboardApi';

function RecordRow({ record }: { record: any }) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent='space-between' sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 1.2 }}>
      <Typography variant='body2' sx={{ fontWeight: 600 }}>
        {record.record_type === 'corporate_tax' ? 'Corporate Tax' : 'VAT'} • {String(record.period_start || '').slice(0, 10) || 'N/A'} - {String(record.period_end || '').slice(0, 10) || 'N/A'}
      </Typography>
      <Typography variant='caption' color='text.secondary'>{String(record.created_at || '').replace('T', ' ').slice(0, 19)}</Typography>
    </Stack>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    fetchDashboard()
      .then((dashboardData) => {
        setData(dashboardData || null);
        setError('');
      })
      .catch((e: any) => {
        setError(e?.message || 'Dashboard data could not be loaded.');
      })
      .finally(() => setLoading(false));
  }, []);

  const latestVat = Number(data?.latestVatPayable || 0);
  const kpis = [
    { label: 'VAT Records', value: data?.totalVatRecords || 0 },
    { label: 'Corporate Tax Records', value: data?.totalCorporateTaxRecords || 0 },
    { label: 'Latest VAT Position', value: latestVat >= 0 ? `Payable ${formatCurrency(latestVat)}` : `Refundable ${formatCurrency(Math.abs(latestVat))}` },
    { label: 'Latest Corporate Tax', value: formatCurrency(Number(data?.latestCorporateTax || 0)) },
    { label: 'Upcoming Reminders', value: data?.upcomingReminders?.length || 0 },
    { label: 'Revenue (Saved Records)', value: formatCurrency(Number(data?.totalRevenueFromTaxRecords || 0)) },
  ];

  const isNewUser = Number(data?.totalVatRecords || 0) === 0 && Number(data?.totalCorporateTaxRecords || 0) === 0;

  return (
    <DashboardLayout>
      <Stack spacing={2.2}>
        <Card variant='outlined'>
          <CardContent>
            <Typography variant='h4' sx={{ fontWeight: 800 }}>
              Welcome back, {user?.fullName || user?.name || user?.email}
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button component={RouteLink} to='/vat/details' variant='contained'>Create VAT Return</Button>
              <Button component={RouteLink} to='/tax/details' variant='contained'>Create Corporate Tax Record</Button>
            </Stack>
          </CardContent>
        </Card>

        {loading && <LoadingState message='Loading dashboard…' />}
        {!loading && error && <ErrorState message={error} />}

        {!loading && !error && (
          <>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,minmax(0,1fr))', lg: 'repeat(3,minmax(0,1fr))' }, gap: 1.5 }}>
              {kpis.map((kpi: any) => (
                <Card key={kpi.label} variant='outlined'>
                  <CardContent>
                    <Typography variant='body2' color='text.secondary'>{kpi.label}</Typography>
                    <Typography variant='h5' sx={{ fontWeight: 800 }}>{kpi.value}</Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>

            {isNewUser ? (
              <EmptyState message='No VAT or corporate tax records yet. Start by creating your first record.' />
            ) : (
              <Card variant='outlined'>
                <CardContent>
                  <Typography variant='h6' sx={{ mb: 1.2 }}>Recent History</Typography>
                  <Stack spacing={1}>
                    {(data?.recentRecords || []).length === 0 && <EmptyState message='No recent records found.' />}
                    {(data?.recentRecords || []).map((record: any) => <RecordRow key={`${record.record_type}-${record.id}`} record={record} />)}
                  </Stack>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </Stack>
    </DashboardLayout>
  );
}