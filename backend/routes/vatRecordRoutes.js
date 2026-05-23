import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/query.js';
import { requireAuth } from '../middleware/auth.js';
import { logAudit } from '../services/auditService.js';

const router = Router();

const recordSchema = z.object({
  businessProfileId: z.string().uuid().optional().nullable(),
  periodType: z.string().trim().max(50).optional().nullable(),
  periodStart: z.string().trim().optional().nullable(),
  periodEnd: z.string().trim().optional().nullable(),
  taxableSales: z.coerce.number().optional(),
  outputVat: z.coerce.number().optional(),
  taxablePurchases: z.coerce.number().optional(),
  inputVat: z.coerce.number().optional(),
  expenses: z.coerce.number().optional(),
  adjustmentVat: z.coerce.number().optional(),
  payableVat: z.coerce.number().optional(),
  refundableVat: z.coerce.number().optional(),
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
    periodType: row.period_type,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    period_label: row.period_label || row.period_type || null,
    taxableSales: Number(row.taxable_sales || 0),
    outputVat: Number(row.output_vat || 0),
    taxablePurchases: Number(row.taxable_purchases || 0),
    inputVat: Number(row.input_vat || 0),
    expenses: Number(row.expenses || 0),
    adjustmentVat: Number(row.adjustment_vat || 0),
    payableVat: Number(row.payable_vat || 0),
    refundableVat: Number(row.refundable_vat || 0),
    sales_total: Number(row.sales_total || row.taxable_sales || 0),
    purchase_total: Number(row.purchase_total || row.taxable_purchases || 0),
    expenses_total: Number(row.expenses_total || row.expenses || 0),
    taxable_amount: Number(row.taxable_amount || row.taxable_sales || 0),
    vat_payable: Number(row.vat_payable || row.payable_vat || 0),
    vat_refundable: Number(row.vat_refundable || row.refundable_vat || 0),
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

function accessWhere(req, userIdParamIndex = 1) {
  if (req.user.role === 'superadmin') {
    return { clause: '1=1', params: [] };
  }
  return { clause: `user_id = $${userIdParamIndex}`, params: [req.user.id] };
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
    whereParts.push(`(COALESCE(period_type, '') ILIKE $${params.length} OR CAST(id AS TEXT) ILIKE $${params.length})`);
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

  const countResult = await query(`SELECT COUNT(*)::int AS count FROM vat_records ${whereSql}`, params);
  params.push(limit, offset);

  const listResult = await query(
    `SELECT *
     FROM vat_records
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
  let sql = 'SELECT * FROM vat_records WHERE id = $1';

  if (req.user.role !== 'superadmin') {
    params.push(req.user.id);
    sql += ' AND user_id = $2';
  }

  const result = await query(sql, params);
  if (!result.rowCount) {
    return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'VAT record not found' });
  }

  return res.json({ success: true, data: mapRecord(result.rows[0]) });
});

router.post('/', async (req, res) => {
  const parsed = recordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: 'Invalid VAT record payload' });
  }

  const p = parsed.data;
  if (p.businessProfileId) {
    const hasAccess = await validateBusinessProfileAccess(req, p.businessProfileId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Invalid business profile access' });
    }
  }
  const netVat = toNumber(req.body?.result?.netVat ?? req.body?.netVat);
  const summaryPayable = typeof p.payableVat === 'number' ? p.payableVat : netVat > 0 ? netVat : 0;
  const summaryRefundable = typeof p.refundableVat === 'number' ? p.refundableVat : netVat < 0 ? Math.abs(netVat) : 0;

  const result = await query(
    `INSERT INTO vat_records (
      user_id, business_profile_id, period_type, period_start, period_end,
      taxable_sales, output_vat, taxable_purchases, input_vat, expenses,
      adjustment_vat, payable_vat, refundable_vat, status, payload, created_at, updated_at,
      filing_period_start, filing_period_end, vat_payable, vat_refundable, sales_total, purchase_total, expenses_total, taxable_amount
    ) VALUES (
      $1,$2,$3,$4,$5,
      $6,$7,$8,$9,$10,
      $11,$12,$13,$14,$15,NOW(),NOW(),
      $4,$5,$12,$13,$6,$8,$10,$6
    ) RETURNING *`,
    [
      req.user.id,
      p.businessProfileId ?? null,
      p.periodType ?? null,
      toDateOrNull(p.periodStart),
      toDateOrNull(p.periodEnd),
      toNumber(p.taxableSales),
      toNumber(p.outputVat),
      toNumber(p.taxablePurchases),
      toNumber(p.inputVat),
      toNumber(p.expenses),
      toNumber(p.adjustmentVat),
      toNumber(summaryPayable),
      toNumber(summaryRefundable),
      p.status || 'draft',
      p.payload || req.body || {},
    ]
  );

  logAudit(req, 'create_vat_record', 'vat_records', { recordId: result.rows[0].id });
  return res.status(201).json({ success: true, data: mapRecord(result.rows[0]) });
});

router.put('/:id', async (req, res) => {
  const parsed = recordSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: 'Invalid VAT update payload' });
  }

  const existing = await query('SELECT * FROM vat_records WHERE id = $1 LIMIT 1', [req.params.id]);
  if (!existing.rowCount) {
    return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'VAT record not found' });
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
  const netVat = toNumber(payload?.result?.netVat ?? payload?.netVat);

  const payableVat = typeof p.payableVat === 'number' ? p.payableVat : netVat > 0 ? netVat : Number(row.payable_vat || 0);
  const refundableVat = typeof p.refundableVat === 'number' ? p.refundableVat : netVat < 0 ? Math.abs(netVat) : Number(row.refundable_vat || 0);

  const result = await query(
    `UPDATE vat_records
     SET business_profile_id = COALESCE($1, business_profile_id),
         period_type = COALESCE($2, period_type),
         period_start = COALESCE($3, period_start),
         period_end = COALESCE($4, period_end),
         taxable_sales = COALESCE($5, taxable_sales),
         output_vat = COALESCE($6, output_vat),
         taxable_purchases = COALESCE($7, taxable_purchases),
         input_vat = COALESCE($8, input_vat),
         expenses = COALESCE($9, expenses),
         adjustment_vat = COALESCE($10, adjustment_vat),
         payable_vat = COALESCE($11, payable_vat),
         refundable_vat = COALESCE($12, refundable_vat),
         status = COALESCE($13, status),
         payload = COALESCE($14, payload),
         filing_period_start = COALESCE($3, filing_period_start),
         filing_period_end = COALESCE($4, filing_period_end),
         vat_payable = COALESCE($11, vat_payable),
         vat_refundable = COALESCE($12, vat_refundable),
         sales_total = COALESCE($5, sales_total),
         purchase_total = COALESCE($7, purchase_total),
         expenses_total = COALESCE($9, expenses_total),
         taxable_amount = COALESCE($5, taxable_amount),
         updated_at = NOW()
     WHERE id = $15
     RETURNING *`,
    [
      p.businessProfileId ?? null,
      p.periodType ?? null,
      p.periodStart ? toDateOrNull(p.periodStart) : null,
      p.periodEnd ? toDateOrNull(p.periodEnd) : null,
      typeof p.taxableSales === 'number' ? p.taxableSales : null,
      typeof p.outputVat === 'number' ? p.outputVat : null,
      typeof p.taxablePurchases === 'number' ? p.taxablePurchases : null,
      typeof p.inputVat === 'number' ? p.inputVat : null,
      typeof p.expenses === 'number' ? p.expenses : null,
      typeof p.adjustmentVat === 'number' ? p.adjustmentVat : null,
      Number.isFinite(payableVat) ? payableVat : null,
      Number.isFinite(refundableVat) ? refundableVat : null,
      p.status ?? null,
      payload,
      req.params.id,
    ]
  );

  logAudit(req, 'update_vat_record', 'vat_records', { recordId: req.params.id });
  return res.json({ success: true, data: mapRecord(result.rows[0]) });
});

router.post('/:id/duplicate', async (req, res) => {
  const existing = await query('SELECT * FROM vat_records WHERE id = $1 LIMIT 1', [req.params.id]);
  if (!existing.rowCount) {
    return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'VAT record not found' });
  }

  const row = existing.rows[0];
  if (req.user.role !== 'superadmin' && row.user_id !== req.user.id) {
    return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Forbidden' });
  }

  const result = await query(
    `INSERT INTO vat_records (
      user_id, business_profile_id, period_type, period_start, period_end,
      taxable_sales, output_vat, taxable_purchases, input_vat, expenses,
      adjustment_vat, payable_vat, refundable_vat, status, payload,
      filing_period_start, filing_period_end, vat_payable, vat_refundable,
      sales_total, purchase_total, expenses_total, taxable_amount,
      created_at, updated_at
    )
    SELECT
      user_id, business_profile_id, period_type, period_start, period_end,
      taxable_sales, output_vat, taxable_purchases, input_vat, expenses,
      adjustment_vat, payable_vat, refundable_vat, status, payload,
      filing_period_start, filing_period_end, vat_payable, vat_refundable,
      sales_total, purchase_total, expenses_total, taxable_amount,
      NOW(), NOW()
    FROM vat_records
    WHERE id = $1
    RETURNING *`,
    [req.params.id]
  );

  logAudit(req, 'duplicate_vat_record', 'vat_records', { sourceRecordId: req.params.id, recordId: result.rows[0].id });
  return res.status(201).json({ success: true, data: mapRecord(result.rows[0]) });
});

router.delete('/:id', async (req, res) => {
  const existing = await query('SELECT id, user_id FROM vat_records WHERE id = $1 LIMIT 1', [req.params.id]);
  if (!existing.rowCount) {
    return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'VAT record not found' });
  }

  if (req.user.role !== 'superadmin' && existing.rows[0].user_id !== req.user.id) {
    return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Forbidden' });
  }

  await query('DELETE FROM vat_records WHERE id = $1', [req.params.id]);
  logAudit(req, 'delete_vat_record', 'vat_records', { recordId: req.params.id });

  return res.json({ success: true, data: { deleted: true } });
});

export default router;
