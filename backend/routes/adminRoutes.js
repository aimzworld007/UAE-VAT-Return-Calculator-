import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/query.js';
import { logAudit } from '../services/auditService.js';
import { readSmtpSettings, sanitizeSmtpSettings, sendTestEmail } from '../services/emailService.js';

const router = Router();

const smtpSettingsSchema = z.object({
  host: z.string().trim().min(1).max(255),
  port: z.coerce.number().int().min(1).max(65535),
  secure: z.boolean().default(false),
  username: z.string().trim().min(1).max(255),
  password: z.string().optional(),
  fromEmail: z.string().trim().email(),
  fromName: z.string().trim().max(255).optional().nullable(),
});

function mapUser(row) {
  return {
    id: row.id,
    name: row.name || row.full_name || '',
    email: row.email,
    role: String(row.role || 'user').toLowerCase(),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

router.get('/summary', async (_req, res) => {
  const [users, businesses, vatRecords, corporateTaxRecords, reminders, recentUsers, recentVat, recentCorporateTax] = await Promise.all([
    query('SELECT COUNT(*)::int AS count FROM users'),
    query('SELECT COUNT(*)::int AS count FROM business_profiles'),
    query('SELECT COUNT(*)::int AS count FROM vat_records'),
    query('SELECT COUNT(*)::int AS count FROM corporate_tax_records'),
    query("SELECT COUNT(*)::int AS count FROM reminders WHERE status = 'pending'"),
    query('SELECT id, name, full_name, email, role, created_at, updated_at FROM users ORDER BY created_at DESC LIMIT 8'),
    query(`SELECT id, user_id, created_at, status, payable_vat, refundable_vat FROM vat_records ORDER BY created_at DESC LIMIT 8`),
    query(`SELECT id, user_id, created_at, status, tax_amount FROM corporate_tax_records ORDER BY created_at DESC LIMIT 8`),
  ]);

  return res.json({
    success: true,
    data: {
      totalUsers: users.rows[0]?.count || 0,
      totalBusinesses: businesses.rows[0]?.count || 0,
      totalVatRecords: vatRecords.rows[0]?.count || 0,
      totalCorporateTaxRecords: corporateTaxRecords.rows[0]?.count || 0,
      pendingReminders: reminders.rows[0]?.count || 0,
      recentUsers: recentUsers.rows.map(mapUser),
      recentRecords: {
        vat: recentVat.rows,
        corporateTax: recentCorporateTax.rows,
      },
    },
  });
});

router.get('/users', async (req, res) => {
  const search = String(req.query.search || '').trim();
  const params = [`%${search}%`];

  const result = await query(
    `SELECT id, name, full_name, email, role, created_at, updated_at
     FROM users
     WHERE ($1 = '%%' OR COALESCE(name, full_name, '') ILIKE $1 OR email::text ILIKE $1)
     ORDER BY created_at DESC
     LIMIT 200`,
    params
  );

  return res.json({ success: true, data: { users: result.rows.map(mapUser) } });
});

router.get('/users/:id', async (req, res) => {
  const result = await query('SELECT id, name, full_name, email, role, created_at, updated_at FROM users WHERE id = $1 LIMIT 1', [req.params.id]);
  if (!result.rowCount) {
    return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'User not found' });
  }

  return res.json({ success: true, data: { user: mapUser(result.rows[0]) } });
});

router.get('/smtp-settings', async (_req, res) => {
  const settings = await readSmtpSettings();
  return res.json({ success: true, data: sanitizeSmtpSettings(settings) });
});

router.put('/smtp-settings', async (req, res) => {
  const parsed = smtpSettingsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: 'Invalid SMTP settings payload' });
  }

  const p = parsed.data;
  const existing = await readSmtpSettings();
  const nextPassword = typeof p.password === 'string' && p.password.length > 0
    ? p.password
    : existing?.password_encrypted || null;

  const result = await query(
    `INSERT INTO smtp_settings (
      id, host, port, secure, username, password_encrypted, from_email, from_name, updated_by, created_at, updated_at
    ) VALUES (
      COALESCE($1, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8, $9, COALESCE($10, NOW()), NOW()
    )
    ON CONFLICT (id)
    DO UPDATE SET
      host = EXCLUDED.host,
      port = EXCLUDED.port,
      secure = EXCLUDED.secure,
      username = EXCLUDED.username,
      password_encrypted = EXCLUDED.password_encrypted,
      from_email = EXCLUDED.from_email,
      from_name = EXCLUDED.from_name,
      updated_by = EXCLUDED.updated_by,
      updated_at = NOW()
    RETURNING *`,
    [
      existing?.id || null,
      p.host,
      p.port,
      Boolean(p.secure),
      p.username,
      nextPassword,
      p.fromEmail,
      p.fromName || null,
      req.user.id,
      existing?.created_at || null,
    ]
  );

  logAudit(req, 'update_smtp_settings', 'admin', { smtpSettingsId: result.rows[0].id });

  return res.json({ success: true, data: sanitizeSmtpSettings(result.rows[0]) });
});

router.post('/smtp-settings/test-email', async (req, res) => {
  const to = String(req.body?.to || req.user.email || '').trim();
  if (!to) {
    return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: 'Recipient email is required' });
  }

  try {
    const info = await sendTestEmail({ to });
    logAudit(req, 'test_smtp_email', 'admin', { to });
    return res.json({ success: true, data: { sent: true, info } });
  } catch (error) {
    return res.status(400).json({ success: false, code: error?.code || 'EMAIL_FAILED', message: error?.message || 'Failed to send test email' });
  }
});

router.get('/audit-logs', async (req, res) => {
  const userId = String(req.query.user || '').trim();
  const module = String(req.query.module || '').trim();
  const action = String(req.query.action || '').trim();
  const startDate = String(req.query.startDate || '').trim();
  const endDate = String(req.query.endDate || '').trim();
  const limit = Math.max(1, Math.min(500, Number(req.query.limit || 100)));

  const params = [];
  const where = [];

  if (userId) {
    params.push(userId);
    where.push(`al.user_id = $${params.length}`);
  }
  if (module) {
    params.push(module);
    where.push(`al.module = $${params.length}`);
  }
  if (action) {
    params.push(action);
    where.push(`al.action = $${params.length}`);
  }
  if (startDate) {
    params.push(startDate);
    where.push(`al.created_at::date >= $${params.length}`);
  }
  if (endDate) {
    params.push(endDate);
    where.push(`al.created_at::date <= $${params.length}`);
  }

  params.push(limit);

  const result = await query(
    `SELECT
       al.id,
       al.user_id,
       al.action,
       al.module,
       al.metadata,
       al.ip,
       al.user_agent,
       al.created_at,
       u.email,
       COALESCE(u.name, u.full_name, '') AS user_name
     FROM audit_logs al
     LEFT JOIN users u ON u.id = al.user_id
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY al.created_at DESC
     LIMIT $${params.length}`,
    params
  );

  return res.json({ success: true, data: result.rows });
});

export default router;