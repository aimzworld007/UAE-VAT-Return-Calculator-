import assert from 'node:assert/strict';
import test from 'node:test';

const baseHeaders = { 'Content-Type': 'application/json' };

test('auth register/login supports auto-login and duplicate email protection', async (t) => {
  if (!process.env.DATABASE_URL) {
    t.skip('DATABASE_URL not configured');
    return;
  }

  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

  const { ensureSchema } = await import('../../backend/db/ensureSchema.js');
  const { query } = await import('../../backend/db/query.js');
  const { createApp } = await import('../../backend/server.js');

  await ensureSchema();

  const email = `test-auth-${Date.now()}@example.com`;
  await query('DELETE FROM users WHERE email = $1', [email]);

  const app = createApp();
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const registerRes = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: 'POST',
      headers: baseHeaders,
      body: JSON.stringify({ name: 'Test User', email, password: 'Password123!' }),
    });
    const registerJson = await registerRes.json();

    assert.equal(registerRes.status, 201);
    assert.equal(registerJson.success, true);
    assert.ok(registerJson.data?.token || registerJson.data?.accessToken);
    assert.equal(registerJson.data?.user?.email, email);

    const duplicateRes = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: 'POST',
      headers: baseHeaders,
      body: JSON.stringify({ name: 'Test User', email, password: 'Password123!' }),
    });
    const duplicateJson = await duplicateRes.json();

    assert.equal(duplicateRes.status, 409);
    assert.equal(duplicateJson.success, false);

    const loginRes = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: 'POST',
      headers: baseHeaders,
      body: JSON.stringify({ email, password: 'Password123!' }),
    });
    const loginJson = await loginRes.json();

    assert.equal(loginRes.status, 200);
    assert.equal(loginJson.success, true);
    assert.ok(loginJson.data?.token || loginJson.data?.accessToken);
  } finally {
    server.close();
    await query('DELETE FROM users WHERE email = $1', [email]);
  }
});