import { Request, Response, NextFunction } from 'express';
import { db } from '../database/db.js';
import { AppError } from '../middleware/errorHandler.js';

export class ContentController {
  static async getContentById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const record = await db.queryOne(
        'SELECT * FROM content_generations WHERE id = ?',
        [id]
      );

      if (!record) {
        const err: AppError = new Error('Content not found.');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        return next(err);
      }

      // Check ownership unless admin/owner
      if (req.user && req.user.role === 'business_user' && record.user_id && record.user_id !== req.user.id) {
        const err: AppError = new Error('Unauthorized to access this content.');
        err.statusCode = 403;
        err.code = 'FORBIDDEN';
        return next(err);
      }

      res.status(200).json({
        success: true,
        data: {
          ...record,
          keywords: JSON.parse(record.keywords || '[]'),
          faq: JSON.parse(record.faq || '[]')
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async listContent(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, platform, search, page = '1', limit = '20' } = req.query;
      const pageNum = Math.max(1, parseInt(page as string, 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
      const offset = (pageNum - 1) * limitNum;

      const conditions: string[] = [];
      const params: any[] = [];

      // Filter by current user if logged in
      if (req.user && req.user.role === 'business_user') {
        conditions.push('(user_id = ? OR user_id IS NULL)');
        params.push(req.user.id);
      }

      if (type) {
        conditions.push('content_type = ?');
        params.push(type);
      }

      if (platform) {
        conditions.push('platform = ?');
        params.push(platform);
      }

      if (search) {
        conditions.push('(topic LIKE ? OR title LIKE ?)');
        params.push(`%${search}%`, `%${search}%`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      
      const countResult = await db.queryOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM content_generations ${whereClause}`,
        params
      );

      const items = await db.query(
        `SELECT id, topic, content_type, platform, tone, length, language, title, body, meta_title, meta_description, slug, faq, cta, model, generation_time_ms, created_at 
         FROM content_generations ${whereClause} 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [...params, limitNum, offset]
      );

      res.status(200).json({
        success: true,
        data: items.map(item => ({
          ...item,
          faq: JSON.parse(item.faq || '[]')
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: countResult?.count || 0,
          totalPages: Math.ceil((countResult?.count || 0) / limitNum)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteContent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await db.execute(
        'DELETE FROM content_generations WHERE id = ?',
        [id]
      );

      if (result.changes === 0) {
        const err: AppError = new Error('Content record not found.');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        return next(err);
      }

      res.status(200).json({
        success: true,
        message: 'Content deleted successfully.'
      });
    } catch (error) {
      next(error);
    }
  }
}
