import chalk from 'chalk';

/**
 * Format filesize in a human-readable way
 * @param {number} bytes - The size in bytes
 * @returns {string} Formatted size (e.g., "1.5 MB")
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  if (bytes === undefined || bytes === null) return 'Unknown';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format a date string in a user-friendly way
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
export function formatDate(dateString) {
  if (!dateString) return 'Unknown';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  return date.toLocaleString();
}

/**
 * Format image status with colors
 * @param {string} status - The image status
 * @returns {string} Colorized status text
 */
export function formatStatus(status) {
  if (!status) return chalk.gray('Unknown');
  
  switch (status.toLowerCase()) {
    case 'pending':
      return chalk.yellow('Pending');
    case 'uploading':
      return chalk.blue('Uploading');
    case 'processing':
      return chalk.blue('Processing');
    case 'complete':
    case 'success':
      return chalk.green('Complete');
    case 'failed':
    case 'error':
      return chalk.red('Failed');
    default:
      return chalk.white(status);
  }
}

/**
 * Format image details for display
 * @param {object} image - The image object
 * @returns {string} Formatted image details
 */
export function formatImageDetails(image) {
  if (!image) return 'Image not found';
  
  const lines = [
    `ID: ${chalk.cyan(image.id)}`,
    `Original URL: ${image.original_url}`,
    `Status: ${formatStatus(image.status)}`,
    `Size: ${formatFileSize(image.size)}`,
    `Dimensions: ${image.width || '?'}x${image.height || '?'}`,
    `Type: ${image.content_type || 'Unknown'}`,
    `Uploaded: ${formatDate(image.uploaded_at)}`
  ];
  
  if (image.cloudflare_url) {
    lines.push(`Cloudflare URL: ${image.cloudflare_url}`);
  }
  
  if (image.error) {
    lines.push(`Error: ${chalk.red(image.error)}`);
  }
  
  return lines.join('\n');
}

/**
 * Format list of images for display in a table
 * @param {Array} images - Array of image objects
 * @returns {Array} Array ready for console.table
 */
export function formatImagesTable(images) {
  if (!images || !images.length) {
    return [];
  }
  
  return images.map(img => ({
    ID: img.id,
    Status: formatStatus(img.status),
    Size: formatFileSize(img.size),
    Uploaded: formatDate(img.uploaded_at)
  }));
}