import chalk from 'chalk';
import CloudflareClient from '../cloudflare.js';
import { isConfigured } from '../config.js';
import { isValidUrl, hasImageExtension } from '../utils/validators.js';
import { insertImage, updateImage } from '../database.js';
import { formatImageDetails } from '../utils/formatters.js';

/**
 * Register the upload command
 * @param {object} program - Commander program instance
 */
export default function uploadCommand(program) {
  program
    .command('upload')
    .description('Upload a single image to Cloudflare Images')
    .argument('<url>', 'URL of the image to upload')
    .option('-f, --force', 'Force upload even if URL does not have an image extension')
    .action(async (url, options) => {
      await uploadImage(url, options);
    });
}

/**
 * Upload an image to Cloudflare Images
 * @param {string} url - URL of the image to upload
 * @param {object} options - Command options
 */
async function uploadImage(url, options = {}) {
  // Validate URL
  if (!isValidUrl(url)) {
    console.error(chalk.red('❌ Invalid URL format'));
    return;
  }
  
  // Check if URL has an image extension
  if (!hasImageExtension(url) && !options.force) {
    console.error(chalk.yellow('⚠️ URL does not have a recognized image extension.'));
    console.error(chalk.yellow('If you are sure this is an image, use --force flag.'));
    return;
  }
  
  // Check if tool is configured
  if (!(await isConfigured())) {
    console.error(chalk.red('❌ ImgFlare is not configured. Run "imgflare setup" first.'));
    return;
  }
  
  try {
    console.log(chalk.blue('🔄 Uploading image...'));
    
    // Create Cloudflare client
    const client = await CloudflareClient.create();
    
    // Upload the image
    const result = await client.uploadImage(url);
    
    if (!result.success) {
      throw new Error('Upload failed: ' + (result.errors?.[0]?.message || 'Unknown error'));
    }
    
    const imageData = result.result;
    
    // Store in database
    await insertImage({
      id: imageData.id,
      original_url: url,
      cloudflare_url: client.getImageUrl(imageData.id),
      status: 'complete',
      size: imageData.size,
      width: imageData.meta?.width,
      height: imageData.meta?.height,
      content_type: imageData.meta?.content_type
    });
    
    console.log(chalk.green('\n✅ Image uploaded successfully!'));
    console.log(formatImageDetails({
      id: imageData.id,
      original_url: url,
      cloudflare_url: client.getImageUrl(imageData.id),
      status: 'complete',
      size: imageData.size,
      width: imageData.meta?.width,
      height: imageData.meta?.height,
      content_type: imageData.meta?.content_type,
      uploaded_at: new Date().toISOString()
    }));
    
  } catch (error) {
    console.error(chalk.red(`\n❌ Error uploading image: ${error.message}`));
  }
}