import React from 'react';
import { Alert, Button, Card, CardContent, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { DashboardLayout } from '../../features/layouts/DashboardLayout';
import { fetchSmtpSettings, saveSmtpSettings, sendSmtpTestEmail } from './adminApi';

export function AdminSmtpPage() {
  const [form, setForm] = React.useState({ host: '', port: 587, secure: false, username: '', password: '', fromEmail: '', fromName: '' });
  const [testEmail, setTestEmail] = React.useState('');
  const [notice, setNotice] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    fetchSmtpSettings()
      .then((settings) => {
        if (!settings) return;
        setForm((prev) => ({
          ...prev,
          host: settings.host || '',
          port: settings.port || 587,
          secure: Boolean(settings.secure),
          username: settings.username || '',
          fromEmail: settings.fromEmail || '',
          fromName: settings.fromName || '',
        }));
      })
      .catch((e: any) => setError(e?.message || 'Unable to load SMTP settings'));
  }, []);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');

    try {
      await saveSmtpSettings(form);
      setNotice('SMTP settings saved.');
      setForm((prev) => ({ ...prev, password: '' }));
    } catch (e: any) {
      setError(e?.message || 'Unable to save SMTP settings');
    }
  };

  const handleTest = async () => {
    if (!testEmail) {
      setError('Provide an email address for testing.');
      return;
    }

    try {
      await sendSmtpTestEmail(testEmail);
      setNotice('Test email sent successfully.');
    } catch (e: any) {
      setError(e?.message || 'Unable to send test email');
    }
  };

  return (
    <DashboardLayout>
      <Stack spacing={2}>
        <Typography variant='h4' sx={{ fontWeight: 700 }}>SMTP Settings</Typography>
        {error && <Alert severity='error'>{error}</Alert>}
        {notice && <Alert severity='success'>{notice}</Alert>}

        <Card variant='outlined'>
          <CardContent>
            <Stack component='form' spacing={1.2} onSubmit={handleSave}>
              <TextField label='Host' value={form.host} onChange={(e) => setForm((prev) => ({ ...prev, host: e.target.value }))} required />
              <TextField type='number' label='Port' value={form.port} onChange={(e) => setForm((prev) => ({ ...prev, port: Number(e.target.value) || 587 }))} required />
              <TextField select label='Secure' value={form.secure ? 'true' : 'false'} onChange={(e) => setForm((prev) => ({ ...prev, secure: e.target.value === 'true' }))}>
                <MenuItem value='false'>false</MenuItem>
                <MenuItem value='true'>true</MenuItem>
              </TextField>
              <TextField label='Username' value={form.username} onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))} required />
              <TextField label='Password (leave blank to keep existing)' type='password' value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} />
              <TextField label='From Email' value={form.fromEmail} onChange={(e) => setForm((prev) => ({ ...prev, fromEmail: e.target.value }))} required />
              <TextField label='From Name' value={form.fromName} onChange={(e) => setForm((prev) => ({ ...prev, fromName: e.target.value }))} />
              <Button type='submit' variant='contained'>Save SMTP Settings</Button>
            </Stack>
          </CardContent>
        </Card>

        <Card variant='outlined'>
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <TextField label='Test recipient email' value={testEmail} onChange={(e) => setTestEmail(e.target.value)} fullWidth />
              <Button variant='outlined' onClick={handleTest}>Send Test Email</Button>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </DashboardLayout>
  );
}
