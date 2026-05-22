import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

function readSslEnabled() {
  const raw = (process.env.DATABASE_SSL || process.env.PGSSL || process.env.PGSSLMODE || '').toLowerCase();
  return raw === 'true' || raw === '1' || raw === 'require';
}

function describeConnection(urlString) {
  try {
    const url = new URL(urlString);
    return {
      host: url.hostname || 'unknown-host',
      port: url.port || '5432',
      database: (url.pathname || '').replace(/^\//, '') || 'unknown-db',
      ssl: readSslEnabled(),
    };
  } catch {
    return { host: 'unknown-host', port: 'unknown-port', database: 'unknown-db', ssl: readSslEnabled() };
  }
}

export const pool = new Pool({
  connectionString,
  ssl: readSslEnabled() ? { rejectUnauthorized: false } : undefined,
});

const connectionInfo = describeConnection(connectionString);

pool.on('connect', () => {
  console.info(
    `[db] PostgreSQL pool connected host=${connectionInfo.host} port=${connectionInfo.port} database=${connectionInfo.database} ssl=${connectionInfo.ssl}`
  );
});

pool.on('error', (err) => {
  console.error(`[db] PostgreSQL pool error: ${err?.message || 'unknown error'}`);
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
