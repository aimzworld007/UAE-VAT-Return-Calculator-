import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/query.js';
import { requireAuth } from '../middleware/auth.js';
import { logAudit } from '../services/auditService.js';

const router = Router();

const recordSchema = z.object({
  businessProfileId: z.string().uuid().optional().nullable(),
  periodStart: z.string().trim().optional().nullable(),
  periodEnd: z.string().trim().optional().nullable(),
  revenue: z.coerce.number().optional(),
  expenses: z.coerce.number().optional(),
  taxableProfit: z.coerce.number().optional(),
  taxAmount: z.coerce.number().optional(),
  status: z.string().trim().max(50).optional(),
  payload: z.record(z.any()).optional().default({}),
});

function toNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function toDateOrNull(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function mapRecord(row) {
  return {
    id: row.id,
    userId: row.user_id,
    businessProfileId: row.business_profile_id,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    period_label: row.period_label || null,
    revenue: Number(row.revenue || 0),
    expenses: Number(row.expenses || 0),
    taxableProfit: Number(row.taxable_profit || 0),
    taxAmount: Number(row.tax_amount || 0),
    sales_total: Number(row.sales_total || row.revenue || 0),
    expenses_total: Number(row.expenses_total || row.expenses || 0),
    taxable_amount: Number(row.taxable_amount || row.taxable_profit || 0),
    corporate_tax_estimate: Number(row.corporate_tax_estimate || row.tax_amount || 0),
    status: row.status,
    payload: row.payload || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function validateBusinessProfileAccess(req, businessProfileId) {
  if (!businessProfileId) return true;
  if (req.user.role === 'superadmin') return true;

  const result = await query('SELECT id FROM business_profiles WHERE id = $1 AND user_id = $2 LIMIT 1', [businessProfileId, req.user.id]);
  return Boolean(result.rowCount);
}

router.use(requireAuth);

router.get('/', async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.max(1, Math.min(100, Number(req.query.limit || 20)));
  const offset = (page - 1) * limit;

  const search = String(req.query.search || '').trim();
  const status = String(req.query.status || '').trim();
  const startDate = String(req.query.startDate || '').trim();
  const endDate = String(req.query.endDate || '').trim();

  const params = [];
  let whereParts = [];

  if (req.user.role !== 'superadmin') {
    params.push(req.user.id);
    whereParts.push(`user_id = $${params.length}`);
  }

  if (search) {
    params.push(`%${search}%`);
    whereParts.push(`CAST(id AS TEXT) ILIKE $${params.length}`);
  }

  if (status) {
    params.push(status);
    whereParts.push(`status = $${params.length}`);
  }

  if (startDate) {
    params.push(startDate);
    whereParts.push(`COALESCE(period_start, created_at::date) >= $${params.length}`);
  }

  if (endDate) {
    params.push(endDate);
    whereParts.push(`COALESCE(period_end, created_at::date) <= $${params.length}`);
  }

  const whereSql = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';
  const countResult = await query(`SELECT COUNT(*)::int AS count FROM corporate_tax_records ${whereSql}`, params);

  params.push(limit, offset);
  const listResult = await query(
    `SELECT *
     FROM corporate_tax_records
     ${whereSql}
     ORDER BY created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return res.json({
    success: true,
    data: listResult.rows.map(mapRecord),
    meta: {
      page,
      limit,
      total: countResult.rows[0]?.count || 0,
    },
  });
});

router.get('/:id', async (req, res) => {
  const params = [req.params.id];
  let sql = 'SELECT * FROM corporate_tax_records WHERE id = $1';

  if (req.user.role !== 'superadmin') {
    params.push(req.user.id);
    sql += ' AND user_id = $2';
  }

  const result = await query(sql, params);
  if (!result.rowCount) {
    return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Corporate tax record not found' });
  }

  return res.json({ success: true, data: mapRecord(result.rows[0]) });
});

router.post('/', async (req, res) => {
  const parsed = recordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: 'Invalid corporate tax payload' });
  }

  const p = parsed.data;
  if (p.businessProfileId) {
    const hasAccess = await validateBusinessProfileAccess(req, p.businessProfileId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Invalid business profile access' });
    }
  }
  const payload = p.payload || req.body || {};
  const taxAmount = typeof p.taxAmount === 'number' ? p.taxAmount : toNumber(payload?.result?.taxPayable ?? payload?.taxPayable);

  const result = await query(
    `INSERT INTO corporate_tax_records (
      user_id, business_profile_id, period_start, period_end, revenue, expenses,
      taxable_profit, tax_amount, status, payload, created_at, updated_at,
      filing_period_start, filing_period_end, sales_total, expenses_total, taxable_amount, corporate_tax_estimate
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW(),
      $3,$4,$5,$6,$7,$8
    ) RETURNING *`,
    [
      req.user.id,
      p.businessProfileId ?? null,
      toDateOrNull(p.periodStart),
      toDateOrNull(p.periodEnd),
      toNumber(p.revenue),
      toNumber(p.expenses),
      toNumber(p.taxableProfit),
      toNumber(taxAmount),
      p.status || 'draft',
      payload,
    ]
  );

  logAudit(req, 'create_corporate_tax_record', 'corporate_tax_records', { recordId: result.rows[0].id });
  return res.status(201).json({ success: true, data: mapRecord(result.rows[0]) });
});

router.put('/:id', async (req, res) => {
  const parsed = recordSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: 'Invalid corporate tax update payload' });
  }

  const existing = await query('SELECT * FROM corporate_tax_records WHERE id = $1 LIMIT 1', [req.params.id]);
  if (!existing.rowCount) {
    return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Corporate tax record not found' });
  }

  const row = existing.rows[0];
  if (req.user.role !== 'superadmin' && row.user_id !== req.user.id) {
    return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Forbidden' });
  }

  const p = parsed.data;
  if (p.businessProfileId) {
    const hasAccess = await validateBusinessProfileAccess(req, p.businessProfileId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Invalid business profile access' });
    }
  }
  const payload = typeof p.payload !== 'undefined' ? p.payload : row.payload || {};
  const resolvedTaxAmount = typeof p.taxAmount === 'number'
    ? p.taxAmount
    : Number.isFinite(Number(payload?.result?.taxPayable ?? payload?.taxPayable))
      ? Number(payload.result?.taxPayable ?? payload?.taxPayable)
      : Number(row.tax_amount || 0);

  const result = await query(
    `UPDATE corporate_tax_records
     SET business_profile_id = COALESCE($1, business_profile_id),
         period_start = COALESCE($2, period_start),
         period_end = COALESCE($3, period_end),
         revenue = COALESCE($4, revenue),
         expenses = COALESCE($5, expenses),
         taxable_profit = COALESCE($6, taxable_profit),
         tax_amount = COALESCE($7, tax_amount),
         status = COALESCE($8, status),
         payload = COALESCE($9, payload),
         filing_period_start = COALESCE($2, filing_period_start),
         filing_period_end = COALESCE($3, filing_period_end),
         sales_total = COALESCE($4, sales_total),
         expenses_total = COALESCE($5, expenses_total),
         taxable_amount = COALESCE($6, taxable_amount),
         corporate_tax_estimate = COALESCE($7, corporate_tax_estimate),
         updated_at = NOW()
     WHERE id = $10
     RETURNING *`,
    [
      p.businessProfileId ?? null,
      p.periodStart ? toDateOrNull(p.periodStart) : null,
      p.periodEnd ? toDateOrNull(p.periodEnd) : null,
      typeof p.revenue === 'number' ? p.revenue : null,
      typeof p.expenses === 'number' ? p.expenses : null,
      typeof p.taxableProfit === 'number' ? p.taxableProfit : null,
      Number.isFinite(resolvedTaxAmount) ? resolvedTaxAmount : null,
      p.status ?? null,
      payload,
      req.params.id,
    ]
  );

  logAudit(req, 'update_corporate_tax_record', 'corporate_tax_records', { recordId: req.params.id });
  return res.json({ success: true, data: mapRecord(result.rows[0]) });
});

router.post('/:id/duplicate', async (req, res) => {
  const existing = await query('SELECT * FROM corporate_tax_records WHERE id = $1 LIMIT 1', [req.params.id]);
  if (!existing.rowCount) {
    return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Corporate tax record not found' });
  }

  const row = existing.rows[0];
  if (req.user.role !== 'superadmin' && row.user_id !== req.user.id) {
    return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Forbidden' });
  }

  const result = await query(
    `INSERT INTO corporate_tax_records (
      user_id, business_profile_id, period_start, period_end, revenue, expenses,
      taxable_profit, tax_amount, status, payload,
      filing_period_start, filing_period_end, sales_total, expenses_total,
      taxable_amount, corporate_tax_estimate, created_at, updated_at
    )
    SELECT
      user_id, business_profile_id, period_start, period_end, revenue, expenses,
      taxable_profit, tax_amount, status, payload,
      filing_period_start, filing_period_end, sales_total, expenses_total,
      taxable_amount, corporate_tax_estimate, NOW(), NOW()
    FROM corporate_tax_records
    WHERE id = $1
    RETURNING *`,
    [req.params.id]
  );

  logAudit(req, 'duplicate_corporate_tax_record', 'corporate_tax_records', { sourceRecordId: req.params.id, recordId: result.rows[0].id });
  return res.status(201).json({ success: true, data: mapRecord(result.rows[0]) });
});

router.delete('/:id', async (req, res) => {
  const existing = await query('SELECT id, user_id FROM corporate_tax_records WHERE id = $1 LIMIT 1', [req.params.id]);
  if (!existing.rowCount) {
    return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Corporate tax record not found' });
  }

  if (req.user.role !== 'superadmin' && existing.rows[0].user_id !== req.user.id) {
    return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Forbidden' });
  }

  await query('DELETE FROM corporate_tax_records WHERE id = $1', [req.params.id]);
  logAudit(req, 'delete_corporate_tax_record', 'corporate_tax_records', { recordId: req.params.id });

  return res.json({ success: true, data: { deleted: true } });
});

export default router;
