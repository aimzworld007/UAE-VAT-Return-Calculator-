import React from 'react';
import { MenuItem, Stack, TextField } from '@mui/material';

export function HistoryFilters({
  query,
  onQueryChange,
  status,
  onStatusChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
}) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2}>
      <TextField size='small' label='Search period / notes' value={query} onChange={(e) => onQueryChange(e.target.value)} sx={{ minWidth: 220 }} />
      <TextField select size='small' label='Status' value={status} onChange={(e) => onStatusChange(e.target.value)} sx={{ minWidth: 140 }}>
        <MenuItem value=''>All</MenuItem>
        <MenuItem value='draft'>Draft</MenuItem>
        <MenuItem value='final'>Final</MenuItem>
        <MenuItem value='pending'>Pending</MenuItem>
        <MenuItem value='completed'>Completed</MenuItem>
      </TextField>
      <TextField size='small' type='date' label='Start Date' InputLabelProps={{ shrink: true }} value={startDate} onChange={(e) => onStartDateChange(e.target.value)} />
      <TextField size='small' type='date' label='End Date' InputLabelProps={{ shrink: true }} value={endDate} onChange={(e) => onEndDateChange(e.target.value)} />
    </Stack>
  );
}
