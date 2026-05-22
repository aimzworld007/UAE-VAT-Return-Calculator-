import test from 'node:test';
import assert from 'node:assert/strict';

test('API 404 returns JSON', async (t) => {
  if (!process.env.DATABASE_URL) {
    t.skip('DATABASE_URL not configured');
    return;
  }

  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  const { ensureSchema } = await import('../../backend/db/ensureSchema.js');
  const { createApp } = await import('../../backend/server.js');
  await ensureSchema();

  const app = createApp();
  const server = app.listen(0);
  const port = server.address().port;
  const res = await fetch(`http://127.0.0.1:${port}/api/does-not-exist`);
  const text = await res.text();
  server.close();

  assert.equal(res.status, 404);
  assert.match(res.headers.get('content-type') || '', /application\/json/);
  assert.doesNotMatch(text.toLowerCase(), /<html/);
});
