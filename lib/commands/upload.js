import chalk from 'chalk';
import fetch from 'node-fetch';
import sizeOf from 'image-size';
import { Readable } from 'stream';
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
    .argument('<url>', 'URL of the image to upload (use quotes for URLs with special characters)')
    .option('-f, --force', 'Force upload even if URL does not have an image extension')
    .action((url, options) => {
      uploadImage(url, options)
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
    
    // First, fetch the image to get its metadata
    console.log(chalk.blue('🔍 Fetching image metadata...'));
    let imageMetadata = {
      size: null,
      width: null,
      height: null,
      content_type: null
    };
    
    try {
      // First, try HEAD request to get content-type and size
      const headResponse = await fetch(url, { method: 'HEAD' });
      if (headResponse.ok) {
        // Get content type and size from headers
        imageMetadata.content_type = headResponse.headers.get('content-type');
        const contentLength = headResponse.headers.get('content-length');
        if (contentLength) {
          imageMetadata.size = parseInt(contentLength, 10);
        }
        
        // If it's an image content type, fetch the full image to get dimensions
        if (imageMetadata.content_type && imageMetadata.content_type.startsWith('image/')) {
          const response = await fetch(url);
          if (response.ok) {
            // Read the image data
            const buffer = await response.arrayBuffer();
            try {
              // Get image dimensions
              const dimensions = sizeOf(Buffer.from(buffer));
              if (dimensions) {
                imageMetadata.width = dimensions.width;
                imageMetadata.height = dimensions.height;
              }
            } catch (dimError) {
              console.warn(chalk.yellow(`Warning: Could not determine image dimensions: ${dimError.message}`));
            }
          }
        }
      }
    } catch (error) {
      console.warn(chalk.yellow(`Warning: Could not fetch image metadata: ${error.message}`));
    }
    
    // Upload the image
    const result = await client.uploadImage(url);
    
    if (!result.success) {
      throw new Error('Upload failed: ' + (result.errors?.[0]?.message || 'Unknown error'));
    }
    
    const imageData = result.result;
    
    // Get cloudflare URL
    let cloudflareUrl = `https://imagedelivery.net/${client.accountId}/${imageData.id}/public`;
    
    // Fetch image details to get metadata
    console.log(chalk.blue('🔍 Fetching image details...'));
    let imageDetails;
    try {
      const detailsResult = await client.getImage(imageData.id);
      if (detailsResult.success) {
        imageDetails = detailsResult.result;
      }
    } catch (error) {
      console.warn(chalk.yellow(`Warning: Could not fetch image details: ${error.message}`));
    }
    
    // Note: Cloudflare API doesn't provide size, dimensions, or content type in its responses
    
    // Prepare image data with metadata if available
    const imageToStore = {
      id: imageData.id,
      original_url: url,
      cloudflare_url: cloudflareUrl,
      status: 'complete',
      size: imageMetadata.size,
      width: imageMetadata.width,
      height: imageMetadata.height,
      content_type: imageMetadata.content_type,
      variants: imageData.variants ? JSON.stringify(imageData.variants) : null
    };
    
    // Store in database
    await insertImage(imageToStore);
    
    console.log(chalk.green('\n✅ Image uploaded successfully!'));
    console.log(formatImageDetails({
      ...imageToStore,
      uploaded_at: new Date().toISOString()
    }));
    
  } catch (error) {
    console.error(chalk.red(`\n❌ Error uploading image: ${error.message}`));
  }
}