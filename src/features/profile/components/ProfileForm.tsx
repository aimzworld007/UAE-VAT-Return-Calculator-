import React from 'react';
import { Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';

export function ProfileForm({ profile, setProfile, onSubmit, loading }: { profile: any; setProfile: (next: any) => void; onSubmit: (e: React.FormEvent) => void; loading: boolean }) {
  return <Card variant='outlined'><CardContent><Stack component='form' onSubmit={onSubmit} spacing={1.4}><Typography variant='h6'>Profile Details</Typography><TextField label='Full Name' required value={profile.fullName} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} /><TextField label='Phone' value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /><TextField label='Address' multiline minRows={3} value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} /><Button type='submit' variant='contained' disabled={loading}>Save Profile</Button></Stack></CardContent></Card>;
}
