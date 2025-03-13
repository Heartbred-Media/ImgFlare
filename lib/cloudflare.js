import fetch from 'node-fetch';
import FormData from 'form-data';
import { getCloudflareConfig } from './config.js';

// Base API URLs
const API_BASE = 'https://api.cloudflare.com/client/v4';

/**
 * Cloudflare Images API client
 */
export default class CloudflareClient {
  /**
   * Create a new Cloudflare client
   */
  constructor(config) {
    this.apiToken = config?.apiToken;
    this.accountId = config?.accountId;
    this.deliveryUrl = config?.deliveryUrl;
    
    if (!this.apiToken || !this.accountId) {
      throw new Error('Cloudflare configuration not found. Run "imgflare setup" first.');
    }
  }
  
  /**
   * Create a CloudflareClient from configuration
   * @returns {Promise<CloudflareClient>} A new client instance
   */
  static async create() {
    const config = await getCloudflareConfig();
    if (!config) {
      throw new Error('Cloudflare configuration not found. Run "imgflare setup" first.');
    }
    
    return new CloudflareClient(config);
  }
  
  /**
   * Helper to make authenticated API requests
   * @param {string} endpoint - API endpoint
   * @param {object} options - Fetch options
   * @returns {Promise<object>} The API response
   */
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    
    const headers = {
      'Authorization': `Bearer ${this.apiToken}`,
      ...options.headers
    };
    
    try {
      const response = await fetch(url, {
        ...options,
        headers
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.errors?.[0]?.message || `API error: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      throw new Error(`Cloudflare API request failed: ${error.message}`);
    }
  }
  
  /**
   * Upload an image to Cloudflare Images
   * @param {string} imageUrl - The URL of the image to upload
   * @returns {Promise<object>} The upload result
   */
  async uploadImage(imageUrl) {
    const form = new FormData();
    form.append('url', imageUrl);
    
    // Create a plain object from the formData headers
    const formHeaders = form.getHeaders ? form.getHeaders() : {};
    
    const url = `${API_BASE}/accounts/${this.accountId}/images/v1`;
    
    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          ...formHeaders
        },
        body: form
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.errors?.[0]?.message || `API error: ${response.status}`);
      }
      
      // Explicitly close and destroy form data to avoid hanging connections
      if (typeof form.destroy === 'function') {
        form.destroy();
      }
      
      return data;
    } catch (error) {
      // Explicitly close and destroy form data in case of error
      if (typeof form.destroy === 'function') {
        form.destroy();
      }
      
      throw new Error(`Cloudflare API request failed: ${error.message}`);
    }
  }
  
  /**
   * Get image details
   * @param {string} imageId - The Cloudflare image ID
   * @returns {Promise<object>} The image details
   */
  async getImage(imageId) {
    return this.request(`/accounts/${this.accountId}/images/v1/${imageId}`);
  }
  
  /**
   * List images
   * @param {object} options - List options
   * @returns {Promise<object>} List of images
   */
  async listImages(options = {}) {
    const queryParams = new URLSearchParams();
    
    if (options.page) queryParams.append('page', options.page);
    if (options.per_page) queryParams.append('per_page', options.per_page);
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    
    return this.request(`/accounts/${this.accountId}/images/v1${queryString}`);
  }
  
  /**
   * Delete an image
   * @param {string} imageId - The Cloudflare image ID
   * @returns {Promise<object>} The deletion result
   */
  async deleteImage(imageId) {
    return this.request(`/accounts/${this.accountId}/images/v1/${imageId}`, {
      method: 'DELETE'
    });
  }
  
  /**
   * Get the full URL for a Cloudflare image
   * @param {string} imageId - The Cloudflare image ID
   * @param {string} variant - The image variant (optional)
   * @returns {string} The full image URL
   */
  getImageUrl(imageId, variant = 'public') {
    // Remove any UUID-style dashes to format properly if needed
    const formattedId = imageId.replace(/-/g, '');
    
    if (!this.deliveryUrl) {
      // If delivery URL is not configured, build a standard URL
      return `https://imagedelivery.net/${this.accountId}/${imageId}/${variant}`;
    }
    
    // Remove trailing slash if present
    const baseUrl = this.deliveryUrl.endsWith('/') 
      ? this.deliveryUrl.slice(0, -1) 
      : this.deliveryUrl;
      
    return `${baseUrl}/${imageId}/${variant}`;
  }
}