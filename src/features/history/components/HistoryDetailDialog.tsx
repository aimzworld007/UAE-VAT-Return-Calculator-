import React from 'react';
import { Box, Dialog, DialogContent, DialogTitle, Typography } from '@mui/material';

export function HistoryDetailDialog({ open, onClose, record }: { open: boolean; onClose: () => void; record: any }) {
  return <Dialog open={open} onClose={onClose} fullWidth maxWidth='md'><DialogTitle>Record Details</DialogTitle><DialogContent><Typography variant='body2' sx={{ mb: 1.2 }}>{record?.analysis || 'No analysis available.'}</Typography><Box component='pre' sx={{ whiteSpace: 'pre-wrap', p: 1.2, bgcolor: '#0f172a', color: '#f8fafc', borderRadius: 1.4, maxHeight: 420, overflow: 'auto' }}>{JSON.stringify(record?.payload || {}, null, 2)}</Box></DialogContent></Dialog>;
}
