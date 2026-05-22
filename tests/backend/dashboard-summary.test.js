import assert from 'node:assert/strict';
import test from 'node:test';

test('dashboard summary returns JSON', async (t) => {
  if (!process.env.DATABASE_URL) {
    t.skip('DATABASE_URL not configured');
    return;
  }

  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

  const { ensureSchema } = await import('../../backend/db/ensureSchema.js');
  const { query } = await import('../../backend/db/query.js');
  const { createApp } = await import('../../backend/server.js');

  await ensureSchema();

  const email = `test-dashboard-${Date.now()}@example.com`;
  await query('DELETE FROM users WHERE email = $1', [email]);

  const app = createApp();
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const registerRes = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Dashboard User', email, password: 'Password123!' }),
    });
    const registerJson = await registerRes.json();
    const token = registerJson?.data?.token || registerJson?.data?.accessToken;

    const summaryRes = await fetch(`http://127.0.0.1:${port}/api/dashboard/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const text = await summaryRes.text();

    assert.equal(summaryRes.status, 200);
    assert.match(summaryRes.headers.get('content-type') || '', /application\/json/);
    assert.doesNotMatch(text.toLowerCase(), /<html/);

    const summaryJson = JSON.parse(text);
    assert.equal(summaryJson.success, true);
    assert.equal(typeof summaryJson.data?.totalVatRecords, 'number');
  } finally {
    server.close();
    await query('DELETE FROM users WHERE email = $1', [email]);
  }
});