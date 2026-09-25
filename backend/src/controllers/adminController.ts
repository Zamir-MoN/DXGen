import { Request, Response, NextFunction } from 'express';
import { db } from '../database/db.js';
import { ApiKeyService } from '../services/api/ApiKeyService.js';
import { AppError } from '../middleware/errorHandler.js';
import { config } from '../config/index.js';

export class AdminController {
  static async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const [users, keys, generations, requests] = await Promise.all([
        db.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM users'),
        db.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM api_keys'),
        db.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM content_generations'),
        db.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM api_requests WHERE endpoint LIKE "%/generate%" OR api_key_id IS NOT NULL'),
      ]);

      const recentErrors = await db.query(
        'SELECT id, request_id, endpoint, status_code, error_message, ip, created_at FROM api_requests WHERE status_code >= 400 ORDER BY created_at DESC LIMIT 10'
      );

      res.status(200).json({
        success: true,
        overview: {
          totalUsers: users?.count || 0,
          totalApiKeys: keys?.count || 0,
          totalGenerations: generations?.count || 0,
          totalApiRequests: requests?.count || 0,
          recentErrors
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await db.query(`
        SELECT u.id, u.email, u.full_name, u.role, u.created_at,
          (SELECT COUNT(*) FROM api_keys k WHERE k.user_id = u.id) as api_keys_count,
          (SELECT COUNT(*) FROM content_generations g WHERE g.user_id = u.id) as generations_count
        FROM users u
        ORDER BY u.created_at DESC
      `);

      res.status(200).json({
        success: true,
        users
      });
    } catch (error) {
      next(error);
    }
  }

  static async getApiKeys(req: Request, res: Response, next: NextFunction) {
    try {
      const keys = await db.query(`
        SELECT k.*, u.email as user_email, u.full_name as user_name
        FROM api_keys k
        LEFT JOIN users u ON k.user_id = u.id
        ORDER BY k.created_at DESC
      `);

      res.status(200).json({
        success: true,
        keys
      });
    } catch (error) {
      next(error);
    }
  }

  static async createApiKey(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, name, businessId, environment, rateLimitHour, rateLimitDay } = req.body;
      const targetUserId = userId || req.user!.id;

      const created = await ApiKeyService.createKey({
        userId: targetUserId,
        businessId,
        name,
        environment,
        rateLimitHour,
        rateLimitDay
      });

      res.status(201).json({
        success: true,
        message: 'Admin generated API key successfully.',
        apiKey: created
      });
    } catch (error) {
      next(error);
    }
  }

  static async patchApiKey(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, rateLimitHour, rateLimitDay, name } = req.body;

      const key = await db.queryOne('SELECT id FROM api_keys WHERE id = ?', [id]);
      if (!key) {
        const err: AppError = new Error('API key not found.');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        return next(err);
      }

      const updates: string[] = [];
      const params: any[] = [];
      if (status) { updates.push('status = ?'); params.push(status); }
      if (rateLimitHour !== undefined) { updates.push('rate_limit_hour = ?'); params.push(rateLimitHour); }
      if (rateLimitDay !== undefined) { updates.push('rate_limit_day = ?'); params.push(rateLimitDay); }
      if (name) { updates.push('name = ?'); params.push(name); }

      if (updates.length > 0) {
        params.push(id);
        await db.execute(`UPDATE api_keys SET ${updates.join(', ')} WHERE id = ?`, params);
      }

      const updated = await db.queryOne('SELECT * FROM api_keys WHERE id = ?', [id]);
      res.status(200).json({
        success: true,
        message: 'API key updated by administrator.',
        key: updated
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteApiKey(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await db.execute('DELETE FROM api_keys WHERE id = ?', [id]);
      res.status(200).json({
        success: true,
        message: 'API key permanently removed by administrator.'
      });
    } catch (error) {
      next(error);
    }
  }

  static async getRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const { limit = '100', offset = '0', status } = req.query;
      let sql = 'SELECT * FROM api_requests';
      const params: any[] = [];

      if (status === 'error') {
        sql += ' WHERE status_code >= 400';
      } else if (status === 'success') {
        sql += ' WHERE status_code < 400';
      }

      sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit as string, 10), parseInt(offset as string, 10));

      const requests = await db.query(sql, params);
      res.status(200).json({
        success: true,
        requests
      });
    } catch (error) {
      next(error);
    }
  }

  static async getGeminiStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const apiKey = (process.env.GEMINI_API_KEY || config.gemini.apiKey || '').trim();
      const model = process.env.GEMINI_MODEL || config.gemini.model || 'gemini-2.5-flash';

      if (!apiKey) {
        return res.status(200).json({
          success: true,
          gemini: {
            status: 'unconfigured',
            isLive: false,
            message: 'No GEMINI_API_KEY is configured in backend environment.',
            keyMasked: 'None',
            model,
            lastCheckedAt: new Date().toISOString()
          }
        });
      }

      const keyMasked = apiKey.length > 12 
        ? `${apiKey.slice(0, 8)}••••••••${apiKey.slice(-4)}`
        : '••••••••';

      // 1. Live ping Google Generative Language API
      const pingStart = Date.now();
      let isLive = false;
      let latencyMs = 0;
      let httpStatus = 0;
      let googleError: string | null = null;
      let modelsAvailableCount = 0;
      let activeModelInfo: any = null;

      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
          method: 'GET',
          signal: AbortSignal.timeout(8000)
        });
        latencyMs = Date.now() - pingStart;
        httpStatus = response.status;
        const data: any = await response.json();

        if (response.ok && Array.isArray(data.models)) {
          isLive = true;
          modelsAvailableCount = data.models.length;
          const cleanModel = model.replace('models/', '');
          activeModelInfo = data.models.find((m: any) => m.name.includes(cleanModel)) || data.models[0];
        } else {
          isLive = false;
          googleError = data?.error?.message || `HTTP ${response.status} ${response.statusText}`;
        }
      } catch (err: any) {
        latencyMs = Date.now() - pingStart;
        isLive = false;
        googleError = err.message || 'Connection to Google API timed out';
      }

      // 2. Query system usage database for live consumption stats
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);
      const startOfMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

      const todayStats = await db.queryOne<{ count: number; input_tokens: number; output_tokens: number }>(`
        SELECT 
          COUNT(*) as count, 
          COALESCE(SUM(input_tokens), 0) as input_tokens, 
          COALESCE(SUM(output_tokens), 0) as output_tokens 
        FROM api_requests 
        WHERE created_at >= ? AND (endpoint LIKE '%/generate%' OR api_key_id IS NOT NULL OR input_tokens > 0)
      `, [todayStr]);

      const monthStats = await db.queryOne<{ count: number; total_tokens: number }>(`
        SELECT 
          COUNT(*) as count, 
          COALESCE(SUM(input_tokens + output_tokens), 0) as total_tokens 
        FROM api_requests 
        WHERE created_at >= ? AND (endpoint LIKE '%/generate%' OR api_key_id IS NOT NULL OR input_tokens > 0)
      `, [startOfMonthStr]);

      const throttleEvents = await db.queryOne<{ count: number }>(`
        SELECT COUNT(*) as count 
        FROM api_requests 
        WHERE status_code = 429 AND created_at >= ?
      `, [todayStr]);

      // Free tier limits for Gemini 2.5 Flash: 1500 Requests Per Day (RPD), 15 RPM, 1M TPM
      const dailyRequestLimit = 1500;
      const requestsUsedToday = todayStats?.count || 0;
      const requestsRemainingToday = Math.max(0, dailyRequestLimit - requestsUsedToday);
      const percentRemaining = Number(((requestsRemainingToday / dailyRequestLimit) * 100).toFixed(1));

      const inputTokensToday = todayStats?.input_tokens || 0;
      const outputTokensToday = todayStats?.output_tokens || 0;
      const tokensToday = inputTokensToday + outputTokensToday;
      const tokensThisMonth = monthStats?.total_tokens || 0;

      // Gemini 2.5 Flash pricing: $0.075 per 1M input, $0.30 per 1M output
      const estimatedCostTodayUsd = Number(((inputTokensToday / 1_000_000) * 0.075 + (outputTokensToday / 1_000_000) * 0.30).toFixed(4));
      const estimatedCostMonthUsd = Number(((tokensThisMonth / 1_000_000) * 0.15).toFixed(4));

      res.status(200).json({
        success: true,
        gemini: {
          status: isLive ? 'active' : (httpStatus === 429 ? 'quota_exceeded' : 'error'),
          isLive,
          latencyMs,
          httpStatus,
          errorMessage: googleError,
          keyMasked,
          configuredModel: model,
          activeModelName: activeModelInfo?.name || `models/${model}`,
          inputTokenLimit: activeModelInfo?.inputTokenLimit || 1048576,
          outputTokenLimit: activeModelInfo?.outputTokenLimit || 65536,
          modelsAvailableCount,
          quota: {
            tierName: 'Google AI Studio (1.5k RPD Free / Pay-as-you-go)',
            dailyRequestLimit,
            requestsUsedToday,
            requestsRemainingToday,
            percentRemaining,
            tokensUsedToday: tokensToday,
            tokensUsedThisMonth: tokensThisMonth,
            rpmLimit: 15,
            tpmLimit: 1000000,
            estimatedCostTodayUsd,
            estimatedCostMonthUsd,
            throttleEventsToday: throttleEvents?.count || 0,
            quotaStatus: (throttleEvents?.count || 0) > 0 ? 'throttled' : (percentRemaining < 10 ? 'low' : 'healthy')
          },
          lastCheckedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }
}
