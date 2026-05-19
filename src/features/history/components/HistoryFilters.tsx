import React from 'react';
import { Stack, TextField } from '@mui/material';

export function HistoryFilters({ query, onQueryChange }: { query: string; onQueryChange: (value: string) => void }) {
  return <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2}><TextField size='small' label='Search period / notes' value={query} onChange={(e) => onQueryChange(e.target.value)} sx={{ minWidth: 260 }} /></Stack>;
}
