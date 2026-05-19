import React from 'react';
import { Card, CardContent, Stack, Typography } from '@mui/material';

export function AccountInfoCard({ user }: { user: any }) {
  return <Card variant='outlined'><CardContent><Stack spacing={1}><Typography variant='h6'>Account Info</Typography><Typography><b>Email:</b> {user?.email || '-'}</Typography><Typography><b>Role:</b> {user?.role || '-'}</Typography><Typography><b>Status:</b> {user?.isActive ? 'Active' : 'Disabled'}</Typography></Stack></CardContent></Card>;
}
