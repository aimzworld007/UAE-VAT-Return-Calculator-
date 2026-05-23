import React from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { HistoryTabs } from './components/HistoryTabs';
import { HistoryFilters } from './components/HistoryFilters';
import { VatHistoryTable } from './components/VatHistoryTable';
import { CorporateTaxHistoryTable } from './components/CorporateTaxHistoryTable';
import { HistoryDetailDialog } from './components/HistoryDetailDialog';
import { deleteCorporateTaxHistoryRecord, deleteVatHistoryRecord, getCorporateTaxHistoryRecord, getVatHistoryRecord, listCorporateTaxHistory, listVatHistory } from './services/historyApi';
import { downloadVatHistoryPdf } from '../tax/services/vatPdfApi';
import { downloadCorporateTaxHistoryPdf } from '../tax/services/corporateTaxPdfApi';

export function HistoryHubPage({ initialTab }: { initialTab: 'vat' | 'tax' }) {
  const [tab, setTab] = React.useState<'vat' | 'tax'>(initialTab);
  const [records, setRecords] = React.useState<any[]>([]);
  const [query, setQuery] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [error, setError] = React.useState('');
  const [detail, setDetail] = React.useState<any>(null);
  const [downloadingId, setDownloadingId] = React.useState<string | number | null>(null);
  const [page, setPage] = React.useState(1);
  const [meta, setMeta] = React.useState({ page: 1, limit: 20, total: 0 });
  const [deleteCandidateId, setDeleteCandidateId] = React.useState<string | number | null>(null);

  const load = React.useCallback(async () => {
    try {
      setError('');
      const payload = {
        page,
        limit: 20,
        search: query,
        status,
        startDate,
        endDate,
      };
      const next = tab === 'vat' ? await listVatHistory(payload) : await listCorporateTaxHistory(payload);
      setRecords(next.items || []);
      setMeta(next.meta || { page: 1, limit: 20, total: 0 });
    } catch (e: any) {
      setError(e?.message || 'Unable to load history records.');
    }
  }, [tab, page, query, status, startDate, endDate]);

  React.useEffect(() => { load(); }, [load]);
  React.useEffect(() => { setPage(1); }, [tab, query, status, startDate, endDate]);

  const filtered = records;

  const onView = async (id: string | number) => {
    try {
      const record = tab === 'vat' ? await getVatHistoryRecord(id) : await getCorporateTaxHistoryRecord(id);
      setDetail(record);
    } catch (e: any) {
      setError(e?.message || 'Unable to load record details.');
    }
  };

  const onDelete = async () => {
    const id = deleteCandidateId;
    if (!id) return;
    try {
      if (tab === 'vat') await deleteVatHistoryRecord(id);
      else await deleteCorporateTaxHistoryRecord(id);
      setDeleteCandidateId(null);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Unable to delete record.');
    }
  };

  const onDownloadVat = async (record: any) => {
    try {
      setDownloadingId(record.id);
      await downloadVatHistoryPdf(record);
    } catch (e: any) {
      setError(e?.message || 'Unable to download VAT PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  const onDownloadTax = async (record: any) => {
    try {
      setDownloadingId(record.id);
      await downloadCorporateTaxHistoryPdf(record);
    } catch (e: any) {
      setError(e?.message || 'Unable to download Corporate Tax PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil((meta.total || 0) / (meta.limit || 20)));

  return (
    <DashboardLayout>
      <Stack spacing={2.2}>
        <HistoryTabs value={tab} onChange={setTab} />
        <HistoryFilters
          query={query}
          onQueryChange={setQuery}
          status={status}
          onStatusChange={setStatus}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
        />
        {error && <Alert severity='error'>{error}</Alert>}
        {tab === 'vat' ? (
          <VatHistoryTable records={filtered} onView={onView} onDelete={(id) => setDeleteCandidateId(id)} onDownload={onDownloadVat} downloadingId={downloadingId} />
        ) : (
          <CorporateTaxHistoryTable records={filtered} onView={onView} onDelete={(id) => setDeleteCandidateId(id)} onDownload={onDownloadTax} downloadingId={downloadingId} />
        )}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant='body2' color='text.secondary'>
            Page {meta.page || page} of {totalPages} • {meta.total || 0} records
          </Typography>
          <Stack direction='row' spacing={1}>
            <Button size='small' variant='outlined' disabled={(meta.page || page) <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
              Previous
            </Button>
            <Button size='small' variant='outlined' disabled={(meta.page || page) >= totalPages} onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}>
              Next
            </Button>
          </Stack>
        </Box>
        <HistoryDetailDialog open={Boolean(detail)} record={detail} onClose={() => setDetail(null)} />
      </Stack>

      <Dialog open={Boolean(deleteCandidateId)} onClose={() => setDeleteCandidateId(null)}>
        <DialogTitle>Delete history record</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this record?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteCandidateId(null)}>Cancel</Button>
          <Button color='error' variant='contained' onClick={onDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
