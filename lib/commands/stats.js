import chalk from 'chalk';
import { isConfigured } from '../config.js';

/**
 * Register the stats command
 * @param {object} program - Commander program instance
 */
export default function statsCommand(program) {
  program
    .command('stats')
    .description('Show statistics about uploaded images')
    .action(async () => {
      await showStats();
    });
}

/**
 * Show statistics about uploaded images
 */
async function showStats() {
  // Check if tool is configured
  if (!(await isConfigured())) {
    console.error(chalk.red('❌ ImgFlare is not configured. Run "imgflare setup" first.'));
    return;
  }
  
  try {
    console.log(chalk.blue('📊 ImgFlare Statistics'));
    console.log(chalk.yellow('Statistics will be implemented in a future update.'));
    
  } catch (error) {
    console.error(chalk.red(`\n❌ Error getting statistics: ${error.message}`));
  }
}