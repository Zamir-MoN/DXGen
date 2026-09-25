import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import v1Routes from './routes/v1/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { generalRateLimiter } from './middleware/rateLimiter.js';
import { config } from './config/index.js';

export function createApp() {
  const app = express();

  // 1. Security Headers
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  }));

  // 2. CORS configuration
  app.use(cors({
    origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-api-key']
  }));

  // 3. Body Parsing
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // 4. Structured Request Logger
  app.use(requestLogger);

  // 5. Global Rate Limiter
  app.use('/api/', generalRateLimiter);

  // Root welcome ping
  app.get('/', (req, res) => {
    res.json({
      name: 'DXGen AI Content Generation Engine & Public API',
      version: '1.0.0',
      status: 'healthy',
      documentation: '/api/v1/health'
    });
  });

  // 6. Versioned API Routes (/api/v1)
  app.use('/api/v1', v1Routes);

  // 7. 404 Handler
  app.use((req, res, next) => {
    const err: any = new Error(`Resource not found: ${req.method} ${req.originalUrl}`);
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    next(err);
  });

  // 8. Central Error Handler
  app.use(errorHandler);

  return app;
}
