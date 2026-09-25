import { Request, Response, NextFunction } from 'express';
import { ApiKeyService } from '../services/api/ApiKeyService.js';
import { db } from '../database/db.js';
import { AppError } from '../middleware/errorHandler.js';

export class ApiKeyController {
  static async createKey(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { name, businessId, environment, rateLimitHour, rateLimitDay } = req.body;

      const created = await ApiKeyService.createKey({
        userId,
        businessId,
        name,
        environment,
        rateLimitHour,
        rateLimitDay
      });

      res.status(201).json({
        success: true,
        message: 'API key generated successfully. Save this key now; you will not be able to see it again.',
        apiKey: created
      });
    } catch (error) {
      next(error);
    }
  }

  static async listKeys(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const isOwnerOrAdmin = req.user?.role === 'owner' || req.user?.role === 'admin';

      let sql = 'SELECT id, business_id, name, key_prefix, environment, status, rate_limit_hour, rate_limit_day, requests_used, last_used_at, created_at FROM api_keys';
      const params: any[] = [];

      if (!isOwnerOrAdmin) {
        sql += ' WHERE user_id = ?';
        params.push(userId);
      }

      sql += ' ORDER BY created_at DESC';

      const keys = await db.query(sql, params);
      res.status(200).json({
        success: true,
        keys
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateKey(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, status, rateLimitHour, rateLimitDay } = req.body;

      const key = await db.queryOne('SELECT * FROM api_keys WHERE id = ?', [id]);
      if (!key) {
        const err: AppError = new Error('API key not found.');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        return next(err);
      }

      // Check ownership
      if (req.user?.role === 'business_user' && key.user_id !== req.user.id) {
        const err: AppError = new Error('Unauthorized to modify this API key.');
        err.statusCode = 403;
        err.code = 'FORBIDDEN';
        return next(err);
      }

      const updates: string[] = [];
      const params: any[] = [];

      if (name) { updates.push('name = ?'); params.push(name); }
      if (status) { updates.push('status = ?'); params.push(status); }
      if (rateLimitHour !== undefined) { updates.push('rate_limit_hour = ?'); params.push(rateLimitHour); }
      if (rateLimitDay !== undefined) { updates.push('rate_limit_day = ?'); params.push(rateLimitDay); }

      if (updates.length > 0) {
        params.push(id);
        await db.execute(`UPDATE api_keys SET ${updates.join(', ')} WHERE id = ?`, params);
      }

      const updated = await db.queryOne('SELECT id, name, key_prefix, environment, status, rate_limit_hour, rate_limit_day, requests_used, last_used_at FROM api_keys WHERE id = ?', [id]);
      res.status(200).json({
        success: true,
        message: 'API key updated successfully.',
        key: updated
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteKey(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const key = await db.queryOne('SELECT * FROM api_keys WHERE id = ?', [id]);
      if (!key) {
        const err: AppError = new Error('API key not found.');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        return next(err);
      }

      if (req.user?.role === 'business_user' && key.user_id !== req.user.id) {
        const err: AppError = new Error('Unauthorized to delete this API key.');
        err.statusCode = 403;
        err.code = 'FORBIDDEN';
        return next(err);
      }

      await db.execute('DELETE FROM api_keys WHERE id = ?', [id]);
      res.status(200).json({
        success: true,
        message: 'API key revoked and deleted successfully.'
      });
    } catch (error) {
      next(error);
    }
  }
}
