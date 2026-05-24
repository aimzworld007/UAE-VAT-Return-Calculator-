import fs from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import { formatCurrency, sanitizeNumber, sanitizeText } from '../utils/formatCurrency.js';
import { getFtaLogoImage } from './ftaLogoService.js';

const VAT201_NON_EMIRATE_ROWS = [
  ['2', 'Tax refunds provided to tourists'], ['3', 'Supplies subject to reverse charge provisions'],
  ['4', 'Zero rated supplies'], ['5', 'Exempt supplies'], ['6', 'Goods imported into UAE'], ['7', 'Adjustments to goods imported into UAE'],
  ['8', 'Total output tax due'], ['9', 'Standard rated expenses'], ['10', 'Supplies subject to reverse charge provisions'],
  ['11', 'Total recoverable tax'], ['12', 'Total tax due'], ['13', 'Total recoverable tax'], ['14', 'Payable tax for the period']
];

function drawFooter(doc) {
  const disclaimer = 'This report is a calculation aid only. Verify UAE FTA rules, invoice eligibility, exempt/zero-rated supplies, and accounting records before official VAT submission.';
  doc.fontSize(8).fillColor('#6b7280').text(disclaimer, 48, 792 - 52, { width: 500, align: 'left' });
  doc.text(`Page ${doc.bufferedPageRange().count}`, 535, 792 - 20, { align: 'right' });
}

export function buildVatPdfPayload(body) {
  const summary = body.summary || {};
  return {
    businessName: sanitizeText(body.businessName, 'N/A'),
    trn: sanitizeText(body.trn, 'N/A'),
    vatPeriod: sanitizeText(body.vatPeriod, 'N/A'),
    preparedBy: sanitizeText(body.preparedBy, 'N/A'),
    preparedDate: sanitizeText(body.preparedDate, new Date().toISOString().slice(0, 10)),
    vatMode: sanitizeText(body.vatMode, 'VAT Exclusive'),
    businessLocationEmirate: sanitizeText(body.businessLocationEmirate, 'N/A'),
    summary: {
      taxableSales: sanitizeNumber(summary.taxableSales), outputVat: sanitizeNumber(summary.outputVat), recoverableVat: sanitizeNumber(summary.recoverableVat),
      zeroRated: sanitizeNumber(summary.zeroRated), exempt: sanitizeNumber(summary.exempt), netVat: sanitizeNumber(summary.netVat)
    },
    boxes: Array.isArray(body.boxes) ? body.boxes : [],
    monthly: Array.isArray(body.monthly) ? body.monthly : []
  };
}

