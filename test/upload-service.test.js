import assert from 'node:assert/strict';
import http from 'node:http';
import test from 'node:test';
import { fetchWithTimeout, MAX_REMOTE_METADATA_BYTES } from '../lib/utils/fetch.js';

test('rejects an oversized chunked metadata response while reading it', async () => {
  const server = http.createServer((request, response) => {
    response.writeHead(200, { 'content-type': 'image/png' });

    if (request.method !== 'HEAD') {
      response.end(Buffer.alloc(MAX_REMOTE_METADATA_BYTES + 1));
      return;
    }

    response.end();
  });

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  try {
    await assert.rejects(
      fetchWithTimeout(`http://127.0.0.1:${port}/image.png`, {}, undefined, true),
      /content size.*over limit/i
    );
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
