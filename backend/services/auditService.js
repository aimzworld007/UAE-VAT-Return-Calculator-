import { query } from '../db/query.js';

function safeMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') return {};
  return metadata;
}

function readIp(req) {
  return req?.ip || req?.headers?.['x-forwarded-for'] || null;
}

function readUserAgent(req) {
  return req?.headers?.['user-agent'] || null;
}

export function logAudit(req, action, module, metadata = {}) {
  const userId = req?.user?.id || null;
  const ip = readIp(req);
  const userAgent = readUserAgent(req);

  query(
    `INSERT INTO audit_logs (user_id, action, module, metadata, ip, user_agent, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
    [userId, action, module, safeMetadata(metadata), ip, userAgent]
  ).catch((error) => {
    console.error('[audit] failed to insert log:', error?.message || 'unknown error');
  });
}