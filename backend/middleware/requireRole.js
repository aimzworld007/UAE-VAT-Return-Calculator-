export function requireRole(role) {
  const expected = String(role).toLowerCase();
  return function roleGuard(req, res, next) {
    if (!req.user || String(req.user.role).toLowerCase() !== expected) {
      return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Forbidden' });
    }
    return next();
  };
}
