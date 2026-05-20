import { query } from '../db/query.js';
import { ok, fail } from '../middleware/apiResponse.js';

const parseId = (req) => req.params.id;
const toNumber = (v) => Number(v) || 0;
const getYearRange = (year) => ({ start: `${year}-01-01`, end: `${year}-12-31` });

const buildSummary = (payload = {}, taxType = 'VAT') => {
  const entries = Array.isArray(payload?.monthlyEntries) ? payload.monthlyEntries : [];
  const salesFromEntries = entries.reduce((sum, row) => sum + toNumber(row?.sales), 0);
  const purchasesFromEntries = entries.reduce((sum, row) => sum + toNumber(row?.purchases), 0);
  const expensesFromEntries = entries.reduce((sum, row) => sum + toNumber(row?.expenses), 0);

  const sales = toNumber(payload?.standardRatedSales) || salesFromEntries || toNumber(payload?.revenue);
  const purchases = toNumber(payload?.standardRatedPurchases) || purchasesFromEntries;
  const expenses = toNumber(payload?.directExpenses) + toNumber(payload?.adminExpenses) || expensesFromEntries;
  const taxable = taxType === 'VAT' ? Math.max(0, sales - purchases - expenses) : toNumber(payload?.accountingProfit) || Math.max(0, toNumber(payload?.revenue) + toNumber(payload?.otherIncome) - expenses);

  return { sales, purchases, expenses, taxable };
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalize = (value) => {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text ? text : null;
};

const normalizeBusinessProfilePayload = (body = {}) => {
  const businessName = normalize(body.businessName ?? body.business_name);
  const trn = normalize(body.trn ?? body.TRN);
  const emirate = normalize(body.emirate);
  const address = normalize(body.address);
  const phone = normalize(body.phone);
  const email = normalize(body.email);
  const vatFilingFrequency = normalize(body.vatFilingFrequency ?? body.vat_filing_frequency);
  const corporateTaxYearStart = normalize(body.corporateTaxYearStart ?? body.corporate_tax_year_start);
  const corporateTaxYearEnd = normalize(body.corporateTaxYearEnd ?? body.corporate_tax_year_end);
  const defaultVatPricingMode = normalize(body.defaultVatPricingMode ?? body.default_vat_pricing_mode);

  if (!businessName) return { error: 'Business name is required.' };
  if (trn && !/^\d+$/.test(trn)) return { error: 'TRN must contain only numbers.' };
  if (email && !EMAIL_RE.test(email)) return { error: 'Email is invalid.' };

  return {
    value: {
      businessName,
      trn,
      emirate,
      address,
      phone,
      email,
      vatFilingFrequency,
      corporateTaxYearStart,
      corporateTaxYearEnd,
      defaultVatPricingMode,
      taxSettings: body.taxSettings || null,
    },
  };
};

const mapBusinessProfileRow = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    businessName: row.business_name,
    trn: row.trn,
    emirate: row.emirate,
    address: row.address,
    phone: row.phone,
    email: row.email,
    vatFilingFrequency: row.vat_filing_frequency,
    corporateTaxYearStart: row.corporate_tax_year_start,
    corporateTaxYearEnd: row.corporate_tax_year_end,
    defaultVatPricingMode: row.default_vat_pricing_mode,
    taxSettings: row.tax_settings,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const analysisText = (record, type) => {
  const vatNet = toNumber(record.vat_payable) - toNumber(record.vat_refundable);
  if (type === 'VAT') {
    return `This VAT filing reflects AED ${toNumber(record.sales_total).toFixed(2)} in sales, AED ${toNumber(record.purchase_total).toFixed(2)} in purchases, and AED ${toNumber(record.expenses_total).toFixed(2)} in expenses. The calculated VAT position is ${vatNet >= 0 ? 'payable' : 'refundable'} at AED ${Math.abs(vatNet).toFixed(2)}. For compliance quality, verify invoice matching, input VAT eligibility, and period-level adjustments before final FTA submission.`;
  }
  return `This corporate tax estimate reflects AED ${toNumber(record.sales_total).toFixed(2)} in revenue, AED ${toNumber(record.expenses_total).toFixed(2)} in deductible operating expenses, and an estimated taxable amount of AED ${toNumber(record.taxable_amount).toFixed(2)}. The projected corporate tax is AED ${toNumber(record.corporate_tax_estimate).toFixed(2)}. For robust filing readiness, review add-back adjustments, exempt income treatment, and year-end reconciliations before declaration.`;
};

export const getMe = async (req, res) => {
  const r = await query('SELECT id, full_name, email, role, is_active, created_at FROM users WHERE id=$1', [req.user.id]);
  return ok(res, r.rows[0] || null);
};

export const upsertBusiness = async (req, res) => {
  const normalized = normalizeBusinessProfilePayload(req.body || {});
  if (normalized.error) return fail(res, 400, normalized.error, 'VALIDATION_ERROR');
  const b = normalized.value;

  const r = await query(`INSERT INTO business_profiles (user_id,business_name,trn,emirate,address,phone,email,vat_filing_frequency,corporate_tax_year_start,corporate_tax_year_end,default_vat_pricing_mode,tax_settings,updated_at)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
ON CONFLICT (user_id) DO UPDATE SET business_name=EXCLUDED.business_name,trn=EXCLUDED.trn,emirate=EXCLUDED.emirate,address=EXCLUDED.address,phone=EXCLUDED.phone,email=EXCLUDED.email,vat_filing_frequency=EXCLUDED.vat_filing_frequency,corporate_tax_year_start=EXCLUDED.corporate_tax_year_start,corporate_tax_year_end=EXCLUDED.corporate_tax_year_end,default_vat_pricing_mode=EXCLUDED.default_vat_pricing_mode,tax_settings=EXCLUDED.tax_settings,updated_at=NOW()
RETURNING *`, [req.user.id, b.businessName, b.trn, b.emirate, b.address, b.phone, b.email, b.vatFilingFrequency, b.corporateTaxYearStart, b.corporateTaxYearEnd, b.defaultVatPricingMode, b.taxSettings]);
  return ok(res, mapBusinessProfileRow(r.rows[0]));
};

export const getBusiness = async (req,res)=>ok(res, mapBusinessProfileRow((await query('SELECT * FROM business_profiles WHERE user_id=$1 LIMIT 1',[req.user.id])).rows[0] || null));

// ... rest unchanged
const listByType = async (req, res, table, type) => {
  const { q = '', year, startDate, endDate } = req.query || {};
  const params = [req.user.id, `%${String(q).trim()}%`];
  let where = 'WHERE user_id=$1 AND (COALESCE(period_label,\'\') ILIKE $2 OR CAST(id AS TEXT) ILIKE $2)';
  if (year) {
    const { start, end } = getYearRange(year);
    params.push(start, end);
    where += ` AND COALESCE(filing_period_start, created_at::date) BETWEEN $${params.length - 1} AND $${params.length}`;
  }
  if (startDate) { params.push(startDate); where += ` AND COALESCE(filing_period_start, created_at::date) >= $${params.length}`; }
  if (endDate) { params.push(endDate); where += ` AND COALESCE(filing_period_end, created_at::date) <= $${params.length}`; }
  const sql = `SELECT *, (vat_payable - vat_refundable) AS vat_net FROM ${table} ${where} ORDER BY updated_at DESC`;
  const rows = (await query(sql, params)).rows.map((r) => ({ ...r, analysis: analysisText(r, type) }));
  return ok(res, rows);
};

export const listVat = async (req,res)=>listByType(req,res,'vat_records','VAT');
export const createVat = async (req,res)=>{ const payload = req.body || {}; const summary = buildSummary(payload, 'VAT'); const r = await query('INSERT INTO vat_records (user_id,payload,period_label,filing_period_start,filing_period_end,sales_total,purchase_total,expenses_total,taxable_amount,vat_payable,vat_refundable,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW(),NOW()) RETURNING *',[req.user.id, payload, payload?.periodLabel || null, payload?.taxPeriodStart || null, payload?.taxPeriodEnd || null, summary.sales, summary.purchases, summary.expenses, summary.taxable, toNumber(payload?.result?.netVat || payload?.netVat) > 0 ? toNumber(payload?.result?.netVat || payload?.netVat) : 0, toNumber(payload?.result?.netVat || payload?.netVat) < 0 ? Math.abs(toNumber(payload?.result?.netVat || payload?.netVat)) : 0]); return ok(res, r.rows[0]);};
export const getVat = async (req,res)=>{const r=await query('SELECT *,(vat_payable-vat_refundable) AS vat_net FROM vat_records WHERE id=$1 AND user_id=$2',[parseId(req),req.user.id]); if(!r.rowCount)return fail(res,404,'Not found','NOT_FOUND'); return ok(res,{...r.rows[0],analysis:analysisText(r.rows[0],'VAT')});};
export const updateVat = async (req,res)=>{ const payload=req.body||{}; const summary=buildSummary(payload,'VAT'); return ok(res, (await query('UPDATE vat_records SET payload=$1,period_label=COALESCE($2,period_label),filing_period_start=COALESCE($3,filing_period_start),filing_period_end=COALESCE($4,filing_period_end),sales_total=$5,purchase_total=$6,expenses_total=$7,taxable_amount=$8,vat_payable=$9,vat_refundable=$10,updated_at=NOW() WHERE id=$11 AND user_id=$12 RETURNING *',[payload,payload?.periodLabel||null,payload?.taxPeriodStart||null,payload?.taxPeriodEnd||null,summary.sales,summary.purchases,summary.expenses,summary.taxable,toNumber(payload?.result?.netVat||payload?.netVat)>0?toNumber(payload?.result?.netVat||payload?.netVat):0,toNumber(payload?.result?.netVat||payload?.netVat)<0?Math.abs(toNumber(payload?.result?.netVat||payload?.netVat)):0,parseId(req),req.user.id])).rows[0]);};
export const duplicateVat = async (req,res)=>ok(res, (await query('INSERT INTO vat_records (user_id,business_profile_id,period_label,filing_period_start,filing_period_end,sales_total,purchase_total,expenses_total,taxable_amount,vat_payable,vat_refundable,payload,export_metadata,created_at,updated_at) SELECT user_id,business_profile_id,period_label,filing_period_start,filing_period_end,sales_total,purchase_total,expenses_total,taxable_amount,vat_payable,vat_refundable,payload,export_metadata,NOW(),NOW() FROM vat_records WHERE id=$1 AND user_id=$2 RETURNING *',[parseId(req),req.user.id])).rows[0]);
export const deleteVat = async (req,res)=>{await query('DELETE FROM vat_records WHERE id=$1 AND user_id=$2',[parseId(req),req.user.id]); return ok(res,{deleted:true});};
export const listTax = async (req,res)=>listByType(req,res,'corporate_tax_records','CORPORATE');
export const createTax = async (req,res)=>{ const payload=req.body||{}; const summary=buildSummary(payload,'CORPORATE'); return ok(res, (await query('INSERT INTO corporate_tax_records (user_id,payload,period_label,filing_period_start,filing_period_end,sales_total,purchase_total,expenses_total,taxable_amount,corporate_tax_estimate,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW()) RETURNING *',[req.user.id,payload,payload?.periodLabel||null,payload?.financialYearStart||null,payload?.financialYearEnd||null,summary.sales,summary.purchases,summary.expenses,summary.taxable,toNumber(payload?.result?.taxPayable||payload?.taxPayable)])).rows[0]);};
export const getTax = async (req,res)=>{const r=await query('SELECT * FROM corporate_tax_records WHERE id=$1 AND user_id=$2',[parseId(req),req.user.id]); if(!r.rowCount)return fail(res,404,'Not found','NOT_FOUND'); return ok(res,{...r.rows[0],analysis:analysisText(r.rows[0],'CORPORATE')});};
export const updateTax = async (req,res)=>{ const payload=req.body||{}; const summary=buildSummary(payload,'CORPORATE'); return ok(res, (await query('UPDATE corporate_tax_records SET payload=$1,period_label=COALESCE($2,period_label),filing_period_start=COALESCE($3,filing_period_start),filing_period_end=COALESCE($4,filing_period_end),sales_total=$5,purchase_total=$6,expenses_total=$7,taxable_amount=$8,corporate_tax_estimate=$9,updated_at=NOW() WHERE id=$10 AND user_id=$11 RETURNING *',[payload,payload?.periodLabel||null,payload?.financialYearStart||null,payload?.financialYearEnd||null,summary.sales,summary.purchases,summary.expenses,summary.taxable,toNumber(payload?.result?.taxPayable||payload?.taxPayable),parseId(req),req.user.id])).rows[0]);};
export const duplicateTax = async (req,res)=>ok(res, (await query('INSERT INTO corporate_tax_records (user_id,business_profile_id,period_label,filing_period_start,filing_period_end,sales_total,purchase_total,expenses_total,taxable_amount,corporate_tax_estimate,payload,export_metadata,created_at,updated_at) SELECT user_id,business_profile_id,period_label,filing_period_start,filing_period_end,sales_total,purchase_total,expenses_total,taxable_amount,corporate_tax_estimate,payload,export_metadata,NOW(),NOW() FROM corporate_tax_records WHERE id=$1 AND user_id=$2 RETURNING *',[parseId(req),req.user.id])).rows[0]);
export const deleteTax = async (req,res)=>{await query('DELETE FROM corporate_tax_records WHERE id=$1 AND user_id=$2',[parseId(req),req.user.id]); return ok(res,{deleted:true});};
export const listReminders = async (req,res)=>ok(res, (await query('SELECT * FROM filing_reminders WHERE user_id=$1 ORDER BY due_date ASC',[req.user.id])).rows);
export const createReminder = async (req,res)=>ok(res, (await query('INSERT INTO filing_reminders (user_id,title,type,due_date,notes,status,email_reminder_enabled,reminder_days_before,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,COALESCE($6,\'pending\'),COALESCE($7,false),COALESCE($8,3),NOW(),NOW()) RETURNING *',[req.user.id, req.body?.title, req.body?.type || 'VAT', req.body?.dueDate, req.body?.notes || null, req.body?.status, Boolean(req.body?.emailReminderEnabled), Number(req.body?.reminderDaysBefore ?? 3)])).rows[0]);
export const updateReminder = async (req,res)=>ok(res, (await query('UPDATE filing_reminders SET title=COALESCE($1,title),type=COALESCE($2,type),due_date=COALESCE($3,due_date),notes=COALESCE($4,notes),status=COALESCE($5,status),email_reminder_enabled=COALESCE($6,email_reminder_enabled),reminder_days_before=COALESCE($7,reminder_days_before),updated_at=NOW() WHERE id=$8 AND user_id=$9 RETURNING *',[req.body?.title,req.body?.type,req.body?.dueDate,req.body?.notes,req.body?.status,req.body?.emailReminderEnabled,req.body?.reminderDaysBefore,parseId(req),req.user.id])).rows[0]);
export const deleteReminder = async (req,res)=>{await query('DELETE FROM filing_reminders WHERE id=$1 AND user_id=$2',[parseId(req),req.user.id]);return ok(res,{deleted:true});};
export const completeReminder = async (req,res)=>ok(res, (await query("UPDATE filing_reminders SET status='completed',updated_at=NOW() WHERE id=$1 AND user_id=$2 RETURNING *",[parseId(req),req.user.id])).rows[0]);
export const adminStats = async (_req,res)=>ok(res,{message:'Admin stats temporarily disabled in pg cutover'});
export const adminUsers = async (_req,res)=>ok(res,[]);
export const adminUser = async (_req,res)=>ok(res,null);
export const adminUserStatus = async (_req,res)=>ok(res,null);
export const adminRecords = async (_req,res)=>ok(res,{vat:[],tax:[]});
export const getSmtp = async (_req,res)=>ok(res,null);
export const putSmtp = async (_req,res)=>ok(res,null);

export const adminAuditLogs = async (_req,res)=>ok(res,[]);
