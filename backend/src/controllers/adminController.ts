import { Request, Response, NextFunction } from 'express';
import { db } from '../database/db.js';
import { ApiKeyService } from '../services/api/ApiKeyService.js';
import { AppError } from '../middleware/errorHandler.js';

export class AdminController {
  static async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const [users, keys, generations, requests] = await Promise.all([
        db.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM users'),
        db.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM api_keys'),
        db.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM content_generations'),
        db.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM api_requests'),
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
}
