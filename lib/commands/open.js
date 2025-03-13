import chalk from 'chalk';
import { isConfigured } from '../config.js';
import { getImage } from '../database.js';
import { openImage } from '../utils/browser.js';

/**
 * Register the open command
 * @param {object} program - Commander program instance
 */
export default function openCommand(program) {
  program
    .command('open')
    .description('Open an image in the default browser')
    .argument('<type>', 'Type of URL to open (original or cloudflare)')
    .argument('<image_id>', 'ID of the image to open')
    .action((type, imageId) => {
      openImageCommand(type, imageId)
        .then(() => {
          process.exitCode = 0;
        })
        .catch(err => {
          console.error(chalk.red(`Unhandled error: ${err.message}`));
          process.exitCode = 1;
        });
    });
}

/**
 * Open an image in the default browser
 * @param {string} type - Type of URL to open (original or cloudflare)
 * @param {string} imageId - ID of the image to open
 */
async function openImageCommand(type, imageId) {
  // Check if tool is configured
  if (!(await isConfigured())) {
    console.error(chalk.red('❌ ImgFlare is not configured. Run "imgflare setup" first.'));
    return;
  }
  
  // Validate type
  if (type !== 'original' && type !== 'cloudflare') {
    console.error(chalk.red('❌ Invalid type. Use "original" or "cloudflare".'));
    return;
  }
  
  try {
    // Get image from database
    const image = await getImage(imageId);
    
    if (!image) {
      console.error(chalk.red(`\n❌ Image not found with ID: ${imageId}`));
      return;
    }
    
    // Determine URL to open
    const url = type === 'original' ? image.original_url : image.cloudflare_url;
    
    if (!url) {
      console.error(chalk.red(`\n❌ No ${type} URL available for this image.`));
      return;
    }
    
    console.log(chalk.blue(`🔗 Opening ${type} image in browser...`));
    
    // Open URL in browser
    await openImage(url, type);
    
    console.log(chalk.green('✅ Browser opened successfully!'));
    
  } catch (error) {
    console.error(chalk.red(`\n❌ Error opening image: ${error.message}`));
  }
}