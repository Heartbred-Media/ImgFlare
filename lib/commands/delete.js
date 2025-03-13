import chalk from 'chalk';
import { promisify } from 'util';
import CloudflareClient from '../cloudflare.js';
import { isConfigured } from '../config.js';
import { getImage, updateImage } from '../database.js';
import { formatImageDetails } from '../utils/formatters.js';

/**
 * Register the delete command
 * @param {object} program - Commander program instance
 */
export default function deleteCommand(program) {
  program
    .command('delete')
    .description('Delete an image from Cloudflare Images')
    .argument('<image_id>', 'ID of the image to delete')
    .option('-f, --force', 'Force delete without confirmation')
    .option('-k, --keep-record', 'Keep the database record after deletion')
    .action((imageId, options) => {
      deleteImage(imageId, options)
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
 * Delete an image from Cloudflare Images
 * @param {string} imageId - ID of the image to delete
 * @param {object} options - Command options
 */
async function deleteImage(imageId, options = {}) {
  // Check if tool is configured
  if (!(await isConfigured())) {
    console.error(chalk.red('❌ ImgFlare is not configured. Run "imgflare setup" first.'));
    return;
  }
  
  try {
    // Get image from database
    const image = await getImage(imageId);
    
    if (!image) {
      console.error(chalk.red(`\n❌ Image not found with ID: ${imageId}`));
      return;
    }
    
    // Display image details
    console.log(chalk.blue('Image to delete:'));
    console.log(formatImageDetails(image));
    
    // Confirm deletion if not forced
    if (!options.force) {
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        readline.question(chalk.yellow('\nAre you sure you want to delete this image? (y/N) '), resolve);
      });
      
      readline.close();
      
      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log(chalk.green('Deletion cancelled.'));
        return;
      }
    }
    
    // Create Cloudflare client
    const client = await CloudflareClient.create();
    
    // Delete the image
    console.log(chalk.blue('🗑️ Deleting image from Cloudflare...'));
    
    const result = await client.deleteImage(imageId);
    
    if (!result.success) {
      throw new Error('Deletion failed: ' + (result.errors?.[0]?.message || 'Unknown error'));
    }
    
    // Update database record
    if (options.keepRecord) {
      // Mark as deleted but keep record
      await updateImage(imageId, { status: 'deleted' });
      console.log(chalk.green('\n✅ Image deleted from Cloudflare. Database record kept and marked as deleted.'));
    } else {
      // Delete from database
      const db = await import('../database.js');
      const run = promisify(db.default.run.bind(db.default));
      await run('DELETE FROM images WHERE id = ?', [imageId]);
      
      console.log(chalk.green('\n✅ Image completely deleted from Cloudflare and local database.'));
    }
  } catch (error) {
    console.error(chalk.red(`\n❌ Error deleting image: ${error.message}`));
  }
}