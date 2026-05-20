import chalk from 'chalk';
import { isConfigured } from '../config.js';
import { formatImageDetails } from '../utils/formatters.js';
import { uploadImageFromUrl } from '../upload-service.js';

/**
 * Register the upload command
 * @param {object} program - Commander program instance
 */
export default function uploadCommand(program) {
  program
    .command('upload')
    .description('Upload a single image to Cloudflare Images')
    .argument('<url>', 'URL of the image to upload (use quotes for URLs with special characters)')
    .option('-f, --force', 'Force upload even if URL does not have an image extension')
    .option('-l, --local', 'Treat the input as a local file path instead of a URL')
    .action((url, options) => {
      if (options.local) {
        // Import local upload function on demand to avoid circular dependencies
        import('./upload-local.js').then(module => {
          const { uploadLocalImage } = module;
          return uploadLocalImage(url, options);
        })
        .then(() => {
          process.exitCode = 0;
        })
        .catch(err => {
          console.error(chalk.red(`Unhandled error: ${err.message}`));
          process.exitCode = 1;
        });
      } else {
        uploadImage(url, options)
          .then(() => {
            // Process completed successfully
            process.exitCode = 0;
          })
          .catch(err => {
            console.error(chalk.red(`Unhandled error: ${err.message}`));
            process.exitCode = 1;
          });
      }
    });
}

/**
 * Upload an image to Cloudflare Images
 * @param {string} url - URL of the image to upload
 * @param {object} options - Command options
 */
async function uploadImage(url, options = {}) {
  // Check if tool is configured
  if (!(await isConfigured())) {
    console.error(chalk.red('❌ ImgFlare is not configured. Run "imgflare setup" first.'));
    return;
  }
  
  try {
    console.log(chalk.blue('🔄 Uploading image...'));
    console.log(chalk.blue('🔍 Fetching image metadata...'));
    const result = await uploadImageFromUrl(url, options);

    for (const warning of result.warnings) {
      console.warn(chalk.yellow(`Warning: ${warning}`));
    }

    console.log(chalk.green('\n✅ Image uploaded successfully!'));
    console.log(formatImageDetails({
      ...result.image,
      uploaded_at: new Date().toISOString()
    }));
    
  } catch (error) {
    console.error(chalk.red(`\n❌ Error uploading image: ${error.message}`));
  }
}
