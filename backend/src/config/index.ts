import dotenv from 'dotenv';
import path from 'path';

// Load .env strictly from backend directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '0.0.0.0',
  jwtSecret: process.env.JWT_SECRET || 'dxgen-super-secure-production-jwt-secret-key-change-in-prod-2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  databaseUrl: process.env.DATABASE_URL || 'file:./dxgen.sqlite',
  
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    availableModels: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Next-gen multimodal workhorse with sub-second latency and great quality', maxTokens: 8192 },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Fast, cost-efficient, high-volume production model', maxTokens: 8192 },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Deep reasoning, complex synthesis, long-form content mastery', maxTokens: 8192 },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Latest ultra-fast model with advanced instruction following', maxTokens: 8192 }
    ],
    maxRetries: 3,
    retryDelayMs: 1000,
    timeoutMs: 45000,
  },

  rateLimit: {
    defaultHourLimit: parseInt(process.env.RATE_LIMIT_HOUR || '100', 10),
    defaultDayLimit: parseInt(process.env.RATE_LIMIT_DAY || '1000', 10),
    windowMs: 15 * 60 * 1000, // 15 mins for general IP limiter
    maxPerWindow: 200,
  }
};
