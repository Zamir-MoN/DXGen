import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiKeyService } from '../services/api/ApiKeyService.js';
import { config } from '../config/index.js';
import { AppError } from './errorHandler.js';
import { AuthenticatedUser } from './authMiddleware.js';

export async function authenticateApiKeyOrJwt(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const apiKeyHeader = req.headers['x-api-key'] as string;

  let rawToken = '';
  if (apiKeyHeader) {
    rawToken = apiKeyHeader.trim();
  } else if (authHeader && authHeader.startsWith('Bearer ')) {
    rawToken = authHeader.slice(7).trim();
  }

  if (!rawToken) {
    const err: AppError = new Error('Authentication required. Provide Authorization: Bearer <API_KEY or JWT> or x-api-key header.');
    err.statusCode = 401;
    err.code = 'UNAUTHORIZED';
    return next(err);
  }

  // Check if it is an API Key
  if (rawToken.startsWith('dxt_live_') || rawToken.startsWith('dxt_test_')) {
    const result = await ApiKeyService.validateKey(rawToken);
    if (!result.valid) {
      const err: AppError = new Error(result.error || 'Invalid API key.');
      err.statusCode = result.status || 401;
      err.code = result.status === 429 ? 'RATE_LIMIT_EXCEEDED' : 'INVALID_API_KEY';
      return next(err);
    }

    req.apiKey = result.key;
    req.user = {
      id: result.key!.user_id,
      email: '',
      role: 'business_user',
      fullName: result.key!.name
    };
    return next();
  }

  // Otherwise try verifying as JWT token
  try {
    const decoded = jwt.verify(rawToken, config.jwtSecret) as AuthenticatedUser;
    req.user = decoded;
    return next();
  } catch (jwtErr) {
    const err: AppError = new Error('Invalid authentication credentials.');
    err.statusCode = 401;
    err.code = 'UNAUTHORIZED';
    return next(err);
  }
}
