import { verifyAccessToken } from '../lib/authTokens.js';

function readToken(req) {
  if (req.cookies?.accessToken) return req.cookies.accessToken;
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');
  if (scheme === 'Bearer' && token) return token;
  return null;
}

export function requireAuth(req, res, next) {
  const token = readToken(req);
  if (!token) return res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'Unauthorized' });

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email, role: String(payload.role || 'user').toLowerCase() };
    return next();
  } catch {
    return res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'Invalid or expired token' });
  }
}

export function requireSuperadmin(req, res, next) {
  if (!req.user) return res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'Unauthorized' });
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Superadmin access required' });
  }
  return next();
}
