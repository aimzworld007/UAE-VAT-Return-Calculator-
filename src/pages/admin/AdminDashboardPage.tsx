import React from 'react';
import { Alert, Card, CardContent, Grid, Stack, Typography } from '@mui/material';
import { DashboardLayout } from '../../features/layouts/DashboardLayout';
import { fetchAdminSummary } from './adminApi';
import { StatCard } from '../../components/common/StatCard';

export function AdminDashboardPage() {
  const [data, setData] = React.useState<any>(null);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    fetchAdminSummary().then(setData).catch((e: any) => setError(e?.message || 'Unable to load admin summary'));
  }, []);

  return (
    <DashboardLayout>
      <Stack spacing={2}>
        <Typography variant='h4' sx={{ fontWeight: 700 }}>Superadmin Dashboard</Typography>
        {error && <Alert severity='error'>{error}</Alert>}
        {!error && !data && <Alert severity='info'>Loading admin summary…</Alert>}
        {data && (
          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={6} md={4}><StatCard label='Total Users' value={data.totalUsers} /></Grid>
            <Grid item xs={12} sm={6} md={4}><StatCard label='Total Businesses' value={data.totalBusinesses} /></Grid>
            <Grid item xs={12} sm={6} md={4}><StatCard label='Total VAT Records' value={data.totalVatRecords} /></Grid>
            <Grid item xs={12} sm={6} md={4}><StatCard label='Total Corporate Tax Records' value={data.totalCorporateTaxRecords} /></Grid>
            <Grid item xs={12} sm={6} md={4}><StatCard label='Pending Reminders' value={data.pendingReminders} /></Grid>
          </Grid>
        )}

        {data?.recentUsers?.length > 0 && (
          <Card variant='outlined'>
            <CardContent>
              <Typography variant='h6' sx={{ mb: 1 }}>Recent Users</Typography>
              <Stack spacing={0.8}>
                {data.recentUsers.map((user: any) => (
                  <Typography key={user.id} variant='body2'>
                    {user.name || user.email} • {user.role} • {String(user.createdAt).slice(0, 10)}
                  </Typography>
                ))}
              </Stack>
            </CardContent>
          </Card>
        )}
      </Stack>
    </DashboardLayout>
  );
}