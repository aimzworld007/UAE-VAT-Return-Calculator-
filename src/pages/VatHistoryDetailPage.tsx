import React from 'react';
import { Alert, Card, CardContent, Typography } from '@mui/material';
import { DashboardLayout } from '../features/layouts/DashboardLayout';
import { getVatHistoryRecord } from '../features/history/services/historyApi';

export function VatHistoryDetailPage({ id }: { id: string }) {
  const [record, setRecord] = React.useState<any>(null);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    getVatHistoryRecord(id).then(setRecord).catch((e: any) => setError(e?.message || 'Unable to load VAT record'));
  }, [id]);

  return (
    <DashboardLayout>
      {error && <Alert severity='error'>{error}</Alert>}
      {!error && !record && <Alert severity='info'>Loading VAT record…</Alert>}
      {record && (
        <Card variant='outlined'>
          <CardContent>
            <Typography variant='h5' sx={{ fontWeight: 700 }}>VAT Record Details</Typography>
            <pre style={{ whiteSpace: 'pre-wrap', overflowX: 'auto' }}>{JSON.stringify(record, null, 2)}</pre>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}