import React from 'react';
import { Alert, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { DashboardLayout } from '../../features/layouts/DashboardLayout';
import { useAuth } from '../../modules/auth/AuthContext';
import { fetchAdminUsers, updateUserRole } from './adminApi';

export function AdminUsersPage() {
  const { user } = useAuth();
  const [items, setItems] = React.useState<any[]>([]);
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [meta, setMeta] = React.useState({ page: 1, limit: 25, total: 0 });
  const [notice, setNotice] = React.useState('');
  const [error, setError] = React.useState('');
  const [pendingRoleChange, setPendingRoleChange] = React.useState<{ target: any; role: 'user' | 'superadmin' } | null>(null);

  const load = React.useCallback(() => {
    setError('');
    fetchAdminUsers(search, page, 25)
      .then((result) => {
        setItems(result.items || []);
        setMeta(result.meta || { page: 1, limit: 25, total: 0 });
      })
      .catch((e: any) => setError(e?.message || 'Unable to load users'));
  }, [search, page]);

  React.useEffect(() => {
    load();
  }, [load]);
  React.useEffect(() => {
    setPage(1);
  }, [search]);

  const handleRoleChange = async (target: any, role: 'user' | 'superadmin') => {
    if (target.id === user?.id && role !== 'superadmin') {
      setPendingRoleChange({ target, role });
      return;
    }

    try {
      await updateUserRole(target.id, role);
      setNotice('User role updated.');
      load();
    } catch (e: any) {
      setError(e?.message || 'Unable to update role');
    }
  };

  const confirmRoleChange = async () => {
    if (!pendingRoleChange) return;
    try {
      await updateUserRole(pendingRoleChange.target.id, pendingRoleChange.role);
      setNotice('User role updated.');
      setPendingRoleChange(null);
      load();
    } catch (e: any) {
      setError(e?.message || 'Unable to update role');
    }
  };

  const totalPages = Math.max(1, Math.ceil((meta.total || 0) / (meta.limit || 25)));

  return (
    <DashboardLayout>
      <Stack spacing={2}>
        <Typography variant='h4' sx={{ fontWeight: 700 }}>Admin Users</Typography>
        {error && <Alert severity='error'>{error}</Alert>}
        {notice && <Alert severity='success'>{notice}</Alert>}
        <Stack direction='row' spacing={1}>
          <TextField label='Search users' value={search} onChange={(e) => setSearch(e.target.value)} />
          <Button variant='contained' onClick={() => { setPage(1); load(); }}>Search</Button>
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
        <Stack direction='row' justifyContent='space-between' alignItems='center'>
          <Typography variant='body2' color='text.secondary'>
            Page {meta.page || page} of {totalPages} • {meta.total || 0} users
          </Typography>
          <Stack direction='row' spacing={1}>
            <Button size='small' variant='outlined' disabled={(meta.page || page) <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
              Previous
            </Button>
            <Button size='small' variant='outlined' disabled={(meta.page || page) >= totalPages} onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}>
              Next
            </Button>
          </Stack>
        </Stack>
      </Stack>

      <Dialog open={Boolean(pendingRoleChange)} onClose={() => setPendingRoleChange(null)}>
        <DialogTitle>Confirm role change</DialogTitle>
        <DialogContent>
          <Typography>You are about to demote your own superadmin role. Continue?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingRoleChange(null)}>Cancel</Button>
          <Button color='warning' variant='contained' onClick={confirmRoleChange}>Confirm</Button>
        </DialogActions>
      </Dialog>
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
