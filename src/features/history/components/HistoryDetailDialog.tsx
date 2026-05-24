import React from 'react';
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

function toNumber(value: any) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatMoney(value: any) {
  return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(toNumber(value));
}

function payloadOf(record: any) {
  return record?.payload && typeof record.payload === 'object' ? record.payload : {};
}

function sumMonthly(record: any, key: 'sales' | 'purchases' | 'expenses') {
  const payload = payloadOf(record);
  const rows = Array.isArray(payload.monthlyEntries) ? payload.monthlyEntries : Array.isArray(payload.monthly) ? payload.monthly : [];
  return rows.reduce((sum: number, row: any) => sum + toNumber(row?.[key]), 0);
}

function isVatRecord(record: any) {
  return record && (record.outputVat != null || record.output_vat != null || record.vat_payable != null || record.payable_vat != null);
}

function rowsForRecord(record: any) {
  if (!record || typeof record !== 'object') {
    return [];
  }
  const payload = payloadOf(record);
  if (isVatRecord(record)) {
    const sales = toNumber(record.sales_total ?? record.taxable_sales ?? record.taxableSales ?? payload.totalSales ?? payload.standardRatedSales ?? sumMonthly(record, 'sales'));
    const purchases = toNumber(record.purchase_total ?? record.taxable_purchases ?? record.taxablePurchases ?? payload.totalPurchases ?? payload.standardRatedPurchases ?? sumMonthly(record, 'purchases'));
    const expenses = toNumber(record.expenses_total ?? record.expenses ?? payload.totalExpenses ?? payload.directExpenses ?? sumMonthly(record, 'expenses'));
    const outputVat = toNumber(record.output_vat ?? record.outputVat ?? payload.outputVat);
    const inputVat = toNumber(record.input_vat ?? record.inputVat ?? payload.inputVat);
    const payable = toNumber(record.vat_payable ?? record.payable_vat ?? record.payableVat);
    const refundable = toNumber(record.vat_refundable ?? record.refundable_vat ?? record.refundableVat);
    const netVat = payable - refundable;
    return [
      ['Type', 'VAT Return'],
      ['Period', record.period_label || record.periodType || 'N/A'],
      ['Status', record.status || 'draft'],
      ['Sales', formatMoney(sales)],
      ['Purchases', formatMoney(purchases)],
      ['Expenses', formatMoney(expenses)],
      ['Output VAT', formatMoney(outputVat)],
      ['Input VAT', formatMoney(inputVat)],
      ['Net VAT', formatMoney(netVat)],
      ['Created', new Date(record.created_at || record.createdAt || Date.now()).toLocaleString()],
    ];
  }

  const revenue = toNumber(record.revenue ?? record.sales_total ?? payload.totalRevenue ?? payload.revenue);
  const expenses = toNumber(record.expenses ?? record.expenses_total ?? payload.totalExpenses ?? payload.directExpenses);
  const taxableProfit = toNumber(record.taxableProfit ?? record.taxable_profit ?? record.taxable_amount ?? payload.taxableIncome);
  const taxAmount = toNumber(record.taxAmount ?? record.tax_amount ?? record.corporate_tax_estimate ?? payload.taxPayable);

  return [
    ['Type', 'Corporate Tax'],
    ['Period', record.period_label || 'N/A'],
    ['Status', record.status || 'draft'],
    ['Revenue', formatMoney(revenue)],
    ['Expenses', formatMoney(expenses)],
    ['Taxable Profit', formatMoney(taxableProfit)],
    ['Estimated Tax', formatMoney(taxAmount)],
    ['Created', new Date(record.created_at || record.createdAt || Date.now()).toLocaleString()],
  ];
}

export function HistoryDetailDialog({ open, onClose, record }: { open: boolean; onClose: () => void; record: any }) {
  const detailRows = React.useMemo(() => rowsForRecord(record), [record]);
  const payload = payloadOf(record);
  const monthlyRows = Array.isArray(payload.monthlyEntries) ? payload.monthlyEntries : Array.isArray(payload.monthly) ? payload.monthly : [];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='md'>
      <DialogTitle>History Record Details</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
            <Table size='small'>
              <TableBody>
                {detailRows.length ? detailRows.map(([label, value]) => (
                  <TableRow key={label}>
                    <TableCell sx={{ width: 200, fontWeight: 700 }}>{label}</TableCell>
                    <TableCell>{value}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={2}>No history record selected.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {monthlyRows.length ? (
            <Box>
              <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 700 }}>
                Monthly Breakdown
              </Typography>
              <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Month</TableCell>
                      <TableCell align='right'>Sales</TableCell>
                      <TableCell align='right'>Purchases</TableCell>
                      <TableCell align='right'>Expenses</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {monthlyRows.map((row: any, idx: number) => (
                      <TableRow key={`${row?.month || 'month'}-${idx}`}>
                        <TableCell>{row?.month || `Month ${idx + 1}`}</TableCell>
                        <TableCell align='right'>{formatMoney(row?.sales)}</TableCell>
                        <TableCell align='right'>{formatMoney(row?.purchases)}</TableCell>
                        <TableCell align='right'>{formatMoney(row?.expenses)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ) : null}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
