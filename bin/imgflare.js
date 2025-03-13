#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';

// Import command modules
import setupCommand from '../lib/commands/setup.js';
import uploadCommand from '../lib/commands/upload.js';
import batchCommand from '../lib/commands/batch.js';
import statusCommand from '../lib/commands/status.js';
import statsCommand from '../lib/commands/stats.js';
import listCommand from '../lib/commands/list.js';
import searchCommand from '../lib/commands/search.js';
import openCommand from '../lib/commands/open.js';
import exportCommand from '../lib/commands/export.js';

// Set up CLI program
program
  .name('imgflare')
  .description('Cloudflare Images migration and management tool')
  .version('1.0.0');

// Register commands
setupCommand(program);
uploadCommand(program);
batchCommand(program);
statusCommand(program);
statsCommand(program);
listCommand(program);
searchCommand(program);
openCommand(program);
exportCommand(program);

// Handle errors
program.showHelpAfterError('(add --help for additional information)');

// Parse arguments
program.parse();

// If no arguments provided, show help
if (process.argv.length <= 2) {
  console.log(chalk.blue('🔥 ImgFlare - Cloudflare Images Migration Tool'));
  program.help();
}