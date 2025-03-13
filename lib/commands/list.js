import chalk from 'chalk';
import { isConfigured } from '../config.js';
import { getImages } from '../database.js';
import { formatImagesTable } from '../utils/formatters.js';

/**
 * Register the list command
 * @param {object} program - Commander program instance
 */
export default function listCommand(program) {
  program
    .command('list')
    .description('List uploaded images with optional filtering')
    .option('-s, --status <status>', 'Filter by status (pending, complete, failed)')
    .option('-l, --limit <number>', 'Limit the number of results', '10')
    .option('-o, --order <order>', 'Sort order (asc or desc)', 'desc')
    .action((options) => {
      listImages(options)
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
 * List uploaded images with optional filtering
 * @param {object} options - Command options
 */
async function listImages(options = {}) {
  // Check if tool is configured
  if (!(await isConfigured())) {
    console.error(chalk.red('❌ ImgFlare is not configured. Run "imgflare setup" first.'));
    return;
  }
  
  try {
    // Parse options
    const filters = {
      status: options.status,
      limit: options.limit ? parseInt(options.limit, 10) : 10,
      order: options.order || 'desc',
      orderBy: 'uploaded_at'
    };
    
    // Get images from database
    const images = await getImages(filters);
    
    if (images.length === 0) {
      console.log(chalk.yellow('No images found with the specified filters.'));
      return;
    }
    
    // Format and display results
    console.log(chalk.blue(`📋 Listing ${images.length} images:`));
    console.table(formatImagesTable(images));
    
  } catch (error) {
    console.error(chalk.red(`\n❌ Error listing images: ${error.message}`));
  }
}