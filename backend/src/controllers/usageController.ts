import { Request, Response, NextFunction } from 'express';
import { db } from '../database/db.js';

export class UsageController {
  static async getUsageMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);
      const startOfMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

      const userId = req.user?.id;
      const isOwnerOrAdmin = req.user?.role === 'owner' || req.user?.role === 'admin';

      // 1. Total Content Generations
      const totalGenerationsQuery = isOwnerOrAdmin
        ? 'SELECT COUNT(*) as count FROM content_generations'
        : 'SELECT COUNT(*) as count FROM content_generations WHERE user_id = ?';
      const totalGenParams = isOwnerOrAdmin ? [] : [userId];
      const totalGen = await db.queryOne<{ count: number }>(totalGenerationsQuery, totalGenParams);

      // 2. Requests Today & Month (Counts true AI Generation & Developer API calls)
      const apiFilter = "(endpoint LIKE '%/generate%' OR api_key_id IS NOT NULL)";
      const todayQuery = isOwnerOrAdmin
        ? `SELECT COUNT(*) as count FROM api_requests WHERE created_at >= ? AND ${apiFilter}`
        : `SELECT COUNT(*) as count FROM api_requests WHERE user_id = ? AND created_at >= ? AND ${apiFilter}`;
      const todayParams = isOwnerOrAdmin ? [todayStr] : [userId, todayStr];
      const reqsToday = await db.queryOne<{ count: number }>(todayQuery, todayParams);

      const monthQuery = isOwnerOrAdmin
        ? `SELECT COUNT(*) as count, SUM(input_tokens + output_tokens) as total_tokens, AVG(response_time_ms) as avg_latency FROM api_requests WHERE created_at >= ? AND ${apiFilter}`
        : `SELECT COUNT(*) as count, SUM(input_tokens + output_tokens) as total_tokens, AVG(response_time_ms) as avg_latency FROM api_requests WHERE user_id = ? AND created_at >= ? AND ${apiFilter}`;
      const monthParams = isOwnerOrAdmin ? [startOfMonthStr] : [userId, startOfMonthStr];
      const monthStats = await db.queryOne<{ count: number; total_tokens: number; avg_latency: number }>(monthQuery, monthParams);

      // 3. Success vs Failed
      const successQuery = isOwnerOrAdmin
        ? `SELECT status_code, COUNT(*) as count FROM api_requests WHERE ${apiFilter} GROUP BY status_code`
        : `SELECT status_code, COUNT(*) as count FROM api_requests WHERE user_id = ? AND ${apiFilter} GROUP BY status_code`;
      const successParams = isOwnerOrAdmin ? [] : [userId];
      const statusRows = await db.query<{ status_code: number; count: number }>(successQuery, successParams);

      let successfulRequests = 0;
      let failedRequests = 0;
      for (const row of statusRows) {
        if (row.status_code >= 200 && row.status_code < 400) {
          successfulRequests += row.count;
        } else {
          failedRequests += row.count;
        }
      }

      // 4. Breakdown by Platform
      const platformQuery = isOwnerOrAdmin
        ? 'SELECT platform, COUNT(*) as count FROM content_generations GROUP BY platform ORDER BY count DESC LIMIT 6'
        : 'SELECT platform, COUNT(*) as count FROM content_generations WHERE user_id = ? GROUP BY platform ORDER BY count DESC LIMIT 6';
      const platformRows = await db.query<{ platform: string; count: number }>(platformQuery, totalGenParams);

      // 5. Daily timeline for last 7 days
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const timelineQuery = isOwnerOrAdmin
        ? 'SELECT date, SUM(request_count) as requests, SUM(token_count) as tokens FROM usage_records WHERE date >= ? GROUP BY date ORDER BY date ASC'
        : 'SELECT date, SUM(request_count) as requests, SUM(token_count) as tokens FROM usage_records WHERE user_id = ? AND date >= ? GROUP BY date ORDER BY date ASC';
      const timelineParams = isOwnerOrAdmin ? [sevenDaysAgo] : [userId, sevenDaysAgo];
      const timelineRows = await db.query(timelineQuery, timelineParams);

      res.status(200).json({
        success: true,
        data: {
          totalGenerations: totalGen?.count || 0,
          requestsToday: reqsToday?.count || 0,
          requestsThisMonth: monthStats?.count || 0,
          totalTokensThisMonth: monthStats?.total_tokens || 0,
          averageLatencyMs: Math.round(monthStats?.avg_latency || 0),
          successfulRequests,
          failedRequests,
          platformDistribution: platformRows,
          timeline: timelineRows
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getRequestLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const isOwnerOrAdmin = req.user?.role === 'owner' || req.user?.role === 'admin';
      const userId = req.user?.id;
      const { limit = '50' } = req.query;
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));

      let sql = 'SELECT id, request_id, endpoint, method, status_code, content_type, platform, model, response_time_ms, input_tokens, output_tokens, error_message, ip, created_at FROM api_requests';
      const params: any[] = [];

      if (!isOwnerOrAdmin) {
        sql += ' WHERE user_id = ?';
        params.push(userId);
      }

      sql += ' ORDER BY created_at DESC LIMIT ?';
      params.push(limitNum);

      const logs = await db.query(sql, params);

      res.status(200).json({
        success: true,
        logs
      });
    } catch (error) {
      next(error);
    }
  }
}
