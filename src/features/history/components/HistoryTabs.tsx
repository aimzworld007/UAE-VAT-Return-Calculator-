import React from 'react';
import { Tab, Tabs } from '@mui/material';

export function HistoryTabs({ value, onChange }: { value: 'vat' | 'tax'; onChange: (value: 'vat' | 'tax') => void }) {
  return (
    <Tabs value={value} onChange={(_, next) => onChange(next)}>
      <Tab value='vat' label='VAT History' />
      <Tab value='tax' label='Corporate Tax History' />
    </Tabs>
  );
}
