# UAE Tax Suite

Deploy-ready Vite + React app for UAE VAT Return and UAE Corporate Tax estimation.

## Features

- UAE VAT Return calculator for 3-month VAT periods
- VAT inclusive / VAT exclusive calculation mode
- Emirate-wise VAT201-style box mapping
- UAE Corporate Tax calculator with AED 375,000 threshold
- Small Business Relief switch with AED 3,000,000 revenue test
- Shared business profile
- Browser autosave using localStorage
- Print / Save PDF support
- Responsive Material-style UI

## Local Development

```bash
npm install
npm run dev:api
npm run dev
```

If your API runs on another host (instead of `http://localhost:8787`), add:

```bash
VITE_API_BASE_URL=https://your-api-domain.com
```

in a local `.env` file.

## Environment Variables

Create a `.env` file in the project root with:

```bash
DATABASE_URL=postgres://user:password@localhost:5432/uae_tax_suite
DATABASE_SSL=false
JWT_SECRET=change-this-in-production

# Optional frontend API base override
VITE_API_BASE_URL=http://localhost:8787

# Optional SMTP env fallback (used when DB smtp_settings is empty)
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=
SMTP_FROM_NAME=FTA VAT & Corporate Tax
```

## Database Setup (PostgreSQL via pg)

After setting `DATABASE_URL`, run:

```bash
npm install
npm run db:migrate
```

## Superadmin Setup

Create or update a superadmin user:

```bash
node backend/scripts/createSuperadmin.js admin@example.com StrongPassword123 \"Admin Name\"
```

This upserts the user and forces role `superadmin`.

## Production Build

```bash
npm run build
```

## Production Run

```bash
npm run build
npm start
```

## Deploy to Vercel

1. Push this folder to GitHub.
2. Open Vercel → New Project.
3. Import the GitHub repository.
4. Framework preset: Vite.
5. Build command: `npm run build`.
6. Output directory: `dist`.
7. Deploy.

## Disclaimer

This app is an internal calculation aid only. Final UAE VAT and Corporate Tax filing should be reviewed with a qualified accountant or tax advisor.
