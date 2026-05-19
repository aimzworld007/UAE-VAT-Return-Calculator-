import React from 'react';
import { Alert, Stack } from '@mui/material';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { HistoryTabs } from './components/HistoryTabs';
import { HistoryFilters } from './components/HistoryFilters';
import { VatHistoryTable } from './components/VatHistoryTable';
import { CorporateTaxHistoryTable } from './components/CorporateTaxHistoryTable';
import { HistoryDetailDialog } from './components/HistoryDetailDialog';
import { deleteCorporateTaxHistoryRecord, deleteVatHistoryRecord, getCorporateTaxHistoryRecord, getVatHistoryRecord, listCorporateTaxHistory, listVatHistory } from './services/historyApi';

export function HistoryHubPage({ initialTab }: { initialTab: 'vat' | 'tax' }) {
  const [tab, setTab] = React.useState<'vat' | 'tax'>(initialTab);
  const [records, setRecords] = React.useState<any[]>([]);
  const [query, setQuery] = React.useState('');
  const [error, setError] = React.useState('');
  const [detail, setDetail] = React.useState<any>(null);

  const load = React.useCallback(async () => {
    try {
      setError('');
      const next = tab === 'vat' ? await listVatHistory() : await listCorporateTaxHistory();
      setRecords(next);
    } catch (e: any) {
      setError(e?.message || 'Unable to load history records.');
    }
  }, [tab]);

  React.useEffect(() => { load(); }, [load]);

  const filtered = records.filter((r) => `${r.period_label || ''} ${JSON.stringify(r.payload || {})}`.toLowerCase().includes(query.toLowerCase()));

  const onView = async (id: string | number) => {
    try {
      const record = tab === 'vat' ? await getVatHistoryRecord(id) : await getCorporateTaxHistoryRecord(id);
      setDetail(record);
    } catch (e: any) {
      setError(e?.message || 'Unable to load record details.');
    }
  };

  const onDelete = async (id: string | number) => {
    if (!window.confirm('Delete this history record?')) return;
    try {
      if (tab === 'vat') await deleteVatHistoryRecord(id);
      else await deleteCorporateTaxHistoryRecord(id);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Unable to delete record.');
    }
  };

  return <DashboardLayout><Stack spacing={2.2}><HistoryTabs value={tab} onChange={setTab} /><HistoryFilters query={query} onQueryChange={setQuery} />{error && <Alert severity='error'>{error}</Alert>}{tab === 'vat' ? <VatHistoryTable records={filtered} onView={onView} onDelete={onDelete} /> : <CorporateTaxHistoryTable records={filtered} onView={onView} onDelete={onDelete} />}<HistoryDetailDialog open={Boolean(detail)} record={detail} onClose={() => setDetail(null)} /></Stack></DashboardLayout>;
}
