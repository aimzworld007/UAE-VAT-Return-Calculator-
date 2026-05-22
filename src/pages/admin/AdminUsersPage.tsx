import React from 'react';
import { Alert, Button, Card, CardContent, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { DashboardLayout } from '../../features/layouts/DashboardLayout';
import { useAuth } from '../../modules/auth/AuthContext';
import { fetchAdminUsers, updateUserRole } from './adminApi';

export function AdminUsersPage() {
  const { user } = useAuth();
  const [items, setItems] = React.useState<any[]>([]);
  const [search, setSearch] = React.useState('');
  const [notice, setNotice] = React.useState('');
  const [error, setError] = React.useState('');

  const load = React.useCallback(() => {
    setError('');
    fetchAdminUsers(search).then(setItems).catch((e: any) => setError(e?.message || 'Unable to load users'));
  }, [search]);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleRoleChange = async (target: any, role: 'user' | 'superadmin') => {
    if (target.id === user?.id && role !== 'superadmin') {
      if (!window.confirm('You are about to demote yourself. Continue?')) return;
    }

    try {
      await updateUserRole(target.id, role);
      setNotice('User role updated.');
      load();
    } catch (e: any) {
      setError(e?.message || 'Unable to update role');
    }
  };

  return (
    <DashboardLayout>
      <Stack spacing={2}>
        <Typography variant='h4' sx={{ fontWeight: 700 }}>Admin Users</Typography>
        {error && <Alert severity='error'>{error}</Alert>}
        {notice && <Alert severity='success'>{notice}</Alert>}
        <Stack direction='row' spacing={1}>
          <TextField label='Search users' value={search} onChange={(e) => setSearch(e.target.value)} />
          <Button variant='contained' onClick={load}>Search</Button>
        </Stack>
        {!items.length && !error && <Alert severity='info'>No users found.</Alert>}
        {items.map((item) => (
          <Card key={item.id} variant='outlined'>
            <CardContent>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent='space-between' spacing={1}>
                <BoxText label={item.name || item.email} sub={`Created ${String(item.createdAt).slice(0, 10)} • ${item.email}`} />
                <TextField
                  select
                  label='Role'
                  value={item.role}
                  size='small'
                  onChange={(e) => handleRoleChange(item, e.target.value as 'user' | 'superadmin')}
                  sx={{ minWidth: 180 }}
                >
                  <MenuItem value='user'>user</MenuItem>
                  <MenuItem value='superadmin'>superadmin</MenuItem>
                </TextField>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </DashboardLayout>
  );
}

function BoxText({ label, sub }: { label: string; sub: string }) {
  return (
    <Stack>
      <Typography sx={{ fontWeight: 700 }}>{label}</Typography>
      <Typography variant='body2' color='text.secondary'>{sub}</Typography>
    </Stack>
  );
}