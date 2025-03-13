import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import { promisify } from 'util';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create app data directory
const APP_DIR = path.join(os.homedir(), '.imgflare');
if (!fs.existsSync(APP_DIR)) {
  fs.mkdirSync(APP_DIR, { recursive: true });
}

const DB_PATH = path.join(APP_DIR, 'imgflare.db');

// Initialize database connection
const db = new sqlite3.Database(DB_PATH);

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Promisify methods
const dbRun = promisify(db.run.bind(db));
const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));
const dbExec = promisify(db.exec.bind(db));

// Initialize database schema if not exists
async function initSchema() {
  // Create images table
  await dbExec(`
    CREATE TABLE IF NOT EXISTS images (
      id TEXT PRIMARY KEY,
      original_url TEXT,
      cloudflare_url TEXT,
      status TEXT DEFAULT 'pending',
      size INTEGER,
      width INTEGER,
      height INTEGER,
      content_type TEXT,
      uploaded_at TEXT,
      error TEXT
    );
  `);

  // Create config table
  await dbExec(`
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT,
      description TEXT
    );
  `);
}

// Initialize the database on startup
initSchema().catch(err => {
  console.error('Error initializing database:', err);
});

export default db;

// Helper functions for common database operations
export async function getConfig(key) {
  try {
    const result = await dbGet('SELECT value FROM config WHERE key = ?', [key]);
    return result ? result.value : null;
  } catch (err) {
    console.error('Error getting config:', err);
    return null;
  }
}

export async function setConfig(key, value, description = '') {
  try {
    await dbRun(
      'INSERT OR REPLACE INTO config (key, value, description) VALUES (?, ?, ?)',
      [key, value, description]
    );
    return { changes: 1 };
  } catch (err) {
    console.error('Error setting config:', err);
    return { changes: 0 };
  }
}

export async function getAllConfig() {
  try {
    return await dbAll('SELECT key, value, description FROM config');
  } catch (err) {
    console.error('Error getting all config:', err);
    return [];
  }
}

export async function insertImage(imageData) {
  try {
    await dbRun(`
      INSERT INTO images 
      (id, original_url, cloudflare_url, status, size, width, height, content_type, uploaded_at) 
      VALUES 
      (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [
      imageData.id,
      imageData.original_url,
      imageData.cloudflare_url,
      imageData.status || 'pending',
      imageData.size,
      imageData.width,
      imageData.height,
      imageData.content_type
    ]);
    return { changes: 1 };
  } catch (err) {
    console.error('Error inserting image:', err);
    return { changes: 0 };
  }
}

export async function updateImage(id, updateData) {
  const keys = Object.keys(updateData);
  if (keys.length === 0) return null;
  
  try {
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const values = keys.map(key => updateData[key]);
    values.push(id);
    
    await dbRun(`UPDATE images SET ${setClause} WHERE id = ?`, values);
    return { changes: 1 };
  } catch (err) {
    console.error('Error updating image:', err);
    return { changes: 0 };
  }
}

export async function getImage(id) {
  try {
    return await dbGet('SELECT * FROM images WHERE id = ?', [id]);
  } catch (err) {
    console.error('Error getting image:', err);
    return null;
  }
}

export async function getImages(filters = {}) {
  try {
    let query = 'SELECT * FROM images';
    const whereConditions = [];
    const params = [];
    
    if (filters.status) {
      whereConditions.push('status = ?');
      params.push(filters.status);
    }
    
    if (whereConditions.length > 0) {
      query += ' WHERE ' + whereConditions.join(' AND ');
    }
    
    if (filters.orderBy) {
      query += ` ORDER BY ${filters.orderBy}`;
      if (filters.order === 'desc') {
        query += ' DESC';
      }
    } else {
      query += ' ORDER BY uploaded_at DESC';
    }
    
    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }
    
    return await dbAll(query, params);
  } catch (err) {
    console.error('Error getting images:', err);
    return [];
  }
}