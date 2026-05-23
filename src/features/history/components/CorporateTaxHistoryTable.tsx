import React from 'react';
import { Button, Card, CardContent, Stack, Typography } from '@mui/material';

export function CorporateTaxHistoryTable({
  records,
  onView,
  onDelete,
  onDownload,
  downloadingId,
}: {
  records: any[];
  onView: (id: string | number) => void;
  onDelete: (id: string | number) => void;
  onDownload: (record: any) => void;
  downloadingId?: string | number | null;
}) {
  return (
    <Stack spacing={1.2}>
      {records.map((r) => (
        <Card key={r.id} variant='outlined'>
          <CardContent>
            <Typography sx={{ fontWeight: 700 }}>{r.period_label || 'N/A'}</Typography>
            <Typography variant='body2'>
              Taxable: {Number(r.taxable_amount || 0).toFixed(2)} • Estimated Tax: {Number(r.corporate_tax_estimate || 0).toFixed(2)}
            </Typography>
            <Stack direction='row' spacing={1} sx={{ mt: 1 }}>
              <Button size='small' onClick={() => onView(r.id)}>
                View
              </Button>
              <Button size='small' onClick={() => onDownload(r)} disabled={downloadingId === r.id}>
                {downloadingId === r.id ? 'Downloading…' : 'Download'}
              </Button>
              <Button size='small' color='error' onClick={() => onDelete(r.id)}>
                Delete
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
