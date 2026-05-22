import { Card, CardContent, Typography } from '@mui/material';
import React from 'react';

export function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card variant='outlined'>
      <CardContent>
        <Typography variant='body2' color='text.secondary'>{label}</Typography>
        <Typography variant='h5' sx={{ fontWeight: 700 }}>{value}</Typography>
      </CardContent>
    </Card>
  );
}