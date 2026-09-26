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
  },

  image: {
    provider: process.env.IMAGE_PROVIDER || 'pixazo',
    pixazo: {
      apiKey: process.env.PIXAZO_API_KEY || '',
      baseUrl: (process.env.PIXAZO_BASE_URL || 'https://gateway.pixazo.ai').replace(/\/+$/, '')
    },
    defaultModel: process.env.IMAGE_DEFAULT_MODEL || 'flux-schnell',
    defaultWidth: parseInt(process.env.IMAGE_DEFAULT_WIDTH || '1024', 10),
    defaultHeight: parseInt(process.env.IMAGE_DEFAULT_HEIGHT || '1024', 10),
    timeoutMs: parseInt(process.env.IMAGE_REQUEST_TIMEOUT || '150000', 10),
    maxRetries: parseInt(process.env.IMAGE_MAX_RETRIES || '2', 10),
    rateLimitPerMinute: parseInt(process.env.IMAGE_RATE_LIMIT_PER_MINUTE || '5', 10),
    rateLimitPerDay: parseInt(process.env.IMAGE_RATE_LIMIT_PER_DAY || '20', 10),
    storageProvider: process.env.IMAGE_STORAGE_PROVIDER || 'external',
    availableModels: [
      {
        id: 'flux-schnell',
        name: 'FLUX.1 Schnell',
        provider: 'pixazo',
        description: 'Ultra-fast sub-second diffusion model generating high-fidelity photorealistic and commercial imagery',
        aspectRatios: ['1:1', '16:9', '4:5', '9:16'],
        defaultDimensions: { width: 1024, height: 1024 }
      },
      {
        id: 'sdxl',
        name: 'SDXL Turbo / 1.0',
        provider: 'pixazo',
        description: 'High-resolution Stable Diffusion XL model with rich detail rendering and fine artistic control',
        aspectRatios: ['1:1', '16:9', '4:5', '9:16'],
        defaultDimensions: { width: 1024, height: 1024 }
      }
    ]
  }
};
