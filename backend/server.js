import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes.js';
import taxRecordRoutes from './routes/taxRecordRoutes.js';
import vatPdfRoutes from './routes/vatPdfRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import appRoutes from './routes/appRoutes.js';
import userRoutes from './routes/userRoutes.js';
import businessProfileRoutes from './routes/businessProfileRoutes.js';
import vatRecordRoutes from './routes/vatRecordRoutes.js';
import corporateTaxRecordRoutes from './routes/corporateTaxRecordRoutes.js';
import reminderRoutes from './routes/reminderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { ensureSchema } from './db/ensureSchema.js';
import { requireAuth, requireSuperadmin } from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.FRONTEND_URL?.split(',') || process.env.FRONTEND_ORIGIN?.split(',') || true,
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 50 });
  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/tax-records', taxRecordRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/business-profile', businessProfileRoutes);
  app.use('/api/vat-records', vatRecordRoutes);
  app.use('/api/corporate-tax-records', corporateTaxRecordRoutes);
  app.use('/api/reminders', reminderRoutes);
  app.use('/api/admin', requireAuth, requireSuperadmin, adminRoutes);
  app.use('/api', vatPdfRoutes);
  app.use('/api', appRoutes);

  app.get('/api/health', (_, res) => {
    res.json({ status: 'ok' });
  });


  app.use('/api/*', (_req, res) => {
    return res.status(404).json({ success: false, code: 'API_NOT_FOUND', message: 'API route not found' });
  });

  const distDir = path.resolve(__dirname, '../dist');
  const hasDistBuild = fs.existsSync(path.join(distDir, 'index.html'));

  if (hasDistBuild) {
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    app.get('/', (_req, res) => {
      res
        .status(503)
        .type('text/html')
        .send('<h1>Frontend build not found</h1><p>Run <code>npm run build</code> before starting the server.</p>');
    });
  }

  app.use((error, _req, res, _next) => {
    console.error(error);
    return res.status(error?.status || 500).json({
      success: false,
      message: error?.message || 'Internal server error',
    });
  });

  return app;
}

export async function startServer({ defaultPort = 8787 } = {}) {
  await ensureSchema();
  const app = createApp();
  const port = Number(process.env.PORT) || defaultPort;

  app.listen(port, () => {
    console.log(`VAT PDF server listening on ${port}`);
  });
}

const isMainModule = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isMainModule) {
  startServer().catch((error) => {
    console.error('Failed to initialize API server:', error);
    process.exit(1);
  });
}
