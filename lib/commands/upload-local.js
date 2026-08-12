import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import CloudflareClient from '../cloudflare.js';
import { isConfigured } from '../config.js';
import { isValidImageFilePath, getUnsafeImageFormatReason } from '../utils/validators.js';
import { insertImage } from '../database.js';
import { formatImageDetails } from '../utils/formatters.js';

/**
 * Register the upload-local command
 * @param {object} program - Commander program instance
 */
export default function uploadLocalCommand(program) {
  program
    .command('upload-local')
    .description('Upload a local image file to Cloudflare Images')
    .argument('<file-path>', 'Path to the local image file')
    .option('-f, --force', 'Force upload even if file does not have an image extension')
    .action((filePath, options) => {
      uploadLocalImage(filePath, options)
        .then(() => {
          // Process completed successfully
          process.exitCode = 0;
        })
        .catch(err => {
          console.error(chalk.red(`Unhandled error: ${err.message}`));
          process.exitCode = 1;
        });
    });
}

/**
 * Upload a local image file to Cloudflare Images
 * @param {string} filePath - Path to the local image file
 * @param {object} options - Command options
 */
export async function uploadLocalImage(filePath, options = {}) {
  // Resolve to absolute path if relative
  const absolutePath = path.resolve(filePath);
  
  // Check if file exists
  if (!fs.existsSync(absolutePath)) {
    console.error(chalk.red(`❌ File not found: ${absolutePath}`));
    return;
  }
  
  // Check if file has an image extension
  if (!isValidImageFilePath(absolutePath) && !options.force) {
    console.error(chalk.yellow('⚠️ File does not have a recognized image extension.'));
    console.error(chalk.yellow('If you are sure this is an image, use --force flag.'));
    return;
  }
  
  // Check if tool is configured
  if (!options.client && !(await isConfigured())) {
    console.error(chalk.red('❌ ImgFlare is not configured. Run "imgflare setup" first.'));
    return;
  }
  
  try {
    console.log(chalk.blue(`🔄 Uploading image from ${filePath}...`));
    
    // Create Cloudflare client
    const client = options.client || await CloudflareClient.create();

    const imageBuffer = fs.readFileSync(absolutePath);
    const unsafeReason = getUnsafeImageFormatReason(imageBuffer);
    if (unsafeReason) {
      throw new Error(unsafeReason);
    }
    
    // Get file metadata
    console.log(chalk.blue('🔍 Reading image metadata...'));
    let imageMetadata = {
      size: imageBuffer.byteLength,
      width: null,
      height: null,
      content_type: null
    };
    
    // Upload the image
    const result = await client.uploadImageBuffer(imageBuffer, path.basename(absolutePath));
    
    if (!result.success) {
      throw new Error('Upload failed: ' + (result.errors?.[0]?.message || 'Unknown error'));
    }
    
    const imageData = result.result;
    
    // Get cloudflare URL
    let cloudflareUrl = client.getImageUrl(imageData.id, 'public');
    
    // Prepare image data with metadata if available
    const imageToStore = {
      id: imageData.id,
      original_url: `local://${absolutePath}`, // Use local:// prefix to indicate local file
      cloudflare_url: cloudflareUrl,
      status: 'complete',
      size: imageMetadata.size,
      width: imageMetadata.width,
      height: imageMetadata.height,
      content_type: imageMetadata.content_type,
      variants: imageData.variants ? JSON.stringify(imageData.variants) : null
    };
    
    // Store in database
    const storeImage = options.storeImage || insertImage;
    await storeImage(imageToStore);
    
    console.log(chalk.green('\n✅ Image uploaded successfully!'));
    console.log(formatImageDetails({
      ...imageToStore,
      uploaded_at: new Date().toISOString()
    }));
    
  } catch (error) {
    console.error(chalk.red(`\n❌ Error uploading image: ${error.message}`));
  }
}
