import { Request, Response, NextFunction } from 'express';
import { db } from '../database/db.js';
import { config } from '../config/index.js';
import { AppError } from './errorHandler.js';

export async function imageRateLimiter(req: Request, res: Response, next: NextFunction) {
  const userId = req.user?.id;
  const apiKey = req.apiKey;

  // Define limits from config or API key
  const minuteLimit = config.image.rateLimitPerMinute || 5;
  const dayLimit = apiKey?.rate_limit_day ? Math.min(apiKey.rate_limit_day, config.image.rateLimitPerDay || 20) : (config.image.rateLimitPerDay || 20);

  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000).toISOString();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  let filterClause = '';
  const filterParams: any[] = [];

  if (apiKey?.id) {
    filterClause = 'AND request_id IN (SELECT request_id FROM api_requests WHERE api_key_id = ?)';
    filterParams.push(apiKey.id);
  } else if (userId) {
    filterClause = 'AND user_id = ?';
    filterParams.push(userId);
  }

  try {
    const [minuteUsage, dayUsage] = await Promise.all([
      db.queryOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM image_generations WHERE created_at >= ? ${filterClause}`,
        [oneMinuteAgo, ...filterParams]
      ),
      db.queryOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM image_generations WHERE created_at >= ? ${filterClause}`,
        [oneDayAgo, ...filterParams]
      )
    ]);

    if ((minuteUsage?.count || 0) >= minuteLimit) {
      const err: AppError = new Error(`Image rate limit exceeded (${minuteLimit} images/min). Please wait a moment.`);
      err.statusCode = 429;
      err.code = 'IMAGE_RATE_LIMITED';
      return next(err);
    }

    if ((dayUsage?.count || 0) >= dayLimit) {
      const err: AppError = new Error(`Daily image quota reached (${dayLimit} images/day). Try again tomorrow.`);
      err.statusCode = 429;
      err.code = 'IMAGE_RATE_LIMITED';
      return next(err);
    }

    next();
  } catch (error) {
    // If rate limiter check fails, allow request to proceed so DB issue doesn't halt pipeline
    console.error('[ImageRateLimiter] Error verifying image rate limits:', error);
    next();
  }
}