export async function generateVatPdf(payload, out) {
  const doc = new PDFDocument({ size: 'A4', margin: 48, bufferPages: true });
  doc.pipe(out);
  const logo = await getFtaLogoImage();
  if (logo?.buffer) doc.image(logo.buffer, 48, 40, { fit: [130, 50] });
  else {
    const logoPath = path.resolve('backend/assets/fta-logo.jpg');
    if (fs.existsSync(logoPath)) doc.image(logoPath, 48, 40, { fit: [130, 50] });
    else doc.fontSize(10).fillColor('#374151').text('UAE Federal Tax Authority', 48, 48);
  }

  doc.fontSize(20).fillColor('#0f172a').text('UAE VAT201 Return Summary', 48, 100);
  doc.fontSize(10).fillColor('#475569').text('Prepared from UAE VAT Return Calculator Pro', 48, 124);
  doc.fontSize(10).fillColor('#111827').text(`Business: ${payload.businessName}`, 360, 60, { width: 180 });
  doc.text(`TRN: ${payload.trn}`, 360, 75, { width: 180 });
  doc.text(`VAT Period: ${payload.vatPeriod}`, 360, 90, { width: 180 });
  doc.moveTo(48, 140).lineTo(547, 140).stroke('#d1d5db');

  let y = 155;
  doc.fontSize(12).fillColor('#0f172a').text('Company Information', 48, y); y += 22;
  const rows = [['Company Name', payload.businessName], ['TRN', payload.trn], ['Business Location', payload.businessLocationEmirate], ['VAT Period', payload.vatPeriod], ['Prepared By', payload.preparedBy], ['Prepared Date', payload.preparedDate], ['VAT Mode', payload.vatMode]];
  rows.forEach(([k, v]) => { doc.fontSize(10).fillColor('#475569').text(k, 48, y); doc.fillColor('#111827').text(v, 180, y); y += 16; });

  y += 8;
  const cards = [['Taxable Sales', payload.summary.taxableSales], ['Output VAT', payload.summary.outputVat], ['Recoverable VAT', payload.summary.recoverableVat], ['Zero Rated', payload.summary.zeroRated], ['Exempt', payload.summary.exempt], ['Net VAT', Math.abs(payload.summary.netVat)]];
  cards.forEach((card, i) => {
    const x = 48 + (i % 3) * 166; const cy = y + Math.floor(i / 3) * 62;
    doc.roundedRect(x, cy, 156, 52, 8).fillAndStroke('#f8fafc', '#dbeafe');
    doc.fillColor('#475569').fontSize(9).text(card[0], x + 10, cy + 10);
    const label = card[0] === 'Net VAT' ? `${payload.summary.netVat >= 0 ? 'Payable' : 'Refundable'} ${formatCurrency(card[1])}` : formatCurrency(card[1]);
    doc.fillColor('#0f172a').fontSize(11).text(label, x + 10, cy + 27, { width: 136 });
  });
  y += 140;

  doc.fontSize(12).fillColor('#0f172a').text('VAT201 Box Summary', 48, y); y += 18;
  const cols = [48, 88, 318, 398, 468];
  doc.rect(48, y, 499, 20).fill('#e2e8f0');
  ['Box', 'Description', 'Amount AED', 'VAT AED', 'Adjustment AED'].forEach((h, i) => doc.fillColor('#0f172a').fontSize(9).text(h, cols[i] + 4, y + 6));
  y += 22;
  const emirateRows = payload.boxes
    .map((row) => [sanitizeText(row.box), sanitizeText(row.description, '-').replace(/\s*-\s*Standard rated supplies/i, ' - Standard rated supplies')])
    .filter(([box]) => /^1[a-g]$/i.test(box));
  const vatRows = [...emirateRows, ...VAT201_NON_EMIRATE_ROWS];

  vatRows.forEach(([box, desc]) => {
    const client = payload.boxes.find((row) => sanitizeText(row.box) === box) || {};
    if (y > 720) { doc.addPage(); y = 48; }
    doc.rect(48, y, 499, 20).stroke('#e5e7eb');
    doc.fillColor('#111827').fontSize(8).text(box, cols[0] + 4, y + 6).text(desc, cols[1] + 4, y + 6, { width: 225 })
      .text(formatCurrency(sanitizeNumber(client.amount)), cols[2] + 4, y + 6)
      .text(formatCurrency(sanitizeNumber(client.vat)), cols[3] + 4, y + 6)
      .text(formatCurrency(sanitizeNumber(client.adjustment)), cols[4] + 4, y + 6);
    y += 20;
  });

  if (y > 620) { doc.addPage(); y = 48; }
  y += 18;
  doc.fontSize(12).fillColor('#0f172a').text('Monthly Input Summary', 48, y); y += 18;
  doc.rect(48, y, 499, 20).fill('#e2e8f0');
  ['Month', 'Sales', 'Purchases', 'Expenses'].forEach((h, i) => doc.fillColor('#0f172a').fontSize(9).text(h, 52 + i * 124, y + 6)); y += 22;
  payload.monthly.forEach((m) => { doc.rect(48, y, 499, 20).stroke('#e5e7eb'); doc.fillColor('#111827').fontSize(9).text(sanitizeText(m.month), 52, y + 6).text(formatCurrency(sanitizeNumber(m.sales)), 176, y + 6).text(formatCurrency(sanitizeNumber(m.purchases)), 300, y + 6).text(formatCurrency(sanitizeNumber(m.expenses)), 424, y + 6); y += 20; });

  y += 20;
  doc.fontSize(12).fillColor('#0f172a').text('Declaration', 48, y); y += 16;
  doc.fontSize(9).fillColor('#111827').text(`Prepared By: ${payload.preparedBy}`, 48, y).text('Signature: ____________________', 280, y);
  y += 16;
  doc.text('Reviewed By: ____________________', 48, y).text('Signature: ____________________', 280, y);
  y += 16;
  doc.text(`Submission Date: ${payload.preparedDate}`, 48, y).text('Date: ____________________', 280, y);

  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) { doc.switchToPage(i); drawFooter(doc); }
  doc.end();
}
