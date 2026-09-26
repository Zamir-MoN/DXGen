import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { config } from '../config/index.js';

let sqliteDb: DatabaseSync | null = null;

export interface QueryResult<T = any> {
  rows: T[];
  changes?: number;
}

export function initDatabase() {
  let dbPath: string;
  const backendDir = process.cwd().endsWith('backend') ? process.cwd() : path.resolve(process.cwd(), 'backend');
  
  if (config.databaseUrl.startsWith('file:')) {
    const raw = config.databaseUrl.replace('file:', '');
    dbPath = path.isAbsolute(raw) ? raw : path.resolve(backendDir, raw);
  } else {
    dbPath = path.resolve(backendDir, 'dxgen.sqlite');
  }

  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  sqliteDb = new DatabaseSync(dbPath);
  
  // Enable foreign keys and WAL mode for high concurrency
  sqliteDb.exec('PRAGMA foreign_keys = ON;');
  sqliteDb.exec('PRAGMA journal_mode = WAL;');

  // Run migrations
  createSchema();
  seedInitialData();
  console.log(`[Database] SQLite connected & initialized at ${dbPath}`);
}

function createSchema() {
  if (!sqliteDb) throw new Error('Database not initialized');

  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT CHECK(role IN ('owner', 'admin', 'business_user')) DEFAULT 'business_user',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS businesses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS business_profiles (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      industry TEXT DEFAULT '',
      description TEXT DEFAULT '',
      website TEXT DEFAULT '',
      location TEXT DEFAULT '',
      target_audience TEXT DEFAULT '',
      services TEXT DEFAULT '',
      products TEXT DEFAULT '',
      brand_voice TEXT DEFAULT '',
      contact_info TEXT DEFAULT '',
      cta TEXT DEFAULT '',
      usps TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      business_id TEXT,
      name TEXT NOT NULL,
      key_hash TEXT UNIQUE NOT NULL,
      key_prefix TEXT NOT NULL,
      environment TEXT CHECK(environment IN ('live', 'test')) DEFAULT 'live',
      status TEXT CHECK(status IN ('active', 'disabled')) DEFAULT 'active',
      rate_limit_hour INTEGER DEFAULT 100,
      rate_limit_day INTEGER DEFAULT 1000,
      requests_used INTEGER DEFAULT 0,
      last_used_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS content_generations (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      business_id TEXT,
      api_key_id TEXT,
      topic TEXT NOT NULL,
      content_type TEXT NOT NULL,
      platform TEXT NOT NULL,
      tone TEXT NOT NULL,
      length TEXT NOT NULL,
      language TEXT DEFAULT 'English',
      keywords TEXT DEFAULT '[]',
      audience TEXT DEFAULT '',
      prompt_used TEXT NOT NULL,
      title TEXT DEFAULT '',
      body TEXT NOT NULL,
      meta_title TEXT DEFAULT '',
      meta_description TEXT DEFAULT '',
      slug TEXT DEFAULT '',
      faq TEXT DEFAULT '[]',
      cta TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      image_id TEXT DEFAULT '',
      model TEXT NOT NULL,
      input_tokens INTEGER DEFAULT 0,
      output_tokens INTEGER DEFAULT 0,
      generation_time_ms INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS api_requests (
      id TEXT PRIMARY KEY,
      request_id TEXT UNIQUE NOT NULL,
      api_key_id TEXT,
      user_id TEXT,
      endpoint TEXT NOT NULL,
      method TEXT NOT NULL,
      status_code INTEGER NOT NULL,
      content_type TEXT DEFAULT '',
      platform TEXT DEFAULT '',
      model TEXT DEFAULT '',
      response_time_ms INTEGER DEFAULT 0,
      input_tokens INTEGER DEFAULT 0,
      output_tokens INTEGER DEFAULT 0,
      error_message TEXT,
      ip TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS usage_records (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      api_key_id TEXT,
      date TEXT NOT NULL,
      request_count INTEGER DEFAULT 0,
      token_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS system_logs (
      id TEXT PRIMARY KEY,
      level TEXT NOT NULL,
      message TEXT NOT NULL,
      meta TEXT DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS image_generations (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      business_id TEXT,
      content_id TEXT,
      request_id TEXT,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      prompt TEXT NOT NULL,
      negative_prompt TEXT DEFAULT '',
      style TEXT DEFAULT '',
      aspect_ratio TEXT DEFAULT '1:1',
      width INTEGER NOT NULL,
      height INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      status TEXT DEFAULT 'completed',
      error_code TEXT,
      generation_time_ms INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE SET NULL,
      FOREIGN KEY (content_id) REFERENCES content_generations(id) ON DELETE SET NULL
    );

    -- Indexes for high-speed queries
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
    CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
    CREATE INDEX IF NOT EXISTS idx_generations_user ON content_generations(user_id);
    CREATE INDEX IF NOT EXISTS idx_generations_created ON content_generations(created_at);
    CREATE INDEX IF NOT EXISTS idx_requests_api_key ON api_requests(api_key_id);
    CREATE INDEX IF NOT EXISTS idx_requests_created ON api_requests(created_at);
    CREATE INDEX IF NOT EXISTS idx_image_generations_user ON image_generations(user_id);
    CREATE INDEX IF NOT EXISTS idx_image_generations_content ON image_generations(content_id);
    CREATE INDEX IF NOT EXISTS idx_image_generations_created ON image_generations(created_at);
  `);

  // Safe schema migrations for existing databases
  try {
    sqliteDb.exec('ALTER TABLE content_generations ADD COLUMN image_url TEXT DEFAULT ""');
  } catch {}
  try {
    sqliteDb.exec('ALTER TABLE content_generations ADD COLUMN image_id TEXT DEFAULT ""');
  } catch {}
}

function seedInitialData() {
  if (!sqliteDb) return;
  const userCount = sqliteDb.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    const adminId = 'usr_admin_01';
    const bizId = 'biz_deltax_01';
    const profileId = 'prof_deltax_01';
    const now = new Date().toISOString();
    const hash = bcrypt.hashSync('dxgen2026', 10);

    // Seed Admin User
    sqliteDb.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(adminId, 'admin', hash, 'DXGen Platform Owner', 'owner', now, now);

    // Seed Default Business
    sqliteDb.prepare(`
      INSERT INTO businesses (id, user_id, name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(bizId, adminId, 'Delta X Digital', now, now);

    // Seed Default Business Profile
    sqliteDb.prepare(`
      INSERT INTO business_profiles (
        id, business_id, user_id, name, industry, description, website, location,
        target_audience, services, products, brand_voice, contact_info, cta, usps, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      profileId,
      bizId,
      adminId,
      'Delta X Digital',
      'SaaS & Digital Marketing',
      'Leading enterprise AI automation and content acceleration agency helping fast-growing brands scale.',
      'https://deltax.ai',
      'San Francisco, CA & Global',
      'Founders, Marketing Leaders, B2B Growth Teams',
      'AI Content Strategy, SEO Automation, Growth Marketing',
      'DXGen Enterprise, AI Content Suite',
      'Authoritative, visionary, results-oriented, professional',
      'contact@deltax.ai',
      'Scale your content pipeline 10x with DXGen today',
      'Proprietary multi-model orchestration, enterprise API, human-grade tone consistency',
      now,
      now
    );

    // Seed a Demo API Key for testing
    // SHA256 of 'dxt_live_demo1234567890abcdef'
    const demoRawKey = 'dxt_live_demo1234567890abcdef';
    const demoHash = crypto.createHash('sha256').update(demoRawKey).digest('hex');
    sqliteDb.prepare(`
      INSERT INTO api_keys (
        id, user_id, business_id, name, key_hash, key_prefix, environment,
        status, rate_limit_hour, rate_limit_day, requests_used, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'key_demo_01',
      adminId,
      bizId,
      'Production Demo Key',
      demoHash,
      'dxt_live_',
      'live',
      'active',
      500,
      5000,
      12,
      now
    );

    console.log('[Database] Seeded initial admin (admin@dxgen.ai / Admin@123456) and demo API key (dxt_live_demo1234567890abcdef)');
  }

  // Guarantee that admin accounts have 'owner' role and password 'dxgen2026'
  try {
    const adminPasswordHash = bcrypt.hashSync('dxgen2026', 10);
    const now = new Date().toISOString();

    // 1. Update any existing admin accounts with new password and owner role
    sqliteDb.prepare(`
      UPDATE users 
      SET password_hash = ?, role = 'owner' 
      WHERE LOWER(email) IN ('admin', 'admin@dxgen.ai')
    `).run(adminPasswordHash);

    // 2. Ensure user with identifier 'admin' exists so logging in directly with 'admin' works
    const adminExists = sqliteDb.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get('admin');
    if (!adminExists) {
      sqliteDb.prepare(`
        INSERT INTO users (id, email, password_hash, full_name, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run('usr_admin_root', 'admin', adminPasswordHash, 'Administrator', 'owner', now, now);
    }

    // 3. Ensure zamir.0huo@gmail.com also has owner role
    sqliteDb.prepare(`
      UPDATE users SET role = 'owner' WHERE LOWER(email) = 'zamir.0huo@gmail.com'
    `).run();

    // 4. Prune internal UI navigation records from api_requests so stats reflect real AI/API calls only
    sqliteDb.prepare(`
      DELETE FROM api_requests 
      WHERE endpoint NOT LIKE '%/generate%' AND api_key_id IS NULL AND (input_tokens = 0 OR input_tokens IS NULL)
    `).run();
  } catch (err) {
    console.error('[Database] Failed to ensure admin credentials:', err);
  }
}

export const db = {
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (!sqliteDb) throw new Error('Database not initialized');
    const stmt = sqliteDb.prepare(sql);
    return stmt.all(...params) as T[];
  },

  async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    if (!sqliteDb) throw new Error('Database not initialized');
    const stmt = sqliteDb.prepare(sql);
    const row = stmt.get(...params);
    return (row as T) || null;
  },

  async execute(sql: string, params: any[] = []): Promise<{ changes: number; lastInsertRowid: number | bigint }> {
    if (!sqliteDb) throw new Error('Database not initialized');
    const stmt = sqliteDb.prepare(sql);
    const result = stmt.run(...params);
    return {
      changes: Number(result.changes),
      lastInsertRowid: result.lastInsertRowid
    };
  }
};
