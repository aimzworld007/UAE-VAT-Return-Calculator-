# Deploying UAE VAT & Tax Filing Assistant to Coolify

## 1) Create a new Coolify project
1. In Coolify, create a new project named **`uaevat-live`**.
2. Keep this project dedicated to production resources for `uaevat.live`.

## 2) Add PostgreSQL as a separate service
1. Inside `uaevat-live`, add a **PostgreSQL** database service.
2. After deployment, open the PostgreSQL service settings.
3. Copy the generated **internal connection string** (`DATABASE_URL`).

## 3) Add the app from GitHub
1. Add a new application service in the same project.
2. Connect this repository.
3. Configure the app to use the included **Dockerfile** (Docker-based deploy).

## 4) Configure environment variables in Coolify
Set these app environment variables:

```env
DATABASE_URL=
JWT_SECRET=
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://uaevat.live
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

- Paste the PostgreSQL internal URL into `DATABASE_URL`.
- Use a strong random value for `JWT_SECRET`.

## 5) Domain + SSL
1. Attach the domain **`uaevat.live`** to the app service.
2. Enable SSL (Let's Encrypt) in Coolify.

## 6) Run production SQL migration migrations safely
After first deploy, run in app/container terminal:

```bash
npm run db:migrate
```

> Do **not** run destructive reset/drop commands in production.

## 7) Verify health and core flows
1. Open `https://uaevat.live/api/health` and confirm success JSON.
2. Test register/login.
3. Open user dashboard and admin dashboard.
4. Verify VAT/Corporate Tax calculations, PDF export, and print flow.
