import { getConfig, setConfig, getAllConfig } from './database.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Config keys
export const CONFIG_KEYS = {
  API_TOKEN: 'cloudflare_api_token',
  ACCOUNT_ID: 'cloudflare_account_id',
  DELIVERY_URL: 'delivery_url_prefix'
};

// Create app data directory
const APP_DIR = path.join(os.homedir(), '.imgflare');
if (!fs.existsSync(APP_DIR)) {
  fs.mkdirSync(APP_DIR, { recursive: true });
}

/**
 * Get configuration value, with optional fallback to environment variable
 * @param {string} key - Config key to retrieve
 * @param {boolean} useEnv - Whether to fall back to environment variables
 * @returns {Promise<string|null>} The config value
 */
export async function getConfigValue(key, useEnv = true) {
  // Try to get from database
  const value = await getConfig(key);
  if (value !== null) {
    return value;
  }
  
  // Fall back to environment variable if enabled
  if (useEnv) {
    const envKey = `IMGFLARE_${key.toUpperCase()}`;
    if (process.env[envKey]) {
      return process.env[envKey];
    }
  }
  
  return null;
}

/**
 * Set configuration value
 * @param {string} key - Config key
 * @param {string} value - Config value
 * @param {string} description - Description of this config value
 * @returns {Promise<object>} The result of the database operation
 */
export async function setConfigValue(key, value, description = '') {
  return await setConfig(key, value, description);
}

/**
 * Get all configuration values
 * @returns {Promise<Array>} Array of config objects with key, value, and description
 */
export async function getAllConfigValues() {
  return await getAllConfig();
}

/**
 * Check if the tool is configured with necessary credentials
 * @returns {Promise<boolean>} True if configured, false otherwise
 */
export async function isConfigured() {
  const apiToken = await getConfigValue(CONFIG_KEYS.API_TOKEN);
  const accountId = await getConfigValue(CONFIG_KEYS.ACCOUNT_ID);
  
  return !!(apiToken && accountId);
}

/**
 * Get configuration for Cloudflare API
 * @returns {Promise<object|null>} Cloudflare configuration object or null if not configured
 */
export async function getCloudflareConfig() {
  if (!(await isConfigured())) {
    return null;
  }
  
  return {
    apiToken: await getConfigValue(CONFIG_KEYS.API_TOKEN),
    accountId: await getConfigValue(CONFIG_KEYS.ACCOUNT_ID),
    deliveryUrl: await getConfigValue(CONFIG_KEYS.DELIVERY_URL) || null
  };
}