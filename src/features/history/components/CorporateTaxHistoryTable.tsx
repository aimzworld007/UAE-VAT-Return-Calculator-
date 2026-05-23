import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
} from '@mui/material';
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (!records.length) {
    return <Typography color='text.secondary'>No Corporate Tax history records found.</Typography>;
  }

  if (isMobile) {
    return (
      <Stack spacing={1.2}>
        {records.map((record) => {
          const revenue = toNumber(record.revenue ?? record.sales_total);
          const expenses = toNumber(record.expenses ?? record.expenses_total);
          const taxableProfit = toNumber(record.taxableProfit ?? record.taxable_profit ?? record.taxable_amount);
          const taxAmount = toNumber(record.taxAmount ?? record.tax_amount ?? record.corporate_tax_estimate);
          return (
            <Card key={record.id} variant='outlined'>
              <CardContent>
                <Stack spacing={0.8}>
                  <Typography sx={{ fontWeight: 700 }}>{record.period_label || 'N/A'}</Typography>
                  <Typography variant='body2'>Revenue: {revenue.toFixed(2)} AED</Typography>
                  <Typography variant='body2'>Expenses: {expenses.toFixed(2)} AED</Typography>
                  <Typography variant='body2'>Taxable Profit: {taxableProfit.toFixed(2)} AED</Typography>
                  <Typography variant='body2'>Estimated Tax: {taxAmount.toFixed(2)} AED</Typography>
                  <Typography variant='body2'>Created: {formatDate(record.created_at || record.createdAt)}</Typography>
                  <Stack direction='row' spacing={1} sx={{ mt: 0.5 }}>
                    <Button size='small' onClick={() => onView(record.id)}>
                      View
                    </Button>
                    <Button size='small' onClick={() => onDownload(record)} disabled={downloadingId === record.id}>
                      {downloadingId === record.id ? 'Downloading…' : 'Download'}
                    </Button>
                    <Button size='small' color='error' onClick={() => onDelete(record.id)}>
                      Delete
                    </Button>
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
            <TableCell align='right'>Revenue (AED)</TableCell>
            <TableCell align='right'>Expenses (AED)</TableCell>
            <TableCell align='right'>Taxable Profit (AED)</TableCell>
            <TableCell align='right'>Tax Amount (AED)</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Created</TableCell>
            <TableCell align='right'>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {records.map((record) => {
            const revenue = toNumber(record.revenue ?? record.sales_total);
            const expenses = toNumber(record.expenses ?? record.expenses_total);
            const taxableProfit = toNumber(record.taxableProfit ?? record.taxable_profit ?? record.taxable_amount);
            const taxAmount = toNumber(record.taxAmount ?? record.tax_amount ?? record.corporate_tax_estimate);

            return (
              <TableRow key={record.id} hover>
                <TableCell>{record.period_label || 'N/A'}</TableCell>
                <TableCell align='right'>{revenue.toFixed(2)}</TableCell>
                <TableCell align='right'>{expenses.toFixed(2)}</TableCell>
                <TableCell align='right'>{taxableProfit.toFixed(2)}</TableCell>
                <TableCell align='right'>{taxAmount.toFixed(2)}</TableCell>
                <TableCell>{record.status || 'draft'}</TableCell>
                <TableCell>{formatDate(record.created_at || record.createdAt)}</TableCell>
                <TableCell align='right'>
                  <Box sx={{ display: 'inline-flex', gap: 0.6 }}>
                    <Button size='small' onClick={() => onView(record.id)}>
                      View
                    </Button>
                    <Button size='small' onClick={() => onDownload(record)} disabled={downloadingId === record.id}>
                      {downloadingId === record.id ? 'Downloading…' : 'Download'}
                    </Button>
                    <Button size='small' color='error' onClick={() => onDelete(record.id)}>
                      Delete
                    </Button>
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
