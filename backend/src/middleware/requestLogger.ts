import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ApiKeyService } from '../services/api/ApiKeyService.js';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const requestId = `req_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  // Capture original end to record response metrics
  const originalEnd = res.end;
  let responseBody: any;

  res.end = function (chunk?: any, ...rest: any[]): Response {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';

    // Log to console cleanly
    if (process.env.NODE_ENV !== 'test') {
      const color = statusCode >= 500 ? '\x1b[31m' : statusCode >= 400 ? '\x1b[33m' : '\x1b[32m';
      console.log(`[HTTP] ${color}${req.method} ${req.originalUrl} ${statusCode}\x1b[0m ${duration}ms - ${requestId}`);
    }

    // If it's an API v1 request, record structured log
    if (req.originalUrl.startsWith('/api/v1')) {
      const isGenerate = req.originalUrl.includes('/generate');
      ApiKeyService.logRequest({
        requestId,
        apiKeyId: req.apiKey?.id,
        userId: req.user?.id,
        endpoint: req.originalUrl,
        method: req.method,
        statusCode,
        contentType: req.body?.contentType,
        platform: req.body?.platform,
        model: req.body?.modelOverride,
        responseTimeMs: duration,
        inputTokens: (res as any).locals?.inputTokens || 0,
        outputTokens: (res as any).locals?.outputTokens || 0,
        errorMessage: (res as any).locals?.errorMessage || (statusCode >= 400 ? `Status ${statusCode}` : undefined),
        ip
      }).catch(err => console.error('[Logger] Failed to write API request log:', err));
    }

    return (originalEnd as any).apply(res, [chunk, ...rest]);
  };

  next();
}
