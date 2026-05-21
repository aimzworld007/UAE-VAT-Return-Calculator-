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

## Database Setup (PostgreSQL via pg)

After setting `DATABASE_URL` in your local `.env`, run:

```bash
npm install
npm run db:migrate
```

## Production Build

```bash
npm run build
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
