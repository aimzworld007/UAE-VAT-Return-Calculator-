import bcrypt from 'bcrypt';
import { Router } from 'express';
import { z } from 'zod';
import { query, withTransaction } from '../db/query.js';
import { requireAuth, requireSuperadmin } from '../middleware/auth.js';
import { logAudit } from '../services/auditService.js';

const router = Router();

const optionalTrimmed = z.preprocess((value) => {
  if (value == null) return undefined;
  const text = String(value).trim();
  return text.length ? text : undefined;
}, z.string().optional());

const optionalTrimmedNullable = z.preprocess((value) => {
  if (typeof value === 'undefined') return undefined;
  if (value === null) return null;
  const text = String(value).trim();
  return text.length ? text : null;
}, z.string().nullable().optional());

const updateProfileSchema = z.object({
  name: optionalTrimmed.pipe(z.string().min(2).max(120).optional()),
  fullName: optionalTrimmed.pipe(z.string().min(2).max(120).optional()),
  email: optionalTrimmed.pipe(z.string().email().optional()),
  phone: optionalTrimmedNullable.pipe(z.string().max(50).nullable().optional()),
  address: optionalTrimmedNullable.pipe(z.string().max(500).nullable().optional()),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

const updateRoleSchema = z.object({
  role: z.enum(['user', 'superadmin']),
});

function mapUser(row) {
  return {
    id: row.id,
    name: row.name || row.full_name || '',
    email: row.email,
    role: String(row.role || 'user').toLowerCase(),
    phone: row.phone ?? null,
    address: row.address ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getUserWithProfileById(userId) {
  const result = await query(
    `SELECT u.id, u.name, u.full_name, u.email, u.role, u.created_at, u.updated_at, up.phone, up.address
     FROM users u
     LEFT JOIN user_profiles up ON up.user_id = u.id
     WHERE u.id = $1
     LIMIT 1`,
    [userId]
  );

  return result.rows[0] || null;
}

router.get('/me', requireAuth, async (req, res) => {
  const row = await getUserWithProfileById(req.user.id);
  if (!row) {
    return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'User not found' });
  }

  return res.json({ success: true, data: { user: mapUser(row) } });
});

router.patch('/me', requireAuth, async (req, res) => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: 'Invalid profile payload' });
  }

  const payload = parsed.data;
  const nextName = payload.name || payload.fullName;
  const nextEmail = payload.email?.toLowerCase();

  try {
    const row = await withTransaction(async (client) => {
      if (nextEmail) {
        const conflict = await client.query('SELECT id FROM users WHERE email = $1 AND id <> $2 LIMIT 1', [nextEmail, req.user.id]);
        if (conflict.rowCount) {
          const error = new Error('Email already exists');
          error.code = 'DUPLICATE_EMAIL';
          throw error;
        }
      }

      await client.query(
        `UPDATE users
         SET name = COALESCE($1, name),
             full_name = COALESCE($1, full_name),
             email = COALESCE($2, email),
             updated_at = NOW()
         WHERE id = $3`,
        [nextName ?? null, nextEmail ?? null, req.user.id]
      );

      if (typeof payload.phone !== 'undefined' || typeof payload.address !== 'undefined') {
        await client.query(
          `INSERT INTO user_profiles (user_id, phone, address, created_at, updated_at)
           VALUES ($1, $2, $3, NOW(), NOW())
           ON CONFLICT (user_id)
           DO UPDATE SET
             phone = COALESCE(EXCLUDED.phone, user_profiles.phone),
             address = COALESCE(EXCLUDED.address, user_profiles.address),
             updated_at = NOW()`,
          [req.user.id, payload.phone ?? null, payload.address ?? null]
        );
      }

      const updated = await client.query(
        `SELECT u.id, u.name, u.full_name, u.email, u.role, u.created_at, u.updated_at, up.phone, up.address
         FROM users u
         LEFT JOIN user_profiles up ON up.user_id = u.id
         WHERE u.id = $1
         LIMIT 1`,
        [req.user.id]
      );

      return updated.rows[0];
    });

    logAudit(req, 'update_profile', 'users', { userId: req.user.id });
    return res.json({ success: true, data: { user: mapUser(row) } });
  } catch (error) {
    if (error?.code === 'DUPLICATE_EMAIL') {
      return res.status(409).json({ success: false, code: 'DUPLICATE_EMAIL', message: 'Email already exists' });
    }

    return res.status(500).json({ success: false, code: 'UPDATE_PROFILE_FAILED', message: 'Unable to update profile' });
  }
});

router.patch('/me/password', requireAuth, async (req, res) => {
  const parsed = updatePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: 'Invalid password payload' });
  }

  const existing = await query('SELECT id, password_hash FROM users WHERE id = $1 LIMIT 1', [req.user.id]);
  if (!existing.rowCount) {
    return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'User not found' });
  }

  const matches = await bcrypt.compare(parsed.data.currentPassword, existing.rows[0].password_hash || '');
  if (!matches) {
    return res.status(400).json({ success: false, code: 'INVALID_PASSWORD', message: 'Current password is incorrect' });
  }

  const nextHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [nextHash, req.user.id]);
  logAudit(req, 'update_password', 'users', { userId: req.user.id });

  return res.json({ success: true, data: { updated: true } });
});

router.get('/', requireAuth, requireSuperadmin, async (req, res) => {
  const search = String(req.query.search || '').trim();
  const limit = Math.max(1, Math.min(200, Number(req.query.limit || 50)));
  const offset = Math.max(0, Number(req.query.offset || 0));

  const params = [`%${search}%`, limit, offset];
  const result = await query(
    `SELECT id, name, full_name, email, role, created_at, updated_at
     FROM users
     WHERE ($1 = '%%' OR COALESCE(name, full_name, '') ILIKE $1 OR email::text ILIKE $1)
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    params
  );

  return res.json({ success: true, data: { users: result.rows.map((row) => mapUser(row)) } });
});

router.get('/:id', requireAuth, requireSuperadmin, async (req, res) => {
  const row = await getUserWithProfileById(req.params.id);
  if (!row) {
    return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'User not found' });
  }

  return res.json({ success: true, data: { user: mapUser(row) } });
});

router.patch('/:id/role', requireAuth, requireSuperadmin, async (req, res) => {
  const parsed = updateRoleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: 'Invalid role payload' });
  }

  const targetId = req.params.id;
  if (targetId === req.user.id && parsed.data.role !== 'superadmin') {
    return res.status(400).json({ success: false, code: 'SELF_ROLE_CHANGE_BLOCKED', message: 'You cannot demote your own superadmin role' });
  }

  const result = await query(
    'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, full_name, email, role, created_at, updated_at',
    [parsed.data.role, targetId]
  );

  if (!result.rowCount) {
    return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'User not found' });
  }

  logAudit(req, 'update_user_role', 'admin', { targetUserId: targetId, role: parsed.data.role });

  return res.json({ success: true, data: { user: mapUser(result.rows[0]) } });
});

export default router;
