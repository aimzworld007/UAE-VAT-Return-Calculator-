import { pool } from './pool.js';
import { ensureSchema } from './ensureSchema.js';

async function run() {
  try {
    await ensureSchema();
    console.log('Migration applied successfully.');
  } catch (e) {
    console.error('Migration failed:', e.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
run();
