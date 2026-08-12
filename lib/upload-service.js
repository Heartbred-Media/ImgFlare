import path from 'node:path';
import CloudflareClient from './cloudflare.js';
import { isValidUrl, hasImageExtension, getUnsafeImageFormatReason } from './utils/validators.js';
import { insertImage } from './database.js';
import { DEFAULT_FETCH_TIMEOUT, fetchWithTimeout } from './utils/fetch.js';

export async function getRemoteImageMetadata(url, timeoutMs = DEFAULT_FETCH_TIMEOUT) {
  const metadata = {
    size: null,
    width: null,
    height: null,
    content_type: null
  };
  const warnings = [];
  let imageBuffer = null;

  try {
    const { response: headResponse } = await fetchWithTimeout(url, { method: 'HEAD' }, timeoutMs);
    if (headResponse.ok) {
      metadata.content_type = headResponse.headers.get('content-type');
      const contentLength = headResponse.headers.get('content-length');
      if (contentLength) {
        metadata.size = parseInt(contentLength, 10);
      }
    }

    const { response, buffer } = await fetchWithTimeout(url, {}, timeoutMs, true);
    if (!response.ok || !buffer) {
      throw new Error(`Image download failed with status ${response.status}`);
    }

    imageBuffer = Buffer.from(buffer);
    metadata.size = imageBuffer.byteLength;
    metadata.content_type = response.headers.get('content-type') || metadata.content_type;
  } catch (error) {
    throw new Error(`Could not safely fetch image: ${error.message}`);
  }

  return { metadata, warnings, imageBuffer };
}

/**
 * Upload an image URL to Cloudflare Images and store the result locally.
 * @param {string} url - URL of the image to upload
 * @param {object} options - Upload options
 * @param {boolean} options.force - Allow URLs without a recognized image extension
 * @param {CloudflareClient} options.client - Optional shared Cloudflare client
 * @param {Function} options.storeImage - Optional image-record writer for testing
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
  const { metadata, warnings, imageBuffer } = await getRemoteImageMetadata(url, options.fetchTimeout);
  const unsafeReason = getUnsafeImageFormatReason(imageBuffer);
  if (unsafeReason) {
    throw new Error(unsafeReason);
  }

  const fileName = path.basename(new URL(url).pathname) || 'image';
  const result = await client.uploadImageBuffer(imageBuffer, fileName);
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

  const storeImage = options.storeImage || insertImage;
  await storeImage(imageToStore);

  return {
    ok: true,
    input: url,
    image: imageToStore,
    warnings
  };
}
