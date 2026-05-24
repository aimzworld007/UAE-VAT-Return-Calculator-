import { Router } from 'express';
import { buildCorporateTaxPdfPayload, generateCorporateTaxPdf } from '../services/corporateTaxPdfService.js';
import { getFtaLogoImage } from '../services/ftaLogoService.js';
import { buildVatPdfPayload, generateVatPdf } from '../services/vatPdfService.js';

const router = Router();

router.get('/assets/fta-logo', async (_req, res) => {
  try {
    const logo = await getFtaLogoImage();
    if (!logo?.buffer) {
      return res.status(404).json({ success: false, code: 'FTA_LOGO_NOT_FOUND', message: 'FTA logo not available' });
    }
    res.setHeader('Content-Type', logo.contentType || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(logo.buffer);
  } catch {
    return res.status(500).json({ success: false, code: 'FTA_LOGO_FAILED', message: 'Failed to load FTA logo' });
  }
});

router.post('/vat/pdf', async (req, res) => {
  try {
    const payload = buildVatPdfPayload(req.body || {});
    const safeBusiness = payload.businessName.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '') || 'business';
    const safePeriod = payload.vatPeriod.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '') || 'period';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeBusiness}-${safePeriod}-vat-report.pdf"`);
    await generateVatPdf(payload, res);
  } catch (error) {
    res.status(500).json({ success: false, code: 'VAT_PDF_FAILED', message: 'Failed to generate VAT PDF' });
  }
});

router.post('/corporate-tax/pdf', async (req, res) => {
  try {
    const payload = buildCorporateTaxPdfPayload(req.body || {});
    const safeBusiness = payload.companyName.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '') || 'business';
    const safePeriod = payload.taxPeriod.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '') || 'period';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeBusiness}-${safePeriod}-corporate-tax-report.pdf"`);
    await generateCorporateTaxPdf(payload, res);
  } catch (error) {
    res.status(500).json({ success: false, code: 'CORPORATE_TAX_PDF_FAILED', message: 'Failed to generate Corporate Tax PDF' });
  }
});

export default router;
