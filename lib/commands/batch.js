import fs from 'fs';
import chalk from 'chalk';
import { isConfigured } from '../config.js';
import CloudflareClient from '../cloudflare.js';
import { isValidImageBatchJson } from '../utils/validators.js';
import { uploadImageFromUrl } from '../upload-service.js';

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
    .option('-f, --force', 'Force upload even if URLs do not have image extensions')
    .action(async (file, options) => {
      await processBatch(file, options);
    });
}

function parsePositiveInteger(value, optionName) {
  const number = Number.parseInt(value, 10);
  if (!Number.isInteger(number) || number < 1 || String(number) !== String(value).trim()) {
    throw new Error(`${optionName} must be a positive integer.`);
  }

  return number;
}

async function runConcurrent(items, concurrency, worker) {
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      await worker(items[index], index);
    }
  });

  await Promise.all(workers);
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
    const concurrency = parsePositiveInteger(options.concurrency, 'Concurrency');

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
    console.log(chalk.blue(`Processing with concurrency ${concurrency}`));

    if (data.length === 0) {
      console.log(chalk.yellow('No images found in batch file.'));
      return;
    }

    const client = await CloudflareClient.create();
    const succeeded = [];
    const failed = [];

    await runConcurrent(data, concurrency, async (item, index) => {
      const label = `[${index + 1}/${data.length}] ${item.url}`;
      console.log(chalk.blue(`🔄 Uploading ${label}`));

      try {
        const result = await uploadImageFromUrl(item.url, {
          force: options.force,
          client
        });

        for (const warning of result.warnings) {
          console.warn(chalk.yellow(`Warning for ${item.url}: ${warning}`));
        }

        succeeded.push({
          item,
          image: result.image
        });
        console.log(chalk.green(`✅ Uploaded ${label}`));
      } catch (error) {
        failed.push({
          item,
          error
        });
        console.error(chalk.red(`❌ Failed ${label}: ${error.message}`));
      }
    });

    console.log(chalk.bold('\nBatch summary'));
    console.log(`Processed: ${data.length}`);
    console.log(chalk.green(`Succeeded: ${succeeded.length}`));
    console.log(failed.length > 0 ? chalk.red(`Failed: ${failed.length}`) : chalk.green('Failed: 0'));

    if (failed.length > 0) {
      console.log(chalk.red('\nFailed uploads:'));
      for (const failure of failed) {
        console.log(chalk.red(`- ${failure.item.url}: ${failure.error.message}`));
      }
      process.exitCode = 1;
    }
    
  } catch (error) {
    console.error(chalk.red(`\n❌ Error processing batch: ${error.message}`));
    process.exitCode = 1;
  }
}
