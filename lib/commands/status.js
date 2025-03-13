import chalk from 'chalk';
import { isConfigured } from '../config.js';
import { getImage } from '../database.js';
import { formatImageDetails } from '../utils/formatters.js';

/**
 * Register the status command
 * @param {object} program - Commander program instance
 */
export default function statusCommand(program) {
  program
    .command('status')
    .description('Check the status of image uploads')
    .argument('[image_id]', 'Image ID to check (optional, shows all pending if not provided)')
    .action(async (imageId) => {
      await checkStatus(imageId);
    });
}

/**
 * Check the status of image uploads
 * @param {string} imageId - Optional image ID to check
 */
async function checkStatus(imageId) {
  // Check if tool is configured
  if (!(await isConfigured())) {
    console.error(chalk.red('❌ ImgFlare is not configured. Run "imgflare setup" first.'));
    return;
  }
  
  try {
    if (imageId) {
      // Check status of a specific image
      const image = await getImage(imageId);
      
      if (!image) {
        console.error(chalk.red(`\n❌ Image not found with ID: ${imageId}`));
        return;
      }
      
      console.log(formatImageDetails(image));
    } else {
      console.log(chalk.yellow('Status checking for all images will be implemented in a future update.'));
    }
  } catch (error) {
    console.error(chalk.red(`\n❌ Error checking status: ${error.message}`));
  }
}