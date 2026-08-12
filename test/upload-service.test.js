import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fetchWithTimeout, MAX_REMOTE_METADATA_BYTES } from '../lib/utils/fetch.js';
import { getRemoteImageMetadata, uploadImageFromUrl } from '../lib/upload-service.js';
import { uploadLocalImage } from '../lib/commands/upload-local.js';

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

test('fetches and returns the exact body even when HEAD does not identify an image', async () => {
  const expected = Buffer.from('safe image bytes');
  const server = http.createServer((request, response) => {
    if (request.method === 'HEAD') {
      response.writeHead(200, { 'content-type': 'application/octet-stream' });
      response.end();
      return;
    }

    response.writeHead(200, { 'content-type': 'image/png' });
    response.end(expected);
  });

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  try {
    const result = await getRemoteImageMetadata(`http://127.0.0.1:${port}/image.png`);
    assert.deepEqual(result.imageBuffer, expected);
    assert.equal(result.metadata.content_type, 'image/png');
    assert.equal(result.metadata.size, expected.byteLength);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});

test('rejects unsafe remote bytes before handing them to the upload client', async () => {
  const unsafeIcns = Buffer.concat([Buffer.from('icns'), Buffer.alloc(12)]);
  const server = http.createServer((request, response) => {
    response.writeHead(200, { 'content-type': 'image/png' });
    response.end(request.method === 'HEAD' ? undefined : unsafeIcns);
  });

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  let uploadCalled = false;
  const client = {
    uploadImageBuffer: async () => {
      uploadCalled = true;
      return { success: true, result: {} };
    }
  };

  try {
    await assert.rejects(
      uploadImageFromUrl(`http://127.0.0.1:${port}/image.png`, { client }),
      /ICNS files are not supported/
    );
    assert.equal(uploadCalled, false);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});

test('uploads the exact remote bytes that were validated', async () => {
  const expected = Buffer.from('safe remote image bytes');
  const server = http.createServer((request, response) => {
    response.writeHead(200, { 'content-type': 'image/png' });
    response.end(request.method === 'HEAD' ? undefined : expected);
  });

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  let uploadedBuffer;
  const client = {
    uploadImageBuffer: async buffer => {
      uploadedBuffer = buffer;
      return { success: true, result: { id: 'remote-id', variants: [] } };
    },
    getImageUrl: () => 'https://example.test/remote-id/public'
  };

  try {
    await uploadImageFromUrl(`http://127.0.0.1:${port}/image.png`, {
      client,
      storeImage: async () => {}
    });
    assert.deepEqual(uploadedBuffer, expected);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});

test('uploads the exact local bytes that were validated', async () => {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'imgflare-security-'));
  const imagePath = path.join(temporaryDirectory, 'image.png');
  const expected = Buffer.from('safe local image bytes');
  fs.writeFileSync(imagePath, expected);
  let uploadedBuffer;
  const client = {
    uploadImageBuffer: async buffer => {
      uploadedBuffer = buffer;
      return { success: true, result: { id: 'local-id', variants: [] } };
    },
    getImageUrl: () => 'https://example.test/local-id/public'
  };

  try {
    await uploadLocalImage(imagePath, { client, storeImage: async () => {} });
    assert.deepEqual(uploadedBuffer, expected);
  } finally {
    fs.rmSync(temporaryDirectory, { recursive: true });
  }
});
