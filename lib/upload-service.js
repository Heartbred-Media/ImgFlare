import fetch from 'node-fetch';
import sizeOf from 'image-size';
import CloudflareClient from './cloudflare.js';
import { isValidUrl, hasImageExtension } from './utils/validators.js';
import { insertImage } from './database.js';

const DEFAULT_FETCH_TIMEOUT = 30000;

async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_FETCH_TIMEOUT, readBody = false) {
  const controller = new globalThis.AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    const buffer = readBody && response.ok
      ? await response.arrayBuffer()
      : null;

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

async function getRemoteImageMetadata(url, timeoutMs = DEFAULT_FETCH_TIMEOUT) {
  const metadata = {
    size: null,
    width: null,
    height: null,
    content_type: null
  };
  const warnings = [];

  try {
    const { response: headResponse } = await fetchWithTimeout(url, { method: 'HEAD' }, timeoutMs);
    if (!headResponse.ok) {
      return { metadata, warnings };
    }

    metadata.content_type = headResponse.headers.get('content-type');
    const contentLength = headResponse.headers.get('content-length');
    if (contentLength) {
      metadata.size = parseInt(contentLength, 10);
    }

    if (metadata.content_type && metadata.content_type.startsWith('image/')) {
      const { response, buffer } = await fetchWithTimeout(url, {}, timeoutMs, true);
      if (response.ok && buffer) {
        try {
          const dimensions = sizeOf(Buffer.from(buffer));
          if (dimensions) {
            metadata.width = dimensions.width;
            metadata.height = dimensions.height;
          }
        } catch (error) {
          warnings.push(`Could not determine image dimensions: ${error.message}`);
        }
      }
    }
  } catch (error) {
    warnings.push(`Could not fetch image metadata: ${error.message}`);
  }

  return { metadata, warnings };
}

/**
 * Upload an image URL to Cloudflare Images and store the result locally.
 * @param {string} url - URL of the image to upload
 * @param {object} options - Upload options
 * @param {boolean} options.force - Allow URLs without a recognized image extension
 * @param {CloudflareClient} options.client - Optional shared Cloudflare client
 * @param {number} options.fetchTimeout - Optional metadata fetch timeout in milliseconds
 * @returns {Promise<object>} Structured upload result
 */
export async function uploadImageFromUrl(url, options = {}) {
  if (!isValidUrl(url)) {
    throw new Error('Invalid URL format');
  }

  if (!hasImageExtension(url) && !options.force) {
    throw new Error('URL does not have a recognized image extension. Use --force if this is an image.');
  }

  const client = options.client || await CloudflareClient.create();
  const { metadata, warnings } = await getRemoteImageMetadata(url, options.fetchTimeout);

  const result = await client.uploadImage(url);
  if (!result.success) {
    throw new Error('Upload failed: ' + (result.errors?.[0]?.message || 'Unknown error'));
  }

  const imageData = result.result;
  const imageToStore = {
    id: imageData.id,
    original_url: url,
    cloudflare_url: client.getImageUrl(imageData.id, 'public'),
    status: 'complete',
    size: metadata.size,
    width: metadata.width,
    height: metadata.height,
    content_type: metadata.content_type,
    variants: imageData.variants ? JSON.stringify(imageData.variants) : null
  };

  await insertImage(imageToStore);

  return {
    ok: true,
    input: url,
    image: imageToStore,
    warnings
  };
}
