import { Router } from 'express';
import { query } from '../db/query.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function toNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

async function getUserSummary(userId) {
  const [vatCount, corpCount, latestVat, latestCorp, upcoming, revenue, recentVat, recentCorp] = await Promise.all([
    query('SELECT COUNT(*)::int AS count FROM vat_records WHERE user_id = $1', [userId]),
    query('SELECT COUNT(*)::int AS count FROM corporate_tax_records WHERE user_id = $1', [userId]),
    query('SELECT payable_vat, refundable_vat, updated_at FROM vat_records WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1', [userId]),
    query('SELECT tax_amount, updated_at FROM corporate_tax_records WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1', [userId]),
    query(`SELECT id, title, type, due_date, status, email_enabled
           FROM reminders
           WHERE user_id = $1 AND status = 'pending' AND due_date >= CURRENT_DATE
           ORDER BY due_date ASC
           LIMIT 5`, [userId]),
    query(
      `SELECT
         COALESCE((SELECT SUM(taxable_sales) FROM vat_records WHERE user_id = $1), 0) AS vat_revenue,
         COALESCE((SELECT SUM(revenue) FROM corporate_tax_records WHERE user_id = $1), 0) AS corp_revenue`,
      [userId]
    ),
    query(`SELECT id, 'vat' AS record_type, period_start, period_end, status, created_at
           FROM vat_records
           WHERE user_id = $1
           ORDER BY created_at DESC
           LIMIT 5`, [userId]),
    query(`SELECT id, 'corporate_tax' AS record_type, period_start, period_end, status, created_at
           FROM corporate_tax_records
           WHERE user_id = $1
           ORDER BY created_at DESC
           LIMIT 5`, [userId]),
  ]);

  const merged = [...recentVat.rows, ...recentCorp.rows]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8);

  return {
    totalVatRecords: vatCount.rows[0]?.count || 0,
    totalCorporateTaxRecords: corpCount.rows[0]?.count || 0,
    latestVatPayable: toNumber(latestVat.rows[0]?.payable_vat) - toNumber(latestVat.rows[0]?.refundable_vat),
    latestCorporateTax: toNumber(latestCorp.rows[0]?.tax_amount),
    upcomingReminders: upcoming.rows,
    totalRevenueFromTaxRecords: toNumber(revenue.rows[0]?.vat_revenue) + toNumber(revenue.rows[0]?.corp_revenue),
    recentRecords: merged,
  };
}

async function getSuperadminSummary() {
  const [users, businesses, vatCount, corpCount, pendingReminders] = await Promise.all([
    query('SELECT COUNT(*)::int AS count FROM users'),
    query('SELECT COUNT(*)::int AS count FROM business_profiles'),
    query('SELECT COUNT(*)::int AS count FROM vat_records'),
    query('SELECT COUNT(*)::int AS count FROM corporate_tax_records'),
    query("SELECT COUNT(*)::int AS count FROM reminders WHERE status = 'pending'"),
  ]);

  return {
    totalUsers: users.rows[0]?.count || 0,
    totalBusinesses: businesses.rows[0]?.count || 0,
    totalVatRecords: vatCount.rows[0]?.count || 0,
    totalCorporateTaxRecords: corpCount.rows[0]?.count || 0,
    pendingReminders: pendingReminders.rows[0]?.count || 0,
  };
}

async function handleSummary(req, res) {
  const summary = await getUserSummary(req.user.id);

  if (req.user.role === 'superadmin') {
    summary.platform = await getSuperadminSummary();
  }

  return res.json({ success: true, data: summary });
}

router.get('/', requireAuth, handleSummary);
router.get('/summary', requireAuth, handleSummary);

export default router;