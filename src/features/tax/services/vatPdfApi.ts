import { getStoredToken } from '../../../shared/utils/apiClient';
import { createPdfBlobFromReport } from '../lib/pdfGenerator';

function withAuthHeaders(headers = {}) {
  const token = getStoredToken();
  return token ? { ...headers, Authorization: `Bearer ${token}` } : headers;
}

async function requestServerVatPdf(payload: any): Promise<Blob> {
  const response = await fetch('/api/vat/pdf', {
    method: 'POST',
    credentials: 'include',
    headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload || {}),
  });

  if (!response.ok) {
    let message = 'Failed to generate VAT PDF';
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json().catch(() => null);
      message = data?.message || data?.error || message;
    }
    throw new Error(message);
  }

  return response.blob();
}

export async function generateVatPdfBlob(payload: any) {
  try {
    return await requestServerVatPdf(payload);
  } catch (serverError) {
    console.warn('Server VAT PDF failed, falling back to client-side renderer.', serverError);
    return await createPdfBlobFromReport('vat201-report');
  }
}

export function createPdfPreview(blob: Blob) {
  return window.URL.createObjectURL(blob);
}

export function cleanupPdfPreviewUrl(url?: string | null) {
  if (url) window.URL.revokeObjectURL(url);
}

export function downloadPdf(blob: Blob, filename: string) {
  const legacyNavigator = window.navigator as Navigator & { msSaveOrOpenBlob?: (fileBlob: Blob, defaultName?: string) => boolean };
  if (legacyNavigator.msSaveOrOpenBlob) {
    legacyNavigator.msSaveOrOpenBlob(blob, filename);
    return;
  }

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
}

export async function downloadVatPdf(payload: any) {
  const blob = await generateVatPdfBlob(payload);
  downloadPdf(blob, 'vat201-return-summary.pdf');
}

export function buildVatPdfPayloadFromHistoryRecord(record: any) {
  const payload = record?.payload || {};
  const periodStart = record?.periodStart || record?.period_start || payload?.taxPeriodStart || payload?.filing_period_start;
  const periodEnd = record?.periodEnd || record?.period_end || payload?.taxPeriodEnd || payload?.filing_period_end;

  const labelFromDates = periodStart && periodEnd ? `${String(periodStart).slice(0, 10)} to ${String(periodEnd).slice(0, 10)}` : 'Saved VAT Period';

  const payable = Number(record?.payableVat ?? record?.vat_payable ?? 0) || 0;
  const refundable = Number(record?.refundableVat ?? record?.vat_refundable ?? 0) || 0;
  const netVat = payable - refundable;

  return {
    businessName: payload.businessName || payload.companyName || 'Saved VAT Record',
    trn: payload.trn || payload.taxRegistrationNumber || 'N/A',
    businessLocationEmirate: payload.businessLocationEmirate || 'N/A',
    vatPeriod: record?.period_label || record?.periodType || labelFromDates,
    preparedBy: 'UAE VAT & Tax Filing Assistant',
    preparedDate: new Date().toISOString().slice(0, 10),
    vatMode: payload.vatPricingMode === 'tax_inclusive' || payload.vatPricingMode === 'Tax Inclusive' ? 'Inclusive' : 'Exclusive',
    summary: {
      taxableSales: Number(record?.taxableSales ?? record?.taxable_sales ?? record?.sales_total ?? payload?.standardRatedSales ?? payload?.totalSales ?? 0) || 0,
      outputVat: Number(record?.outputVat ?? record?.output_vat ?? payload?.outputVat ?? 0) || 0,
      recoverableVat: Number(record?.inputVat ?? record?.input_vat ?? payload?.inputVat ?? 0) || 0,
      zeroRated: Number(payload?.zeroRatedSales ?? 0) || 0,
      exempt: Number(payload?.exemptSales ?? 0) || 0,
      netVat,
    },
    boxes: Array.isArray(payload?.boxes) ? payload.boxes : [],
    monthly: Array.isArray(payload?.monthlyEntries) ? payload.monthlyEntries : Array.isArray(payload?.monthly) ? payload.monthly : [],
  };
}

export async function downloadVatHistoryPdf(record: any) {
  const pdfPayload = buildVatPdfPayloadFromHistoryRecord(record);
  const safePeriod = String(pdfPayload.vatPeriod || 'period').replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '');
  const safeBusiness = String(pdfPayload.businessName || 'vat-record').replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '');

  try {
    const blob = await requestServerVatPdf(pdfPayload);
    downloadPdf(blob, `${safeBusiness}-${safePeriod}-vat-history.pdf`);
    return;
  } catch (error) {
    console.warn('VAT history server PDF failed, falling back to lightweight client PDF.', error);
  }

  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF('p', 'mm', 'a4');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('UAE VAT Summary', 14, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Generated by UAE VAT & Corporate Tax System', 14, 24);

  let y = 34;
  const line = (label: string, value: string) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 58, y);
    y += 7;
  };

  const formatMoney = (value: number) => new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(Number(value) || 0);

  line('Business Name', String(pdfPayload.businessName || 'N/A'));
  line('TRN', String(pdfPayload.trn || 'N/A'));
  line('VAT Period', String(pdfPayload.vatPeriod || 'N/A'));
  line('Taxable Sales', formatMoney(Number(pdfPayload?.summary?.taxableSales || 0)));
  line('Output VAT', formatMoney(Number(pdfPayload?.summary?.outputVat || 0)));
  line('Recoverable VAT', formatMoney(Number(pdfPayload?.summary?.recoverableVat || 0)));
  line('Net VAT', formatMoney(Number(pdfPayload?.summary?.netVat || 0)));

  y += 4;
  doc.setFontSize(9);
  doc.text('Disclaimer: Verify records and UAE FTA requirements before final filing.', 14, y);
  doc.save(`${safeBusiness}-${safePeriod}-vat-history.pdf`);
}
