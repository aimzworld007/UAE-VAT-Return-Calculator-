import PDFDocument from 'pdfkit';
import { formatCurrency, sanitizeNumber, sanitizeText } from '../utils/formatCurrency.js';
import { getFtaLogoImage } from './ftaLogoService.js';

export function buildCorporateTaxPdfPayload(body = {}) {
  const summary = body.summary || {};
  return {
    companyName: sanitizeText(body.companyName || body.businessName, 'N/A'),
    trn: sanitizeText(body.trn || body.taxRegistrationNumber, 'N/A'),
    businessActivity: sanitizeText(body.businessActivity || body.activity, 'N/A'),
    taxPeriod: sanitizeText(body.taxPeriod, 'N/A'),
    preparedBy: sanitizeText(body.preparedBy, 'UAE VAT & Corporate Tax System'),
    preparedDate: sanitizeText(body.preparedDate, new Date().toISOString().slice(0, 10)),
    summary: {
      revenue: sanitizeNumber(summary.revenue),
      expenses: sanitizeNumber(summary.expenses),
      taxableProfit: sanitizeNumber(summary.taxableProfit),
      taxAmount: sanitizeNumber(summary.taxAmount),
    },
  };
}

export async function generateCorporateTaxPdf(payload, out) {
  const doc = new PDFDocument({ size: 'A4', margin: 48 });
  doc.pipe(out);

  doc.roundedRect(48, 44, 499, 86, 10).fillAndStroke('#f8fbff', '#dbeafe');
  const logo = await getFtaLogoImage();
  if (logo?.buffer) {
    doc.image(logo.buffer, 50, 50, { fit: [116, 44] });
  }
  doc.fontSize(20).fillColor('#0f172a').text('UAE Corporate Tax Report', 62, 62);
  doc.fontSize(10).fillColor('#475569').text('Prepared from UAE VAT & Corporate Tax System', 62, 88);
  doc.fontSize(10).fillColor('#0f172a').text(`Prepared Date: ${payload.preparedDate}`, 370, 64, { width: 165, align: 'right' });
  doc.fillColor('#0f172a').text(`Prepared By: ${payload.preparedBy}`, 370, 82, { width: 165, align: 'right' });
  doc.fillColor('#0f172a').text(`Tax Period: ${payload.taxPeriod}`, 370, 100, { width: 165, align: 'right' });

  let y = 154;
  doc.fontSize(12).fillColor('#0f172a').text('Company Information', 48, y);
  y += 18;
  const infoRows = [
    ['Company Name', payload.companyName],
    ['Tax Registration Number', payload.trn],
    ['Business Activity', payload.businessActivity],
  ];
  infoRows.forEach(([label, value]) => {
    doc.roundedRect(48, y - 5, 499, 24, 6).fillAndStroke('#ffffff', '#e2e8f0');
    doc.fontSize(10).fillColor('#475569').text(label, 60, y + 2, { width: 185 });
    doc.fontSize(10).fillColor('#0f172a').text(value, 228, y + 2, { width: 305 });
    y += 28;
  });

  y += 10;
  doc.fontSize(12).fillColor('#0f172a').text('Corporate Tax Snapshot', 48, y);
  y += 20;

  const metricCards = [
    ['Revenue', payload.summary.revenue],
    ['Expenses', payload.summary.expenses],
    ['Taxable Profit', payload.summary.taxableProfit],
    ['Estimated Tax', payload.summary.taxAmount],
  ];

  metricCards.forEach(([label, value], index) => {
    const x = 48 + index * 126;
    doc.roundedRect(x, y, 118, 62, 8).fillAndStroke('#f8fafc', '#dbe6f3');
    doc.fontSize(9).fillColor('#475569').text(label, x + 10, y + 12);
    doc.fontSize(11).fillColor('#0f172a').text(formatCurrency(value), x + 10, y + 32, { width: 96 });
  });

  y += 84;
  doc.fontSize(12).fillColor('#0f172a').text('Computation Summary', 48, y);
  y += 16;

  const summaryRows = [
    ['Total Revenue', payload.summary.revenue],
    ['Total Expenses', payload.summary.expenses],
    ['Taxable Profit', payload.summary.taxableProfit],
    ['Tax Rate Applied', '9%'],
    ['Estimated Corporate Tax', payload.summary.taxAmount],
  ];

  summaryRows.forEach(([label, value], idx) => {
    const rowColor = idx % 2 === 0 ? '#ffffff' : '#f8fbff';
    doc.rect(48, y, 499, 24).fillAndStroke(rowColor, '#e2e8f0');
    doc.fontSize(10).fillColor('#111827').text(label, 60, y + 8);
    doc
      .fontSize(10)
      .fillColor('#111827')
      .text(typeof value === 'string' ? value : formatCurrency(value), 390, y + 8, { width: 145, align: 'right' });
    y += 24;
  });

  y += 18;
  doc.fontSize(9).fillColor('#6b7280').text(
    'Disclaimer: This report is a calculation assistant summary only. Verify records and UAE FTA requirements before official submission.',
    48,
    y,
    { width: 500 }
  );

  doc.end();
}
