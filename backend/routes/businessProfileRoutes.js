import { Router } from 'express';
import { z } from 'zod';
import { query, withTransaction } from '../db/query.js';
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
  isDefault: z.boolean().optional(),
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
    isDefault: Boolean(row.is_default),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getProfilesByUser(userId) {
  const result = await query(
    `SELECT *
     FROM business_profiles
     WHERE user_id = $1
     ORDER BY is_default DESC, updated_at DESC, created_at DESC`,
    [userId]
  );
  return result.rows;
}

async function getProfileByIdForUser(userId, profileId) {
  const result = await query('SELECT * FROM business_profiles WHERE id = $1 AND user_id = $2 LIMIT 1', [profileId, userId]);
  return result.rows[0] || null;
}

async function setDefaultProfile(client, userId, profileId) {
  await client.query('UPDATE business_profiles SET is_default = FALSE, updated_at = NOW() WHERE user_id = $1 AND is_default = TRUE', [userId]);
  await client.query('UPDATE business_profiles SET is_default = TRUE, updated_at = NOW() WHERE user_id = $1 AND id = $2', [userId, profileId]);
}

function toDateOrNull(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const rows = await getProfilesByUser(req.user.id);
    const defaultRow = rows.find((row) => row.is_default) || rows[0] || null;
    return res.json({
      success: true,
      data: mapProfile(defaultRow),
      profiles: rows.map(mapProfile),
    });
  } catch {
    return res.status(500).json({ success: false, code: 'BUSINESS_PROFILE_FETCH_FAILED', message: 'Unable to load business profile' });
  }
});

router.get('/list', async (req, res) => {
  try {
    const rows = await getProfilesByUser(req.user.id);
    return res.json({ success: true, data: rows.map(mapProfile) });
  } catch {
    return res.status(500).json({ success: false, code: 'BUSINESS_PROFILE_LIST_FAILED', message: 'Unable to load business profiles' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const row = await getProfileByIdForUser(req.user.id, req.params.id);
    if (!row) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Business profile not found' });
    }
    return res.json({ success: true, data: mapProfile(row) });
  } catch {
    return res.status(500).json({ success: false, code: 'BUSINESS_PROFILE_FETCH_FAILED', message: 'Unable to load business profile' });
  }
});

router.post('/', async (req, res) => {
  const parsed = businessProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: 'Invalid business profile payload' });
  }

  try {
    const p = parsed.data;
    const row = await withTransaction(async (client) => {
      const existingCount = await client.query('SELECT COUNT(*)::int AS count FROM business_profiles WHERE user_id = $1', [req.user.id]);
      const shouldBeDefault = p.isDefault === true || Number(existingCount.rows[0]?.count || 0) === 0;

      if (shouldBeDefault) {
        await client.query('UPDATE business_profiles SET is_default = FALSE, updated_at = NOW() WHERE user_id = $1 AND is_default = TRUE', [req.user.id]);
      }

      const inserted = await client.query(
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
          is_default,
          created_at,
          updated_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW(),NOW())
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
          toDateOrNull(p.corporateTaxYearStart),
          toDateOrNull(p.corporateTaxYearEnd),
          p.defaultVatPricingMode ?? null,
          shouldBeDefault,
        ]
      );

      return inserted.rows[0];
    });

    logAudit(req, 'create_business_profile', 'business_profile', { businessProfileId: row.id });
    return res.status(201).json({ success: true, data: mapProfile(row) });
  } catch {
    return res.status(500).json({ success: false, code: 'BUSINESS_PROFILE_CREATE_FAILED', message: 'Unable to create business profile' });
  }
});

router.put('/:id', async (req, res) => {
  const parsed = businessProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: 'Invalid business profile payload' });
  }

  try {
    const p = parsed.data;
    const updatedRow = await withTransaction(async (client) => {
      const existing = await client.query('SELECT id FROM business_profiles WHERE id = $1 AND user_id = $2 LIMIT 1', [req.params.id, req.user.id]);
      if (!existing.rowCount) return null;

      if (p.isDefault === true) {
        await setDefaultProfile(client, req.user.id, req.params.id);
      }

      const updated = await client.query(
        `UPDATE business_profiles
         SET business_name = $1,
             trn = $2,
             address = $3,
             phone = $4,
             email = $5,
             activity = $6,
             emirate = $7,
             vat_filing_frequency = $8,
             corporate_tax_year_start = $9,
             corporate_tax_year_end = $10,
             default_vat_pricing_mode = $11,
             updated_at = NOW()
         WHERE id = $12 AND user_id = $13
         RETURNING *`,
        [
          p.businessName,
          p.trn ?? null,
          p.address ?? null,
          p.phone ?? null,
          p.email ?? null,
          p.activity ?? null,
          p.emirate ?? null,
          p.vatFilingFrequency ?? null,
          toDateOrNull(p.corporateTaxYearStart),
          toDateOrNull(p.corporateTaxYearEnd),
          p.defaultVatPricingMode ?? null,
          req.params.id,
          req.user.id,
        ]
      );

      return updated.rows[0] || null;
    });

    if (!updatedRow) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Business profile not found' });
    }

    logAudit(req, 'update_business_profile', 'business_profile', { businessProfileId: updatedRow.id });
    return res.json({ success: true, data: mapProfile(updatedRow) });
  } catch {
    return res.status(500).json({ success: false, code: 'BUSINESS_PROFILE_UPDATE_FAILED', message: 'Unable to update business profile' });
  }
});

