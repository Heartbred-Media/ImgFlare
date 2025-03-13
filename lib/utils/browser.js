import open from 'open';
import { isValidUrl } from './validators.js';

/**
 * Open a URL in the default browser
 * @param {string} url - The URL to open
 * @returns {Promise<void>}
 */
export async function openUrl(url) {
  if (!isValidUrl(url)) {
    throw new Error(`Invalid URL: ${url}`);
  }
  
  try {
    await open(url);
    return true;
  } catch (error) {
    throw new Error(`Failed to open URL: ${error.message}`);
  }
}

/**
 * Open an image in the browser
 * @param {string} url - The image URL
 * @param {string} type - The type of URL ('original' or 'cloudflare')
 * @returns {Promise<void>}
 */
export async function openImage(url, type) {
  if (!url) {
    throw new Error(`No ${type} URL available for this image`);
  }
  
  return openUrl(url);
}