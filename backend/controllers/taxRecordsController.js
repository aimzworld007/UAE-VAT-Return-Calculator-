import { z } from 'zod';
import { query } from '../db/query.js';

const createRecordSchema = z.object({
  taxType: z.enum(['VAT', 'CORPORATE']),
  businessProfileId: z.string().uuid().optional().nullable(),
  periodType: z.string().optional().nullable(),
  status: z.enum(['draft', 'final']).optional().default('draft'),
  periodStart: z.string().datetime().optional().nullable(),
  periodEnd: z.string().datetime().optional().nullable(),
  inputPayload: z.record(z.any()),
  resultPayload: z.record(z.any()),
});

const updateRecordSchema = z.object({
  businessProfileId: z.string().uuid().optional().nullable(),
  periodType: z.string().optional().nullable(),
  status: z.enum(['draft', 'final']).optional(),
  periodStart: z.string().datetime().optional().nullable(),
  periodEnd: z.string().datetime().optional().nullable(),
  inputPayload: z.record(z.any()).optional(),
  resultPayload: z.record(z.any()).optional(),
});

function toNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function sumMonthly(payload, key) {
  const entries = Array.isArray(payload?.monthlyEntries) ? payload.monthlyEntries : Array.isArray(payload?.monthly) ? payload.monthly : [];
  return entries.reduce((sum, row) => sum + toNumber(row?.[key]), 0);
}

