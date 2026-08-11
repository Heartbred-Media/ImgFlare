import fetch from 'node-fetch';

export const DEFAULT_FETCH_TIMEOUT = 30000;
export const MAX_REMOTE_METADATA_BYTES = 10 * 1024 * 1024;

export async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_FETCH_TIMEOUT, readBody = false) {
  const controller = new globalThis.AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      size: readBody ? MAX_REMOTE_METADATA_BYTES : 0
    });

    const contentLength = Number(response.headers.get('content-length'));
    if (readBody && response.ok && Number.isFinite(contentLength) && contentLength > MAX_REMOTE_METADATA_BYTES) {
      throw new Error(`Image metadata download exceeds the ${MAX_REMOTE_METADATA_BYTES / (1024 * 1024)} MB limit`);
    }

    const buffer = readBody && response.ok
      ? await response.arrayBuffer()
      : null;

    if (buffer && buffer.byteLength > MAX_REMOTE_METADATA_BYTES) {
      throw new Error(`Image metadata download exceeds the ${MAX_REMOTE_METADATA_BYTES / (1024 * 1024)} MB limit`);
    }

    return { response, buffer };
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
