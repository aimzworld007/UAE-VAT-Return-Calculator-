import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { query } from './query.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runOptionalAlterations() {
  await query('CREATE EXTENSION IF NOT EXISTS citext');
  await query("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user'");
  await query("UPDATE users SET role = LOWER(role) WHERE role <> LOWER(role)");
}

export async function ensureSchema() {
  const sql = await fs.readFile(path.join(__dirname, 'schema.sql'), 'utf8');
  await query(sql);
  await runOptionalAlterations();
}
