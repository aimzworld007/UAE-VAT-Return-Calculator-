import { Router } from 'express';
import { buildCorporateTaxPdfPayload, generateCorporateTaxPdf } from '../services/corporateTaxPdfService.js';
import { buildVatPdfPayload, generateVatPdf } from '../services/vatPdfService.js';

const router = Router();

router.post('/vat/pdf', (req, res) => {
  try {
    const payload = buildVatPdfPayload(req.body || {});
    const safeBusiness = payload.businessName.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '') || 'business';
    const safePeriod = payload.vatPeriod.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '') || 'period';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeBusiness}-${safePeriod}-vat-report.pdf"`);
    generateVatPdf(payload, res);
  } catch (error) {
    res.status(500).json({ success: false, code: 'VAT_PDF_FAILED', message: 'Failed to generate VAT PDF' });
  }
});

router.post('/corporate-tax/pdf', (req, res) => {
  try {
    const payload = buildCorporateTaxPdfPayload(req.body || {});
    const safeBusiness = payload.companyName.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '') || 'business';
    const safePeriod = payload.taxPeriod.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '') || 'period';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeBusiness}-${safePeriod}-corporate-tax-report.pdf"`);
    generateCorporateTaxPdf(payload, res);
  } catch (error) {
    res.status(500).json({ success: false, code: 'CORPORATE_TAX_PDF_FAILED', message: 'Failed to generate Corporate Tax PDF' });
  }
});

export default router;
