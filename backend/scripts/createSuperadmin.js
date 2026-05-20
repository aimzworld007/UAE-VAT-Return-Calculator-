import bcrypt from 'bcrypt';
import { query } from '../db/query.js';
import { ensureSchema } from '../db/ensureSchema.js';

const [email, password, name] = process.argv.slice(2);
if (!email || !password || !name) {
  console.error('Usage: node backend/scripts/createSuperadmin.js admin@example.com password "Admin Name"');
  process.exit(1);
}

await ensureSchema();
const hash = await bcrypt.hash(password, 12);
await query(
  `INSERT INTO users (full_name,email,password_hash,role,is_active,updated_at)
   VALUES ($1,$2,$3,'superadmin',TRUE,NOW())
   ON CONFLICT (email) DO UPDATE
   SET full_name=EXCLUDED.full_name,password_hash=EXCLUDED.password_hash,role='superadmin',is_active=TRUE,updated_at=NOW()`,
  [name, email.toLowerCase(), hash]
);
console.log(`Superadmin upserted for ${email.toLowerCase()}`);
