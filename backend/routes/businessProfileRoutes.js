import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/query.js';
import { requireAuth } from '../middleware/auth.js';
import { logAudit } from '../services/auditService.js';

const router = Router();

const businessProfileSchema = z.object({
  businessName: z.string().trim().min(2).max(180),
  trn: z
    .string()
    .trim()
    .regex(/^[0-9]{5,20}$/)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  address: z.string().trim().max(500).optional().nullable(),
  phone: z.string().trim().max(50).optional().nullable(),
  email: z.string().trim().email().optional().nullable(),
  activity: z.string().trim().max(200).optional().nullable(),
  emirate: z.string().trim().max(100).optional().nullable(),
  vatFilingFrequency: z.string().trim().max(50).optional().nullable(),
  corporateTaxYearStart: z.string().trim().optional().nullable(),
  corporateTaxYearEnd: z.string().trim().optional().nullable(),
  defaultVatPricingMode: z.string().trim().max(50).optional().nullable(),
});

function mapProfile(row) {
  if (!row) return null;

  return {
    id: row.id,
    userId: row.user_id,
    businessName: row.business_name,
    trn: row.trn,
    address: row.address,
    phone: row.phone,
    email: row.email,
    activity: row.activity,
    emirate: row.emirate,
    vatFilingFrequency: row.vat_filing_frequency,
    corporateTaxYearStart: row.corporate_tax_year_start,
    corporateTaxYearEnd: row.corporate_tax_year_end,
    defaultVatPricingMode: row.default_vat_pricing_mode,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

router.get('/', requireAuth, async (req, res) => {
  const result = await query('SELECT * FROM business_profiles WHERE user_id = $1 LIMIT 1', [req.user.id]);
  return res.json({ success: true, data: mapProfile(result.rows[0] || null) });
});

async function upsertBusinessProfile(req, res) {
  const parsed = businessProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: 'Invalid business profile payload' });
  }

  const p = parsed.data;

  const result = await query(
    `INSERT INTO business_profiles (
      user_id,
      business_name,
      trn,
      address,
      phone,
      email,
      activity,
      emirate,
      vat_filing_frequency,
      corporate_tax_year_start,
      corporate_tax_year_end,
      default_vat_pricing_mode,
      created_at,
      updated_at
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET
      business_name = EXCLUDED.business_name,
      trn = EXCLUDED.trn,
      address = EXCLUDED.address,
      phone = EXCLUDED.phone,
      email = EXCLUDED.email,
      activity = EXCLUDED.activity,
      emirate = EXCLUDED.emirate,
      vat_filing_frequency = EXCLUDED.vat_filing_frequency,
      corporate_tax_year_start = EXCLUDED.corporate_tax_year_start,
      corporate_tax_year_end = EXCLUDED.corporate_tax_year_end,
      default_vat_pricing_mode = EXCLUDED.default_vat_pricing_mode,
      updated_at = NOW()
    RETURNING *`,
    [
      req.user.id,
      p.businessName,
      p.trn ?? null,
      p.address ?? null,
      p.phone ?? null,
      p.email ?? null,
      p.activity ?? null,
      p.emirate ?? null,
      p.vatFilingFrequency ?? null,
      p.corporateTaxYearStart ? new Date(p.corporateTaxYearStart) : null,
      p.corporateTaxYearEnd ? new Date(p.corporateTaxYearEnd) : null,
      p.defaultVatPricingMode ?? null,
    ]
  );

  logAudit(req, 'upsert_business_profile', 'business_profile', { businessProfileId: result.rows[0].id });
  return res.json({ success: true, data: mapProfile(result.rows[0]) });
}

router.put('/', requireAuth, upsertBusinessProfile);
router.post('/', requireAuth, upsertBusinessProfile);

export default router;
