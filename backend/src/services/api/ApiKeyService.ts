import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../database/db.js';
import { config } from '../../config/index.js';

export interface ApiKeyRecord {
  id: string;
  user_id: string;
  business_id?: string;
  name: string;
  key_hash: string;
  key_prefix: string;
  environment: 'live' | 'test';
  status: 'active' | 'disabled';
  rate_limit_hour: number;
  rate_limit_day: number;
  requests_used: number;
  last_used_at: string | null;
  created_at: string;
}

export interface GeneratedKeyPayload {
  id: string;
  name: string;
  rawKey: string;
  keyPrefix: string;
  environment: 'live' | 'test';
  rateLimitHour: number;
  rateLimitDay: number;
  createdAt: string;
}

export class ApiKeyService {
  static hashKey(rawKey: string): string {
    return crypto.createHash('sha256').update(rawKey).digest('hex');
  }

  static async createKey(params: {
    userId: string;
    businessId?: string;
    name: string;
    environment?: 'live' | 'test';
    rateLimitHour?: number;
    rateLimitDay?: number;
  }): Promise<GeneratedKeyPayload> {
    const id = `key_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
    const env = params.environment || 'live';
    const prefix = env === 'live' ? 'dxt_live_' : 'dxt_test_';
    const randomBytes = crypto.randomBytes(24).toString('hex');
    const rawKey = `${prefix}${randomBytes}`;
    const keyHash = this.hashKey(rawKey);

    const hourLimit = params.rateLimitHour || config.rateLimit.defaultHourLimit;
    const dayLimit = params.rateLimitDay || config.rateLimit.defaultDayLimit;
    const now = new Date().toISOString();

    await db.execute(`
      INSERT INTO api_keys (
        id, user_id, business_id, name, key_hash, key_prefix, environment,
        status, rate_limit_hour, rate_limit_day, requests_used, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `, [
      id,
      params.userId,
      params.businessId || null,
      params.name,
      keyHash,
      prefix,
      env,
      'active',
      hourLimit,
      dayLimit,
      now
    ]);

    return {
      id,
      name: params.name,
      rawKey,
      keyPrefix: prefix,
      environment: env,
      rateLimitHour: hourLimit,
      rateLimitDay: dayLimit,
      createdAt: now
    };
  }

  static async validateKey(rawKey: string): Promise<{ valid: boolean; key?: ApiKeyRecord; error?: string; status?: number }> {
    if (!rawKey || (!rawKey.startsWith('dxt_live_') && !rawKey.startsWith('dxt_test_'))) {
      return { valid: false, error: 'Invalid API key format. Expected prefix "dxt_live_" or "dxt_test_".', status: 401 };
    }

    const hash = this.hashKey(rawKey);
    const key = await db.queryOne<ApiKeyRecord>(
      'SELECT * FROM api_keys WHERE key_hash = ?',
      [hash]
    );

    if (!key) {
      return { valid: false, error: 'API key not found or invalid.', status: 401 };
    }

    if (key.status !== 'active') {
      return { valid: false, error: 'API key is disabled. Please contact administrator.', status: 403 };
    }

    // Rate Limiting verification
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    const [hourReqs, dayReqs] = await Promise.all([
      db.queryOne<{ count: number }>(
        'SELECT COUNT(*) as count FROM api_requests WHERE api_key_id = ? AND created_at >= ?',
        [key.id, oneHourAgo]
      ),
      db.queryOne<{ count: number }>(
        'SELECT COUNT(*) as count FROM api_requests WHERE api_key_id = ? AND created_at >= ?',
        [key.id, oneDayAgo]
      )
    ]);

    if ((hourReqs?.count || 0) >= key.rate_limit_hour) {
      return { valid: false, error: `Hourly rate limit exceeded (${key.rate_limit_hour} req/hr). Try again later.`, status: 429 };
    }

    if ((dayReqs?.count || 0) >= key.rate_limit_day) {
      return { valid: false, error: `Daily rate limit exceeded (${key.rate_limit_day} req/day). Try again tomorrow.`, status: 429 };
    }

    // Update last used asynchronously
    db.execute(
      'UPDATE api_keys SET last_used_at = ?, requests_used = requests_used + 1 WHERE id = ?',
      [now.toISOString(), key.id]
    ).catch(err => console.error('[ApiKeyService] Failed to update key usage:', err));

    return { valid: true, key };
  }

  static async logRequest(params: {
    requestId: string;
    apiKeyId?: string;
    userId?: string;
    endpoint: string;
    method: string;
    statusCode: number;
    contentType?: string;
    platform?: string;
    model?: string;
    responseTimeMs: number;
    inputTokens?: number;
    outputTokens?: number;
    errorMessage?: string;
    ip?: string;
  }) {
    const id = `req_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
    const now = new Date().toISOString();
    const today = now.slice(0, 10);

    try {
      await db.execute(`
        INSERT INTO api_requests (
          id, request_id, api_key_id, user_id, endpoint, method, status_code,
          content_type, platform, model, response_time_ms, input_tokens, output_tokens,
          error_message, ip, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        params.requestId,
        params.apiKeyId || null,
        params.userId || null,
        params.endpoint,
        params.method,
        params.statusCode,
        params.contentType || '',
        params.platform || '',
        params.model || '',
        params.responseTimeMs,
        params.inputTokens || 0,
        params.outputTokens || 0,
        params.errorMessage || null,
        params.ip || '',
        now
      ]);

      // Update aggregate usage records for analytics
      const totalTokens = (params.inputTokens || 0) + (params.outputTokens || 0);
      const existingUsage = await db.queryOne<{ id: string }>(
        'SELECT id FROM usage_records WHERE (user_id = ? OR api_key_id = ?) AND date = ?',
        [params.userId || 'anon', params.apiKeyId || 'anon', today]
      );

      if (existingUsage) {
        await db.execute(`
          UPDATE usage_records 
          SET request_count = request_count + 1, token_count = token_count + ?
          WHERE id = ?
        `, [totalTokens, existingUsage.id]);
      } else {
        await db.execute(`
          INSERT INTO usage_records (id, user_id, api_key_id, date, request_count, token_count, created_at)
          VALUES (?, ?, ?, ?, 1, ?, ?)
        `, [
          `usg_${uuidv4().slice(0, 12)}`,
          params.userId || null,
          params.apiKeyId || null,
          today,
          totalTokens,
          now
        ]);
      }
    } catch (err) {
      console.error('[ApiKeyService] Error logging api request:', err);
    }
  }
}
