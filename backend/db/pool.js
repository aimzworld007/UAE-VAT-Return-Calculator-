import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const sslEnabled = process.env.DATABASE_SSL === 'true' || process.env.PGSSL === 'true' || process.env.PGSSLMODE === 'require';

export const pool = new Pool({
  connectionString,
  ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
});

pool.on('connect', () => {
  console.info('[db] PostgreSQL pool connection established');
});

pool.on('error', (err) => {
  console.error('[db] PostgreSQL pool error:', err?.message || 'unknown error');
});

export async function query(text, params = []) {
  return pool.query(text, params);
}

export async function withTransaction(handler) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await handler(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
