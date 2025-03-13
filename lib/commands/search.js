import chalk from 'chalk';
import { isConfigured } from '../config.js';

/**
 * Register the search command
 * @param {object} program - Commander program instance
 */
export default function searchCommand(program) {
  program
    .command('search')
    .description('Search for images by URL or metadata')
    .argument('<query>', 'Search query')
    .option('-l, --limit <number>', 'Limit the number of results', '10')
    .action(async (query, options) => {
      await searchImages(query, options);
    });
}

/**
 * Search for images by URL or metadata
 * @param {string} query - Search query
 * @param {object} options - Command options
 */
async function searchImages(query, options = {}) {
  // Check if tool is configured
  if (!(await isConfigured())) {
    console.error(chalk.red('❌ ImgFlare is not configured. Run "imgflare setup" first.'));
    return;
  }
  
  try {
    console.log(chalk.blue(`🔍 Searching for: ${query}`));
    console.log(chalk.yellow('Search functionality will be implemented in a future update.'));
    
  } catch (error) {
    console.error(chalk.red(`\n❌ Error searching images: ${error.message}`));
  }
}