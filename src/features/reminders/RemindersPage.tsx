import React from 'react';
import { Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { EmptyState } from '../../shared/components/EmptyState';
import { LoadingState } from '../../shared/components/LoadingState';
import { createReminder, deleteReminder, listReminders, listUpcomingReminders, updateReminder } from './services/remindersApi';

const initialForm = {
  type: 'VAT' as 'VAT' | 'Corporate Tax' | 'Other',
  title: '',
  dueDate: '',
  emailEnabled: false,
  status: 'pending' as 'pending' | 'completed',
};

export function RemindersPage() {
  const [items, setItems] = React.useState<any[]>([]);
  const [upcoming, setUpcoming] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [notice, setNotice] = React.useState('');
  const [form, setForm] = React.useState(initialForm);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [allReminders, upcomingReminders] = await Promise.all([listReminders(), listUpcomingReminders()]);
      setItems(allReminders);
      setUpcoming(upcomingReminders);
    } catch (e: any) {
      setError(e?.message || 'Unable to load reminders');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setNotice('');
    setError('');

    try {
      if (editingId) {
        await updateReminder(editingId, form);
        setNotice('Reminder updated successfully.');
      } else {
        await createReminder(form);
        setNotice('Reminder created successfully.');
      }
      resetForm();
      await load();
    } catch (e: any) {
      setError(e?.message || 'Unable to save reminder');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setForm({
      type: item.type,
      title: item.title,
      dueDate: String(item.dueDate || item.due_date || '').slice(0, 10),
      emailEnabled: Boolean(item.emailEnabled ?? item.email_enabled),
      status: item.status,
    });
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteReminder(confirmDelete);
      setNotice('Reminder deleted successfully.');
      setConfirmDelete(null);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Unable to delete reminder');
    }
  };

  return (
    <DashboardLayout>
      <Stack spacing={2.2}>
        <Box>
          <Typography variant='h4' sx={{ fontWeight: 700 }}>Filing Reminders</Typography>
          <Typography color='text.secondary'>Create VAT and Corporate Tax reminder schedules with optional email support.</Typography>
        </Box>

        {loading && <LoadingState message='Loading reminders…' />}
        {error && <Alert severity='error'>{error}</Alert>}
        {notice && <Alert severity='success'>{notice}</Alert>}

        <Grid container spacing={2}>
          <Grid item xs={12} md={5}>
            <Card variant='outlined'>
              <CardContent>
                <Typography variant='h6' sx={{ mb: 1.5 }}>{editingId ? 'Edit Reminder' : 'Create Reminder'}</Typography>
                <Stack component='form' spacing={1.2} onSubmit={handleSubmit}>
                  <TextField
                    select
                    label='Reminder Type'
                    value={form.type}
                    onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as any }))}
                    required
                  >
                    <MenuItem value='VAT'>VAT</MenuItem>
                    <MenuItem value='Corporate Tax'>Corporate Tax</MenuItem>
                    <MenuItem value='Other'>Other</MenuItem>
                  </TextField>
                  <TextField
                    label='Title'
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                    required
                  />
                  <TextField
                    type='date'
                    label='Due Date'
                    InputLabelProps={{ shrink: true }}
                    value={form.dueDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                    required
                  />
                  <TextField
                    select
                    label='Email Reminder'
                    value={form.emailEnabled ? 'enabled' : 'disabled'}
                    onChange={(e) => setForm((prev) => ({ ...prev, emailEnabled: e.target.value === 'enabled' }))}
                  >
                    <MenuItem value='disabled'>Disabled</MenuItem>
                    <MenuItem value='enabled'>Enabled</MenuItem>
                  </TextField>
                  <TextField
                    select
                    label='Status'
                    value={form.status}
                    onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as any }))}
                  >
                    <MenuItem value='pending'>Pending</MenuItem>
                    <MenuItem value='completed'>Completed</MenuItem>
                  </TextField>
                  <Stack direction='row' spacing={1}>
                    <Button type='submit' variant='contained' disabled={saving}>{saving ? 'Saving…' : editingId ? 'Update' : 'Create'}</Button>
                    {editingId && <Button variant='outlined' onClick={resetForm}>Cancel</Button>}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={7}>
            <Card variant='outlined'>
              <CardContent>
                <Typography variant='h6' sx={{ mb: 1.5 }}>Upcoming Reminders</Typography>
                {!upcoming.length && <EmptyState message='No upcoming reminders.' />}
                <Stack spacing={1.1}>
                  {upcoming.map((item) => (
                    <Card key={item.id} variant='outlined'>
                      <CardContent sx={{ py: 1.3 }}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent='space-between' spacing={1}>
                          <Box>
                            <Typography sx={{ fontWeight: 700 }}>{item.title}</Typography>
                            <Typography variant='body2' color='text.secondary'>
                              {item.type} • Due {String(item.dueDate || item.due_date).slice(0, 10)}
                            </Typography>
                          </Box>
                          <Stack direction='row' spacing={1} alignItems='center'>
                            <Chip size='small' color={item.status === 'completed' ? 'success' : 'warning'} label={item.status} />
                            <Button size='small' onClick={() => handleEdit(item)}>Edit</Button>
                            <Button size='small' color='error' onClick={() => setConfirmDelete(item.id)}>Delete</Button>
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card variant='outlined'>
          <CardContent>
            <Typography variant='h6' sx={{ mb: 1.2 }}>All Reminders</Typography>
            {!items.length && <EmptyState message='No reminders saved yet.' />}
            <Stack spacing={1}>
              {items.map((item) => (
                <Stack key={item.id} direction={{ xs: 'column', sm: 'row' }} justifyContent='space-between' sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 1.2 }}>
                  <Typography variant='body2'>
                    {item.title} • {item.type} • {String(item.dueDate || item.due_date).slice(0, 10)}
                  </Typography>
                  <Chip size='small' label={item.status} color={item.status === 'completed' ? 'success' : 'default'} />
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      <Dialog open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)}>
        <DialogTitle>Delete reminder</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this reminder?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button color='error' variant='contained' onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}