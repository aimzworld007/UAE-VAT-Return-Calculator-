import React from 'react';
import { Alert, Box, Grid, Stack, Typography } from '@mui/material';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useAuth } from '../../modules/auth/AuthContext';
import { AccountInfoCard } from './components/AccountInfoCard';
import { ProfileForm } from './components/ProfileForm';
import { PasswordChangeForm } from './components/PasswordChangeForm';

export function ProfileSettingsPage() {
  const { user, refreshUser, updateProfile, changePassword, loading } = useAuth();
  const [profile, setProfile] = React.useState({ fullName: '', phone: '', address: '' });
  const [password, setPassword] = React.useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [notice, setNotice] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  React.useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  React.useEffect(() => {
    setProfile({ fullName: user?.fullName || '', phone: user?.phone || '', address: user?.address || '' });
  }, [user?.fullName, user?.phone, user?.address]);

  const onSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await updateProfile(profile);
    if (result.ok) setNotice({ type: 'success', text: 'Profile updated successfully.' });
    else setNotice({ type: 'error', text: result.error || 'Failed to update profile.' });
  };

  const onChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.newPassword !== password.confirmPassword) {
      setNotice({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }
    const result = await changePassword(password.currentPassword, password.newPassword);
    if (result.ok) {
      setNotice({ type: 'success', text: 'Password changed successfully.' });
      setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else setNotice({ type: 'error', text: result.error || 'Failed to change password.' });
  };

  return <DashboardLayout><Stack spacing={2.5}>
    <Box>
      <Typography variant='h4' sx={{ fontWeight: 700 }}>Profile & Settings</Typography>
      <Typography color='text.secondary'>Manage your account profile and password security.</Typography>
    </Box>
    {notice && <Alert severity={notice.type}>{notice.text}</Alert>}
    <Grid container spacing={2.2}>
      <Grid item xs={12} md={4}>
        <AccountInfoCard user={user} />
      </Grid>
      <Grid item xs={12} md={8}>
        <ProfileForm profile={profile} setProfile={setProfile} onSubmit={onSaveProfile} loading={loading} />
      </Grid>
      <Grid item xs={12}>
        <PasswordChangeForm password={password} setPassword={setPassword} onSubmit={onChangePassword} loading={loading} />
      </Grid>
    </Grid>
  </Stack></DashboardLayout>;
}
