import React from 'react';
import { Box, Button, Card, CardContent, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

function formatDate(value: any) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString();
}

function toNumber(value: any) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function getPayload(record: any) {
  return record?.payload && typeof record.payload === 'object' ? record.payload : {};
}

function sumPayloadMonthly(record: any, key: 'sales' | 'purchases' | 'expenses') {
  const payload = getPayload(record);
  const entries = Array.isArray(payload.monthlyEntries) ? payload.monthlyEntries : Array.isArray(payload.monthly) ? payload.monthly : [];
  return entries.reduce((sum: number, row: any) => sum + toNumber(row?.[key]), 0);
}

function deriveSales(record: any) {
  const direct = toNumber(record.sales_total ?? record.taxable_sales ?? record.taxableSales);
  if (direct > 0) return direct;
  const payload = getPayload(record);
  return toNumber(payload.totalSales ?? payload.standardRatedSales ?? sumPayloadMonthly(record, 'sales'));
}

function derivePurchases(record: any) {
  const direct = toNumber(record.purchase_total ?? record.taxable_purchases ?? record.taxablePurchases);
  if (direct > 0) return direct;
  const payload = getPayload(record);
  return toNumber(payload.totalPurchases ?? payload.standardRatedPurchases ?? sumPayloadMonthly(record, 'purchases'));
}

export function VatHistoryTable({
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (!records.length) {
    return <Typography color='text.secondary'>No VAT history records found.</Typography>;
  }

  if (isMobile) {
    return (
      <Stack spacing={1.2}>
        {records.map((record) => {
          const sales = deriveSales(record);
          const purchases = derivePurchases(record);
          const payable = toNumber(record.vat_payable ?? record.payable_vat ?? record.payableVat);
          const refundable = toNumber(record.vat_refundable ?? record.refundable_vat ?? record.refundableVat);
          const netVat = payable - refundable;

          return (
            <Card key={record.id} variant='outlined'>
              <CardContent>
                <Stack spacing={0.8}>
                  <Typography sx={{ fontWeight: 700 }}>{record.period_label || record.periodType || 'N/A'}</Typography>
                  <Typography variant='body2'>Sales: {sales.toFixed(2)} AED</Typography>
                  <Typography variant='body2'>Purchases: {purchases.toFixed(2)} AED</Typography>
                  <Typography variant='body2'>VAT: {netVat >= 0 ? `Payable ${netVat.toFixed(2)}` : `Refundable ${Math.abs(netVat).toFixed(2)}`}</Typography>
                  <Typography variant='body2'>Created: {formatDate(record.created_at || record.createdAt)}</Typography>
                  <Stack direction='row' spacing={1} sx={{ mt: 0.5 }}>
                    <Button size='small' onClick={() => onView(record.id)}>View</Button>
                    <Button size='small' onClick={() => onDownload(record)} disabled={downloadingId === record.id}>
                      {downloadingId === record.id ? 'Downloading…' : 'Download'}
                    </Button>
                    <Button size='small' color='error' onClick={() => onDelete(record.id)}>Delete</Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    );
  }

  return (
    <TableContainer component={Card} variant='outlined'>
      <Table size='small'>
        <TableHead>
          <TableRow>
            <TableCell>Period</TableCell>
            <TableCell align='right'>Sales (AED)</TableCell>
            <TableCell align='right'>Purchases (AED)</TableCell>
            <TableCell align='right'>VAT Payable</TableCell>
            <TableCell align='right'>VAT Refundable</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Created</TableCell>
            <TableCell align='right'>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {records.map((record) => {
            const sales = deriveSales(record);
            const purchases = derivePurchases(record);
            const payable = toNumber(record.vat_payable ?? record.payable_vat ?? record.payableVat);
            const refundable = toNumber(record.vat_refundable ?? record.refundable_vat ?? record.refundableVat);

            return (
              <TableRow key={record.id} hover>
                <TableCell>{record.period_label || record.periodType || 'N/A'}</TableCell>
                <TableCell align='right'>{sales.toFixed(2)}</TableCell>
                <TableCell align='right'>{purchases.toFixed(2)}</TableCell>
                <TableCell align='right'>{payable.toFixed(2)}</TableCell>
                <TableCell align='right'>{refundable.toFixed(2)}</TableCell>
                <TableCell>{record.status || 'draft'}</TableCell>
                <TableCell>{formatDate(record.created_at || record.createdAt)}</TableCell>
                <TableCell align='right'>
                  <Box sx={{ display: 'inline-flex', gap: 0.6 }}>
                    <Button size='small' onClick={() => onView(record.id)}>View</Button>
                    <Button size='small' onClick={() => onDownload(record)} disabled={downloadingId === record.id}>
                      {downloadingId === record.id ? 'Downloading…' : 'Download'}
                    </Button>
                    <Button size='small' color='error' onClick={() => onDelete(record.id)}>Delete</Button>
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
