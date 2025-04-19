/**
 * Validates if the provided string is a valid URL
 * @param {string} url - The URL to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Validates if the provided string is a valid Cloudflare API token
 * @param {string} token - The token to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function isValidApiToken(token) {
  // Cloudflare API tokens are typically long alphanumeric strings
  return typeof token === 'string' && token.length >= 40;
}

/**
 * Validates if the provided string is a valid Cloudflare Account ID
 * @param {string} accountId - The account ID to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function isValidAccountId(accountId) {
  // Cloudflare Account IDs are 32 character hex strings
  return /^[a-f0-9]{32}$/i.test(accountId);
}

/**
 * Validates if the provided object is a valid JSON file with image URLs
 * @param {object} jsonData - The JSON data to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function isValidImageBatchJson(jsonData) {
  if (!Array.isArray(jsonData)) {
    return false;
  }
  
  // Check if each item has a URL property that's a valid URL
  return jsonData.every(item => {
    return typeof item === 'object' && 
           item !== null &&
           typeof item.url === 'string' &&
           isValidUrl(item.url);
  });
}

/**
 * Validates if the string is a valid image file extension
 * @param {string} url - The URL to check
 * @returns {boolean} True if it has a valid image extension
 */
export function hasImageExtension(url) {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    const extension = path.split('.').pop().toLowerCase();
    
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'];
    return validExtensions.includes(extension);
  } catch (error) {
    return false;
  }
}

/**
 * Validates if the provided string is a valid local file path with an image extension
 * @param {string} filePath - The file path to validate
 * @returns {boolean} True if valid image file path, false otherwise
 */
export function isValidImageFilePath(filePath) {
  if (typeof filePath !== 'string' || filePath.trim() === '') {
    return false;
  }
  
  const extension = filePath.split('.').pop().toLowerCase();
  const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'];
  return validExtensions.includes(extension);
}