router.patch('/:id/default', async (req, res) => {
  try {
    const updatedDefault = await withTransaction(async (client) => {
      const existing = await client.query('SELECT id FROM business_profiles WHERE id = $1 AND user_id = $2 LIMIT 1', [req.params.id, req.user.id]);
      if (!existing.rowCount) return null;

      await setDefaultProfile(client, req.user.id, req.params.id);
      const refreshed = await client.query('SELECT * FROM business_profiles WHERE id = $1 AND user_id = $2 LIMIT 1', [req.params.id, req.user.id]);
      return refreshed.rows[0] || null;
    });

    if (!updatedDefault) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Business profile not found' });
    }

    logAudit(req, 'set_default_business_profile', 'business_profile', { businessProfileId: updatedDefault.id });
    return res.json({ success: true, data: mapProfile(updatedDefault) });
  } catch {
    return res.status(500).json({ success: false, code: 'BUSINESS_PROFILE_DEFAULT_FAILED', message: 'Unable to set default business profile' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await withTransaction(async (client) => {
      const existing = await client.query('SELECT id, is_default FROM business_profiles WHERE id = $1 AND user_id = $2 LIMIT 1', [req.params.id, req.user.id]);
      if (!existing.rowCount) return { found: false, promoted: null };

      await client.query('DELETE FROM business_profiles WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);

      let promoted = null;
      if (existing.rows[0].is_default) {
        const fallback = await client.query(
          'SELECT id FROM business_profiles WHERE user_id = $1 ORDER BY updated_at DESC, created_at DESC LIMIT 1',
          [req.user.id]
        );
        if (fallback.rowCount) {
          await client.query('UPDATE business_profiles SET is_default = TRUE, updated_at = NOW() WHERE id = $1 AND user_id = $2', [
            fallback.rows[0].id,
            req.user.id,
          ]);
          promoted = fallback.rows[0].id;
        }
      }

      return { found: true, promoted };
    });

    if (!deleted.found) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Business profile not found' });
    }

    logAudit(req, 'delete_business_profile', 'business_profile', { businessProfileId: req.params.id, promotedDefaultId: deleted.promoted });
    return res.json({ success: true, data: { deleted: true } });
  } catch {
    return res.status(500).json({ success: false, code: 'BUSINESS_PROFILE_DELETE_FAILED', message: 'Unable to delete business profile' });
  }
});

router.put('/', async (req, res) => {
  const parsed = businessProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: 'Invalid business profile payload' });
  }

  try {
    const rows = await getProfilesByUser(req.user.id);
    if (!rows.length) {
      const p = parsed.data;
      const inserted = await query(
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
          is_default,
          created_at,
          updated_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,TRUE,NOW(),NOW())
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
          toDateOrNull(p.corporateTaxYearStart),
          toDateOrNull(p.corporateTaxYearEnd),
          p.defaultVatPricingMode ?? null,
        ]
      );

      logAudit(req, 'upsert_business_profile', 'business_profile', { businessProfileId: inserted.rows[0]?.id });
      return res.status(201).json({ success: true, data: mapProfile(inserted.rows[0]) });
    }

    const target = rows.find((row) => row.is_default) || rows[0];
    const p = parsed.data;
    const updated = await query(
      `UPDATE business_profiles
       SET business_name = $1,
           trn = $2,
           address = $3,
           phone = $4,
           email = $5,
           activity = $6,
           emirate = $7,
           vat_filing_frequency = $8,
           corporate_tax_year_start = $9,
           corporate_tax_year_end = $10,
           default_vat_pricing_mode = $11,
           updated_at = NOW()
       WHERE id = $12 AND user_id = $13
       RETURNING *`,
      [
        p.businessName,
        p.trn ?? null,
        p.address ?? null,
        p.phone ?? null,
        p.email ?? null,
        p.activity ?? null,
        p.emirate ?? null,
        p.vatFilingFrequency ?? null,
        toDateOrNull(p.corporateTaxYearStart),
        toDateOrNull(p.corporateTaxYearEnd),
        p.defaultVatPricingMode ?? null,
        target.id,
        req.user.id,
      ]
    );

    logAudit(req, 'upsert_business_profile', 'business_profile', { businessProfileId: updated.rows[0]?.id });
    return res.json({ success: true, data: mapProfile(updated.rows[0]) });
  } catch {
    return res.status(500).json({ success: false, code: 'BUSINESS_PROFILE_UPSERT_FAILED', message: 'Unable to save business profile' });
  }
});

export default router;
