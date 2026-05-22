import { query } from '../db/query.js';

let nodemailerModulePromise;

async function getNodemailer() {
  if (!nodemailerModulePromise) {
    nodemailerModulePromise = import('nodemailer').then((module) => module.default || module);
  }
  return nodemailerModulePromise;
}

function toBool(value) {
  if (typeof value === 'boolean') return value;
  if (value == null) return false;
  const normalized = String(value).trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on';
}

export function sanitizeSmtpSettings(row) {
  if (!row) return null;
  return {
    id: row.id,
    host: row.host,
    port: row.port,
    secure: Boolean(row.secure),
    username: row.username,
    fromEmail: row.from_email,
    fromName: row.from_name,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    hasPassword: Boolean(row.password_encrypted),
  };
}

export async function readSmtpSettings() {
  const result = await query('SELECT * FROM smtp_settings ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST LIMIT 1');
  return result.rows[0] || null;
}

function buildConfigFromEnv() {
  const host = process.env.SMTP_HOST || null;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : null;
  const username = process.env.SMTP_USERNAME || process.env.SMTP_USER || null;
  const password = process.env.SMTP_PASSWORD || process.env.SMTP_PASS || null;
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.FROM_EMAIL || null;
  const fromName = process.env.SMTP_FROM_NAME || process.env.FROM_NAME || 'FTA VAT & Corporate Tax';
  const secure = toBool(process.env.SMTP_SECURE);

  if (!host || !port || !username || !password || !fromEmail) return null;

  return {
    host,
    port,
    secure,
    username,
    password,
    fromEmail,
    fromName,
    source: 'env',
  };
}

export async function resolveSmtpConfig() {
  const settings = await readSmtpSettings();
  if (settings?.host && settings?.port && settings?.username && settings?.password_encrypted && settings?.from_email) {
    return {
      host: settings.host,
      port: Number(settings.port),
      secure: Boolean(settings.secure),
      username: settings.username,
      password: settings.password_encrypted,
      fromEmail: settings.from_email,
      fromName: settings.from_name || 'FTA VAT & Corporate Tax',
      source: 'database',
    };
  }

  const fallback = buildConfigFromEnv();
  if (fallback) return fallback;

  return null;
}

export async function sendEmail({ to, subject, text, html }) {
  const config = await resolveSmtpConfig();
  if (!config) {
    const error = new Error('SMTP is not configured. Configure SMTP settings in admin or set SMTP env variables.');
    error.code = 'SMTP_NOT_CONFIGURED';
    throw error;
  }

  const nodemailer = await getNodemailer();
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: Number(config.port),
    secure: Boolean(config.secure),
    auth: {
      user: config.username,
      pass: config.password,
    },
  });

  try {
    await transporter.verify();
  } catch (error) {
    const wrapped = new Error(`SMTP verification failed: ${error?.message || 'unknown error'}`);
    wrapped.code = 'SMTP_VERIFY_FAILED';
    throw wrapped;
  }

  try {
    const info = await transporter.sendMail({
      from: config.fromName ? `${config.fromName} <${config.fromEmail}>` : config.fromEmail,
      to,
      subject,
      text,
      html,
    });

    return {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      source: config.source,
    };
  } catch (error) {
    const wrapped = new Error(`SMTP send failed: ${error?.message || 'unknown error'}`);
    wrapped.code = 'SMTP_SEND_FAILED';
    throw wrapped;
  }
}

export async function sendTestEmail({ to }) {
  const safeTo = String(to || '').trim();
  if (!safeTo) {
    const error = new Error('Recipient email is required for test email.');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  return sendEmail({
    to: safeTo,
    subject: 'FTA VAT & Corporate Tax SMTP Test',
    text: 'SMTP test email sent successfully from UAE VAT & Corporate Tax system.',
    html: '<p>SMTP test email sent successfully from UAE VAT & Corporate Tax system.</p>',
  });
}