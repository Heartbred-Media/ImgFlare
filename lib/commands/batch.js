import fs from 'fs';
import chalk from 'chalk';
import { isConfigured } from '../config.js';
import { isValidImageBatchJson } from '../utils/validators.js';

/**
 * Register the batch command
 * @param {object} program - Commander program instance
 */
export default function batchCommand(program) {
  program
    .command('batch')
    .description('Process a batch of images from a JSON file')
    .argument('<file>', 'Path to JSON file with image URLs')
    .option('-c, --concurrency <number>', 'Number of concurrent uploads', '3')
    .action(async (file, options) => {
      await processBatch(file, options);
    });
}

/**
 * Process a batch of images from a JSON file
 * @param {string} file - Path to JSON file
 * @param {object} options - Command options
 */
async function processBatch(file, options = {}) {
  // Check if tool is configured
  if (!(await isConfigured())) {
    console.error(chalk.red('❌ ImgFlare is not configured. Run "imgflare setup" first.'));
    return;
  }
  
  try {
    // Read JSON file
    console.log(chalk.blue(`🔄 Reading batch file: ${file}`));
    
    if (!fs.existsSync(file)) {
      throw new Error(`File not found: ${file}`);
    }
    
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    
    // Validate JSON data
    if (!isValidImageBatchJson(data)) {
      throw new Error('Invalid JSON format. Expected an array of objects with a "url" property.');
    }
    
    console.log(chalk.blue(`Found ${data.length} images to process`));
    console.log(chalk.yellow('Batch processing will be implemented in a future update.'));
    
  } catch (error) {
    console.error(chalk.red(`\n❌ Error processing batch: ${error.message}`));
  }
}