import fetch from 'node-fetch';
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
    return this.request(`/accounts/${this.accountId}/images/v1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: imageUrl
      })
    });
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
    if (!this.deliveryUrl) {
      throw new Error('Delivery URL not configured');
    }
    
    // Remove trailing slash if present
    const baseUrl = this.deliveryUrl.endsWith('/') 
      ? this.deliveryUrl.slice(0, -1) 
      : this.deliveryUrl;
      
    return `${baseUrl}/${imageId}/${variant}`;
  }
}