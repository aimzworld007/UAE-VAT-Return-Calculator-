import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../../backend/server.js';

test('API 404 returns JSON', async () => {
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
