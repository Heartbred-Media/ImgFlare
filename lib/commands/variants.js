import chalk from 'chalk';
import { isConfigured } from '../config.js';
import { getImage } from '../database.js';

/**
 * Register the variants command
 * @param {object} program - Commander program instance
 */
export default function variantsCommand(program) {
  program
    .command('variants')
    .description('Show available variants for an image')
    .argument('<image_id>', 'ID of the image to check')
    .option('-c, --copy', 'Format output for easy copying')
    .action((imageId, options) => {
      showVariants(imageId, options)
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
 * Show available variants for an image
 * @param {string} imageId - ID of the image to check
 * @param {object} options - Command options
 */
async function showVariants(imageId, options = {}) {
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
    
    // Check if image has variants stored
    if (!image.variants) {
      console.log(chalk.yellow(`No variant information stored for image: ${imageId}`));
      
      // Show existing cloudflare URL
      if (image.cloudflare_url) {
        console.log('\nDefault URL:');
        console.log(image.cloudflare_url);
      }
      return;
    }
    
    // Parse variants from JSON
    let variants;
    try {
      variants = JSON.parse(image.variants);
    } catch (err) {
      console.error(chalk.red(`Error parsing variants data: ${err.message}`));
      return;
    }
    
    // Display variants
    if (options.copy) {
      // Simple format for copying
      console.log(variants.join('\n'));
    } else {
      // Pretty display
      console.log(chalk.blue(`\n🖼️  Available variants for image: ${chalk.cyan(imageId)}`));
      console.log(chalk.gray('Original URL:'), image.original_url);
      
      variants.forEach((variant, index) => {
        // Extract variant name from URL
        const variantName = variant.split('/').pop();
        console.log(`\n${chalk.cyan(index + 1)}. ${chalk.yellow(variantName)}`);
        console.log(variant);
      });
    }
  } catch (error) {
    console.error(chalk.red(`\n❌ Error retrieving variants: ${error.message}`));
  }
}