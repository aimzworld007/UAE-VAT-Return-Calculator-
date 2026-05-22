import React from 'react';
import { Alert, Button, Card, CardContent, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { DashboardLayout } from '../../features/layouts/DashboardLayout';
import { fetchAuditLogs } from './adminApi';

export function AdminAuditPage() {
  const [filters, setFilters] = React.useState({ user: '', module: '', action: '', startDate: '', endDate: '' });
  const [rows, setRows] = React.useState<any[]>([]);
  const [error, setError] = React.useState('');

  const load = React.useCallback(() => {
    setError('');
    fetchAuditLogs(filters).then(setRows).catch((e: any) => setError(e?.message || 'Unable to load audit logs'));
  }, [filters]);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <DashboardLayout>
      <Stack spacing={2}>
        <Typography variant='h4' sx={{ fontWeight: 700 }}>Audit Logs</Typography>
        {error && <Alert severity='error'>{error}</Alert>}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
          <TextField label='User ID' value={filters.user} onChange={(e) => setFilters((prev) => ({ ...prev, user: e.target.value }))} />
          <TextField label='Module' value={filters.module} onChange={(e) => setFilters((prev) => ({ ...prev, module: e.target.value }))} />
          <TextField label='Action' value={filters.action} onChange={(e) => setFilters((prev) => ({ ...prev, action: e.target.value }))} />
          <TextField type='date' label='Start' InputLabelProps={{ shrink: true }} value={filters.startDate} onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))} />
          <TextField type='date' label='End' InputLabelProps={{ shrink: true }} value={filters.endDate} onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))} />
          <Button variant='contained' onClick={load}>Filter</Button>
        </Stack>

        {!rows.length && !error && <Alert severity='info'>No audit logs found.</Alert>}
        {rows.map((row) => (
          <Card key={row.id} variant='outlined'>
            <CardContent>
              <Stack spacing={0.4}>
                <Typography sx={{ fontWeight: 700 }}>{row.action} • {row.module || 'general'}</Typography>
                <Typography variant='body2' color='text.secondary'>
                  User: {row.user_id || 'system'} • {row.email || 'n/a'} • {String(row.created_at).replace('T', ' ').slice(0, 19)}
                </Typography>
                <Typography variant='body2' sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(row.metadata || {}, null, 2)}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </DashboardLayout>
  );
}