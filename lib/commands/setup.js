import inquirer from 'inquirer';
import chalk from 'chalk';
import { setConfigValue, getConfigValue, CONFIG_KEYS } from '../config.js';
import { isValidApiToken, isValidAccountId, isValidUrl } from '../utils/validators.js';

/**
 * Register the setup command
 * @param {object} program - Commander program instance
 */
export default function setupCommand(program) {
  program
    .command('setup')
    .description('Configure ImgFlare with your Cloudflare credentials')
    .option('-f, --force', 'Force setup even if already configured')
    .action(async (options) => {
      await setupWizard(options);
    });
}

/**
 * Interactive setup wizard
 * @param {object} options - Command options
 */
async function setupWizard(options = {}) {
  console.log(chalk.blue('🔥 ImgFlare Setup Wizard'));
  console.log(chalk.gray('This will configure ImgFlare with your Cloudflare credentials.\n'));
  
  // Check if already configured
  const apiToken = await getConfigValue(CONFIG_KEYS.API_TOKEN);
  const accountId = await getConfigValue(CONFIG_KEYS.ACCOUNT_ID);
  
  if (apiToken && accountId && !options.force) {
    console.log(chalk.yellow('ImgFlare is already configured.'));
    
    const { reconfigure } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'reconfigure',
        message: 'Do you want to reconfigure?',
        default: false
      }
    ]);
    
    if (!reconfigure) {
      console.log(chalk.green('Setup canceled. Your existing configuration is still in place.'));
      return;
    }
  }
  
  // Get Cloudflare credentials
  const answers = await inquirer.prompt([
    {
      type: 'password',
      name: 'apiToken',
      message: 'Enter your Cloudflare API token:',
      validate: (input) => {
        if (!input) return 'API token is required';
        if (!isValidApiToken(input)) return 'Invalid API token format';
        return true;
      }
    },
    {
      type: 'input',
      name: 'accountId',
      message: 'Enter your Cloudflare Account ID:',
      validate: (input) => {
        if (!input) return 'Account ID is required';
        if (!isValidAccountId(input)) return 'Invalid Account ID format. It should be a 32-character hexadecimal string.';
        return true;
      }
    },
    {
      type: 'input',
      name: 'deliveryUrl',
      message: 'Enter your Cloudflare Images delivery URL (optional):',
      validate: (input) => {
        if (!input) return true; // Optional
        if (!isValidUrl(input)) return 'Invalid URL format';
        return true;
      }
    }
  ]);
  
  // Save configuration
  try {
    await setConfigValue(
      CONFIG_KEYS.API_TOKEN, 
      answers.apiToken, 
      'Cloudflare API token for authentication'
    );
    
    await setConfigValue(
      CONFIG_KEYS.ACCOUNT_ID, 
      answers.accountId, 
      'Cloudflare Account ID for API requests'
    );
    
    if (answers.deliveryUrl) {
      await setConfigValue(
        CONFIG_KEYS.DELIVERY_URL, 
        answers.deliveryUrl, 
        'URL prefix for Cloudflare Images delivery'
      );
    }
    
    console.log(chalk.green('\n✅ ImgFlare has been successfully configured!'));
    console.log('You can now use ImgFlare to upload and manage images on Cloudflare.');
    console.log(chalk.gray('\nTry running: imgflare upload <image-url>'));
  } catch (error) {
    console.error(chalk.red(`\n❌ Error saving configuration: ${error.message}`));
  }
}