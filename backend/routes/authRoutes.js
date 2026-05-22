import bcrypt from 'bcrypt';
import { Router } from 'express';
import { z } from 'zod';
import { query, withTransaction } from '../db/query.js';
import { signAccessToken } from '../lib/authTokens.js';
import { requireAuth } from '../middleware/auth.js';
import { logAudit } from '../services/auditService.js';

const router = Router();

const registerSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  fullName: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

function mapUser(row) {
  return {
    id: row.id,
    name: row.name || row.full_name || '',
    email: row.email,
    role: String(row.role || 'user').toLowerCase(),
  };
}

function setAuthCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('accessToken', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
}

router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: 'Invalid registration payload' });
  }

  const input = parsed.data;
  const name = input.name || input.fullName;
  const email = input.email.toLowerCase();

  try {
    const createdUser = await withTransaction(async (client) => {
      const existing = await client.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [email]);
      if (existing.rowCount) {
        const error = new Error('Email already exists');
        error.status = 409;
        error.code = 'DUPLICATE_EMAIL';
        throw error;
      }

      const passwordHash = await bcrypt.hash(input.password, 12);
      const inserted = await client.query(
        `INSERT INTO users (name, full_name, email, password_hash, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'user', NOW(), NOW())
         RETURNING id, name, full_name, email, role`,
        [name, name, email, passwordHash]
      );

      return inserted.rows[0];
    });

    const safeUser = mapUser(createdUser);
    const token = signAccessToken({ id: safeUser.id, email: safeUser.email, role: safeUser.role, fullName: safeUser.name, isActive: true });
    setAuthCookie(res, token);
    logAudit({ ...req, user: { id: safeUser.id } }, 'register', 'auth', { email: safeUser.email });

    return res.status(201).json({
      success: true,
      data: {
        token,
        accessToken: token,
        user: safeUser,
      },
    });
  } catch (error) {
    if (error?.code === 'DUPLICATE_EMAIL' || error?.status === 409) {
      return res.status(409).json({ success: false, code: 'DUPLICATE_EMAIL', message: 'Email already exists' });
    }

    return res.status(500).json({ success: false, code: 'REGISTER_FAILED', message: 'Unable to register user' });
  }
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: 'Invalid login payload' });
  }

  const email = parsed.data.email.toLowerCase();
  const userResult = await query('SELECT id, name, full_name, email, password_hash, role, is_active FROM users WHERE email = $1 LIMIT 1', [email]);
  const row = userResult.rows[0];

  if (!row || row.is_active === false) {
    return res.status(401).json({ success: false, code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' });
  }

  const passwordMatches = await bcrypt.compare(parsed.data.password, row.password_hash || '');
  if (!passwordMatches) {
    return res.status(401).json({ success: false, code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' });
  }

  const safeUser = mapUser(row);
  const token = signAccessToken({ id: safeUser.id, email: safeUser.email, role: safeUser.role, fullName: safeUser.name, isActive: true });

  setAuthCookie(res, token);
  logAudit({ ...req, user: { id: safeUser.id } }, 'login', 'auth', { email: safeUser.email });

  return res.json({
    success: true,
    data: {
      token,
      accessToken: token,
      user: safeUser,
    },
  });
});

router.get('/me', requireAuth, async (req, res) => {
  const userResult = await query('SELECT id, name, full_name, email, role FROM users WHERE id = $1 LIMIT 1', [req.user.id]);
  if (!userResult.rowCount) {
    return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'User not found' });
  }

  return res.json({ success: true, data: { user: mapUser(userResult.rows[0]) } });
});

router.post('/logout', requireAuth, async (req, res) => {
  res.clearCookie('accessToken', { path: '/' });
  logAudit(req, 'logout', 'auth', {});
  return res.json({ success: true, data: { loggedOut: true } });
});

export default router;