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

function HistoryList({ records, emptyMessage }: { records: any[]; emptyMessage: string }) {
  if (!records.length) return <EmptyState message={emptyMessage} />;

  return (
    <Stack spacing={1}>
      {records.map((record: any) => (
        <Typography key={record.id} variant='body2'>
          {record.period_label || 'N/A'} • {Number(record.sales_total || 0).toFixed(2)}
        </Typography>
      ))}
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
      .catch(() => {
        setError('Unable to load dashboard details right now.');
      })
      .finally(() => setLoading(false));
  }, []);

  const vatNet = Number(data?.totals?.vatNet || 0);
  const kpis = [
    { label: 'Total VAT Records', value: data?.vatCount || 0 },
    { label: 'Total Corporate Tax Records', value: data?.corporateTaxCount || 0 },
    { label: 'Total Sales', value: formatCurrency(Number(data?.totals?.sales || 0)) },
    { label: 'Total Expenses', value: formatCurrency(Number(data?.totals?.expenses || 0)) },
    {
      label: 'VAT Payable / Refundable',
      value: vatNet >= 0 ? `Payable ${formatCurrency(vatNet)}` : `Refundable ${formatCurrency(Math.abs(vatNet))}`,
    },
  ];

  return (
    <DashboardLayout>
      <Stack spacing={2.2}>
        <Card variant='outlined'>
          <CardContent>
            <Typography variant='h4' sx={{ fontWeight: 800 }}>
              Welcome back, {user?.fullName || user?.email}
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button component={RouteLink} to='/vat/business-details' variant='contained'>
                New VAT Return
              </Button>
              <Button component={RouteLink} to='/tax/business-details' variant='contained'>
                New Corporate Tax
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {loading && <LoadingState message='Loading dashboard…' />}
        {!loading && error && <ErrorState message={error} />}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,minmax(0,1fr))' }, gap: 1.5 }}>
          {kpis.map((kpi: any) => (
            <Card key={kpi.label} variant='outlined'>
              <CardContent>
                <Typography variant='body2' color='text.secondary'>
                  {kpi.label}
                </Typography>
                <Typography variant='h5' sx={{ fontWeight: 800 }}>
                  {kpi.value}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2}>
          <Card variant='outlined' sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant='h6'>Recent VAT Records</Typography>
              <HistoryList records={data?.recentVatRecords || []} emptyMessage='No recent VAT records found.' />
            </CardContent>
          </Card>
          <Card variant='outlined' sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant='h6'>Recent Corporate Tax Records</Typography>
              <HistoryList records={data?.recentCorporateTaxRecords || []} emptyMessage='No recent corporate tax records found.' />
            </CardContent>
          </Card>
        </Stack>
      </Stack>
    </DashboardLayout>
  );
}
