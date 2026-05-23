import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/query.js';
import { requireAuth } from '../middleware/auth.js';
import { logAudit } from '../services/auditService.js';
import { sendTestEmail } from '../services/emailService.js';

const router = Router();

const reminderSchema = z.object({
  type: z.enum(['VAT', 'Corporate Tax', 'Other']),
  title: z.string().trim().min(2).max(200),
  dueDate: z.string().trim(),
  emailEnabled: z.boolean().optional().default(false),
  status: z.enum(['pending', 'completed']).optional().default('pending'),
});

const updateReminderSchema = reminderSchema.partial();

function normalizeType(type) {
  if (type === 'Corporate Tax') return 'Corporate Tax';
  if (type === 'Other') return 'Other';
  return 'VAT';
}

function mapReminder(row) {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    dueDate: row.due_date,
    emailEnabled: Boolean(row.email_enabled),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getReminderById(id) {
  const result = await query('SELECT * FROM reminders WHERE id = $1 LIMIT 1', [id]);
  return result.rows[0] || null;
}

function canAccessReminder(req, reminder) {
  return req.user.role === 'superadmin' || reminder.user_id === req.user.id;
}

router.use(requireAuth);

router.get('/', async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.max(1, Math.min(100, Number(req.query.limit || 20)));
  const offset = (page - 1) * limit;
  const search = String(req.query.search || '').trim();
  const status = String(req.query.status || '').trim();
  const type = String(req.query.type || '').trim();

  const params = [];
  const where = [];
  if (req.user.role !== 'superadmin') {
    params.push(req.user.id);
    where.push(`user_id = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    where.push(`(title ILIKE $${params.length} OR COALESCE(type, '') ILIKE $${params.length})`);
  }
  if (status) {
    params.push(status);
    where.push(`status = $${params.length}`);
  }
  if (type) {
    params.push(type);
    where.push(`type = $${params.length}`);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const countResult = await query(`SELECT COUNT(*)::int AS count FROM reminders ${whereSql}`, params);

  params.push(limit, offset);
  const result = await query(
    `SELECT * FROM reminders ${whereSql}
     ORDER BY due_date ASC, created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return res.json({
    success: true,
    data: result.rows.map(mapReminder),
    meta: {
      page,
      limit,
      total: countResult.rows[0]?.count || 0,
    },
  });
});

router.get('/upcoming', async (req, res) => {
  const params = [req.user.id];
  let sql = `SELECT * FROM reminders WHERE due_date >= CURRENT_DATE AND status = 'pending'`;
  if (req.user.role !== 'superadmin') {
    sql += ' AND user_id = $1';
  }
  sql += ' ORDER BY due_date ASC LIMIT 10';

  const result = await query(sql, req.user.role === 'superadmin' ? [] : params);
  return res.json({ success: true, data: result.rows.map(mapReminder) });
});

router.post('/', async (req, res) => {
  const parsed = reminderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: 'Invalid reminder payload' });
  }

  const p = parsed.data;
  const dueDate = new Date(p.dueDate);
  if (Number.isNaN(dueDate.getTime())) {
    return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: 'Invalid due date' });
  }

  const result = await query(
    `INSERT INTO reminders (user_id, type, title, due_date, email_enabled, status, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())
     RETURNING *`,
    [req.user.id, normalizeType(p.type), p.title, dueDate, Boolean(p.emailEnabled), p.status || 'pending']
  );

  logAudit(req, 'create_reminder', 'reminders', { reminderId: result.rows[0].id });
  return res.status(201).json({ success: true, data: mapReminder(result.rows[0]) });
});

router.put('/:id', async (req, res) => {
  const parsed = updateReminderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: 'Invalid reminder update payload' });
  }

  const reminder = await getReminderById(req.params.id);
  if (!reminder) {
    return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Reminder not found' });
  }

  if (!canAccessReminder(req, reminder)) {
    return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Forbidden' });
  }

  const p = parsed.data;
  const dueDate = p.dueDate ? new Date(p.dueDate) : null;
  if (p.dueDate && Number.isNaN(dueDate.getTime())) {
    return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: 'Invalid due date' });
  }

  const result = await query(
    `UPDATE reminders
     SET type = COALESCE($1, type),
         title = COALESCE($2, title),
         due_date = COALESCE($3, due_date),
         email_enabled = COALESCE($4, email_enabled),
         status = COALESCE($5, status),
         updated_at = NOW()
     WHERE id = $6
     RETURNING *`,
    [
      p.type ? normalizeType(p.type) : null,
      p.title ?? null,
      dueDate,
      typeof p.emailEnabled === 'boolean' ? p.emailEnabled : null,
      p.status ?? null,
      req.params.id,
    ]
  );

  logAudit(req, 'update_reminder', 'reminders', { reminderId: req.params.id });
  return res.json({ success: true, data: mapReminder(result.rows[0]) });
});

router.delete('/:id', async (req, res) => {
  const reminder = await getReminderById(req.params.id);
  if (!reminder) {
    return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Reminder not found' });
  }

  if (!canAccessReminder(req, reminder)) {
    return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Forbidden' });
  }

  await query('DELETE FROM reminders WHERE id = $1', [req.params.id]);
  logAudit(req, 'delete_reminder', 'reminders', { reminderId: req.params.id });

  return res.json({ success: true, data: { deleted: true } });
});

router.post('/:id/test-email', async (req, res) => {
  const reminder = await getReminderById(req.params.id);
  if (!reminder) {
    return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Reminder not found' });
  }

  if (!canAccessReminder(req, reminder)) {
    return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Forbidden' });
  }

  const targetEmail = req.body?.to || req.user.email;

  try {
    const info = await sendTestEmail({ to: targetEmail });
    return res.json({ success: true, data: { sent: true, info } });
  } catch (error) {
    return res.status(400).json({ success: false, code: error?.code || 'EMAIL_FAILED', message: error?.message || 'Unable to send test email' });
  }
});

router.post('/test-email', async (req, res) => {
  const targetUserId = req.body?.userId && req.user.role === 'superadmin' ? req.body.userId : req.user.id;
  const userResult = await query('SELECT id, email FROM users WHERE id = $1 LIMIT 1', [targetUserId]);
  if (!userResult.rowCount) {
    return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'User not found' });
  }

  const to = req.body?.to || userResult.rows[0].email;

  try {
    const info = await sendTestEmail({ to });
    return res.json({ success: true, data: { sent: true, info } });
  } catch (error) {
    return res.status(400).json({ success: false, code: error?.code || 'EMAIL_FAILED', message: error?.message || 'Unable to send test email' });
  }
});

export default router;
