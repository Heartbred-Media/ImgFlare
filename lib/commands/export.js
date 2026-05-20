import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { isConfigured } from '../config.js';
import { getImages } from '../database.js';

const EXPORT_COLUMNS = [
  'id',
  'original_url',
  'cloudflare_url',
  'status',
  'size',
  'width',
  'height',
  'content_type',
  'uploaded_at',
  'error',
  'variants'
];

/**
 * Register the export command
 * @param {object} program - Commander program instance
 */
export default function exportCommand(program) {
  program
    .command('export')
    .description('Export image data to a file')
    .argument('<format>', 'Output format (json or csv)')
    .option('-f, --file <file>', 'Output file path')
    .option('-s, --status <status>', 'Filter by status (pending, complete, failed)')
    .action(async (format, options) => {
      await exportImages(format, options);
    });
}

/**
 * Export image data to a file
 * @param {string} format - Output format (json or csv)
 * @param {object} options - Command options
 */
async function exportImages(format, options = {}) {
  // Check if tool is configured
  if (!(await isConfigured())) {
    console.error(chalk.red('❌ ImgFlare is not configured. Run "imgflare setup" first.'));
    return;
  }
  
  // Validate format
  if (format !== 'json' && format !== 'csv') {
    console.error(chalk.red('❌ Invalid format. Use "json" or "csv".'));
    return;
  }
  
  try {
    console.log(chalk.blue(`📤 Exporting image data as ${format.toUpperCase()}`));
    const filters = {};
    if (options.status) {
      filters.status = options.status;
    }

    const images = await getImages(filters);
    const outputFile = options.file || getDefaultExportFile(format);
    const outputPath = path.resolve(outputFile);
    const outputDir = path.dirname(outputPath);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const contents = format === 'json'
      ? formatJson(images)
      : formatCsv(images);

    fs.writeFileSync(outputPath, contents, 'utf8');

    console.log(chalk.green(`✅ Exported ${images.length} images to ${outputPath}`));
    
  } catch (error) {
    console.error(chalk.red(`\n❌ Error exporting images: ${error.message}`));
    process.exitCode = 1;
  }
}

function getDefaultExportFile(format) {
  const date = new Date().toISOString().slice(0, 10);
  return `imgflare-export-${date}.${format}`;
}

function normalizeValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
}

function escapeCsvValue(value) {
  const normalized = normalizeValue(value);
  if (/[",\n\r]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }

  return normalized;
}

function formatCsv(images) {
  const header = EXPORT_COLUMNS.join(',');
  const rows = images.map(image => {
    return EXPORT_COLUMNS
      .map(column => escapeCsvValue(image[column]))
      .join(',');
  });

  return [header, ...rows].join('\n') + '\n';
}

function formatJson(images) {
  return JSON.stringify(images, null, 2) + '\n';
}
