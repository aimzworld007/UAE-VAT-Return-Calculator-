import React from 'react';
import { Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';

export function PasswordChangeForm({ password, setPassword, onSubmit, loading }: { password: any; setPassword: (next: any) => void; onSubmit: (e: React.FormEvent) => void; loading: boolean }) {
  return <Card variant='outlined'><CardContent><Stack component='form' onSubmit={onSubmit} spacing={1.4}><Typography variant='h6'>Security: Change Password</Typography><TextField label='Current Password' type='password' required value={password.currentPassword} onChange={(e) => setPassword({ ...password, currentPassword: e.target.value })} /><TextField label='New Password' type='password' required helperText='Minimum 8 characters' value={password.newPassword} onChange={(e) => setPassword({ ...password, newPassword: e.target.value })} /><TextField label='Confirm New Password' type='password' required value={password.confirmPassword} onChange={(e) => setPassword({ ...password, confirmPassword: e.target.value })} /><Button type='submit' variant='contained' disabled={loading}>Change Password</Button></Stack></CardContent></Card>;
}