export async function createTaxRecord(req, res) {
  const parsed = createRecordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: 'Invalid payload' });

  const { taxType, businessProfileId, periodType, status, periodStart, periodEnd, inputPayload, resultPayload } = parsed.data;

  if (businessProfileId) {
    const profileAccess = await query('SELECT id FROM business_profiles WHERE id = $1 AND user_id = $2 LIMIT 1', [businessProfileId, req.user.id]);
    if (!profileAccess.rowCount) {
      return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Invalid business profile access' });
    }
  }

  const created = await query(
    `INSERT INTO tax_records (user_id,tax_type,filing_period_start,filing_period_end,input_payload,result_payload)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.user.id, taxType, periodStart ? new Date(periodStart) : null, periodEnd ? new Date(periodEnd) : null, inputPayload, resultPayload]
  );

  if (taxType === 'VAT') {
    const salesTotal = toNumber(
      resultPayload?.totalSales ??
        resultPayload?.salesBreakdown?.total ??
        resultPayload?.salesBreakdown?.net ??
        inputPayload?.standardRatedSales ??
        sumMonthly(inputPayload, 'sales')
    );
    const purchasesTotal = toNumber(
      resultPayload?.totalPurchases ??
        inputPayload?.standardRatedPurchases ??
        sumMonthly(inputPayload, 'purchases')
    );
    const expensesTotal = toNumber(
      resultPayload?.totalExpenses ??
        resultPayload?.expenses ??
        inputPayload?.directExpenses ??
        sumMonthly(inputPayload, 'expenses')
    );
    const taxableSales = toNumber(resultPayload?.salesBreakdown?.net ?? salesTotal);
    const taxablePurchases = toNumber(resultPayload?.taxableInputTotal ?? purchasesTotal);
    const netVat = toNumber(resultPayload?.netVat ?? inputPayload?.netVat);
    const payableVat = netVat > 0 ? netVat : 0;
    const refundableVat = netVat < 0 ? Math.abs(netVat) : 0;
    await query(
      `INSERT INTO vat_records (
        user_id, business_profile_id, period_type, period_label, period_start, period_end,
        filing_period_start, filing_period_end, taxable_sales, output_vat, taxable_purchases, input_vat,
        expenses, adjustment_vat, payable_vat, refundable_vat, vat_payable, vat_refundable, status,
        sales_total, purchase_total, expenses_total, taxable_amount, payload, updated_at
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,
        $5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$13,$14,$15,
        $17,$18,$19,$7,$16,NOW()
      )`,
      [
        req.user.id,
        businessProfileId ?? null,
        periodType ?? null,
        inputPayload?.periodLabel || periodType || null,
        periodStart ? new Date(periodStart) : null,
        periodEnd ? new Date(periodEnd) : null,
        taxableSales,
        toNumber(resultPayload?.outputVat),
        taxablePurchases,
        toNumber(resultPayload?.inputVat ?? inputPayload?.recoverableInputVat),
        expensesTotal,
        toNumber(resultPayload?.adjustments ?? inputPayload?.previousAdjustment),
        payableVat,
        refundableVat,
        status,
        inputPayload,
        salesTotal,
        purchasesTotal,
        expensesTotal,
      ]
    );
  } else {
    const totalRevenue = toNumber(resultPayload?.totalRevenue ?? inputPayload?.revenue);
    const totalExpenses = toNumber(resultPayload?.totalExpenses ?? inputPayload?.directExpenses);
    const taxableIncome = toNumber(resultPayload?.taxableIncome ?? inputPayload?.accountingProfit);
    const taxPayable = toNumber(resultPayload?.taxPayable ?? inputPayload?.taxPayable);
    await query(
      `INSERT INTO corporate_tax_records (
        user_id, business_profile_id, period_label, period_start, period_end,
        filing_period_start, filing_period_end, revenue, expenses, taxable_profit, tax_amount,
        sales_total, expenses_total, taxable_amount, corporate_tax_estimate, status, payload, updated_at
      )
      VALUES (
        $1,$2,$3,$4,$5,
        $4,$5,$6,$7,$8,$9,
        $6,$7,$8,$9,$10,$11,NOW()
      )`,
      [
        req.user.id,
        businessProfileId ?? null,
        inputPayload?.periodLabel || null,
        periodStart ? new Date(periodStart) : null,
        periodEnd ? new Date(periodEnd) : null,
        totalRevenue,
        totalExpenses,
        taxableIncome,
        taxPayable,
        status,
        inputPayload,
      ]
    );
  }

  return res.status(201).json({ success: true, data: { record: created.rows[0] } });
}

export async function listTaxRecords(req, res) {
  const rows = await query('SELECT * FROM tax_records WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
  return res.json({ success: true, data: { records: rows.rows } });
}

export async function getTaxRecord(req, res) {
  const rows = await query('SELECT * FROM tax_records WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  const record = rows.rows[0];
  if (!record) return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Record not found' });
  return res.json({ success: true, data: { record } });
}

export async function updateTaxRecord(req, res) {
  const parsed = updateRecordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: 'Invalid payload' });

  const existingRows = await query('SELECT id FROM tax_records WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  if (!existingRows.rows[0]) return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Record not found' });

  const { businessProfileId, status, periodStart, periodEnd, inputPayload, resultPayload } = parsed.data;

  if (businessProfileId) {
    const profileAccess = await query('SELECT id FROM business_profiles WHERE id = $1 AND user_id = $2 LIMIT 1', [businessProfileId, req.user.id]);
    if (!profileAccess.rowCount) {
      return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Invalid business profile access' });
    }
  }

  const updated = await query(
    `UPDATE tax_records
     SET filing_period_start = COALESCE($1, filing_period_start),
         filing_period_end = COALESCE($2, filing_period_end),
         input_payload = COALESCE($3, input_payload),
         result_payload = COALESCE($4, result_payload),
         updated_at = NOW()
     WHERE id = $5 AND user_id = $6
     RETURNING *`,
    [periodStart ? new Date(periodStart) : null, periodEnd ? new Date(periodEnd) : null, inputPayload ?? null, resultPayload ?? null, req.params.id, req.user.id]
  );

  return res.json({ success: true, data: { record: updated.rows[0] } });
}

export async function deleteTaxRecord(req, res) {
  const deleted = await query('DELETE FROM tax_records WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.user.id]);
  if (!deleted.rows[0]) return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Record not found' });
  return res.json({ success: true, data: { id: deleted.rows[0].id } });
}
