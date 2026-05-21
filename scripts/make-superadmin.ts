import { query } from '../backend/db/query.js';

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase() ?? process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();

  if (!email) {
    console.error('SUPER_ADMIN_EMAIL (or SUPERADMIN_EMAIL) is required.');
    process.exitCode = 1;
    return;
  }

  const existing = await query('SELECT id, role FROM users WHERE email = $1 LIMIT 1', [email]);
  const user = existing.rows[0];

  if (!user) {
    console.error(`No user found for ${email}. Create the user first.`);
    process.exitCode = 1;
    return;
  }

  if (user.role === 'SUPER_ADMIN') {
    console.log(`User ${email} is already SUPER_ADMIN.`);
    return;
  }

  await query('UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2', ['SUPER_ADMIN', user.id]);
  console.log(`User ${email} promoted to SUPER_ADMIN.`);
}

main().catch((error) => {
  console.error('Failed to promote super admin.', error);
  process.exitCode = 1;
});
