import assert from 'node:assert/strict';
import test from 'node:test';

async function registerAndGetToken(port, name, email) {
  const res = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password: 'Password123!' }),
  });
  const json = await res.json();
  return {
    token: json?.data?.token || json?.data?.accessToken,
    userId: json?.data?.user?.id,
  };
}

test('VAT record CRUD enforces ownership authorization', async (t) => {
  if (!process.env.DATABASE_URL) {
    t.skip('DATABASE_URL not configured');
    return;
  }

  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

  const { ensureSchema } = await import('../../backend/db/ensureSchema.js');
  const { query } = await import('../../backend/db/query.js');
  const { createApp } = await import('../../backend/server.js');

  await ensureSchema();

  const emailA = `test-vat-a-${Date.now()}@example.com`;
  const emailB = `test-vat-b-${Date.now()}@example.com`;
  await query('DELETE FROM users WHERE email = ANY($1::citext[])', [[emailA, emailB]]);

  const app = createApp();
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const userA = await registerAndGetToken(port, 'User A', emailA);
    const userB = await registerAndGetToken(port, 'User B', emailB);

    const createRes = await fetch(`http://127.0.0.1:${port}/api/vat-records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userA.token}`,
      },
      body: JSON.stringify({
        periodType: 'Quarterly',
        periodStart: '2026-01-01',
        periodEnd: '2026-03-31',
        taxableSales: 10000,
        taxablePurchases: 3000,
        outputVat: 500,
        inputVat: 150,
        payableVat: 350,
        status: 'draft',
        payload: { sample: true },
      }),
    });

    const createJson = await createRes.json();
    assert.equal(createRes.status, 201);
    const recordId = createJson?.data?.id;

    const ownRead = await fetch(`http://127.0.0.1:${port}/api/vat-records/${recordId}`, {
      headers: { Authorization: `Bearer ${userA.token}` },
    });
    assert.equal(ownRead.status, 200);

    const otherRead = await fetch(`http://127.0.0.1:${port}/api/vat-records/${recordId}`, {
      headers: { Authorization: `Bearer ${userB.token}` },
    });
    assert.notEqual(otherRead.status, 200);

    const otherDelete = await fetch(`http://127.0.0.1:${port}/api/vat-records/${recordId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userB.token}` },
    });
    assert.equal(otherDelete.status, 403);

    const ownDelete = await fetch(`http://127.0.0.1:${port}/api/vat-records/${recordId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userA.token}` },
    });
    assert.equal(ownDelete.status, 200);
  } finally {
    server.close();
    await query('DELETE FROM users WHERE email = ANY($1::citext[])', [[emailA, emailB]]);
  }
});