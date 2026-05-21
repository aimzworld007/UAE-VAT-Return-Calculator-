# VPS + PostgreSQL Cutover Checklist (from Vercel)

Use this checklist to validate the app after moving from Vercel to a VPS with your own PostgreSQL.

## 1) Environment variables (required)

Set these on the VPS process manager (systemd/pm2/docker compose), **not** only in `.env` files:

- `NODE_ENV=production`
- `PORT=5000` (or your reverse-proxy target port)
- `DATABASE_URL=postgresql://...`
- `JWT_SECRET=<long-random-string>`
- `FRONTEND_ORIGIN=https://your-domain.com`

## 2) Database connectivity checks

Run from app root on VPS:

```bash
npm ci
npm run db:migrate
```

## 3) Build and runtime checks

```bash
npm run build
npm run start
curl -sS http://127.0.0.1:5000/api/health
curl -sS http://127.0.0.1:5000/api/db-check
```

## 4) Reverse proxy checks (Nginx/Caddy/Traefik)

Ensure your proxy routes `/api/*` and SPA paths to the same app service, forwards `X-Forwarded-*` headers, and enforces HTTPS.

## 5) Auth and cookie checks

Verify login responses include `Set-Cookie` with `HttpOnly`; ensure `Secure` and `SameSite` align with your domain strategy.

## 6) Optional startup hardening

For Docker deployments, run migrations before starting app:

```bash
npm run db:migrate && node server/index.js
```
