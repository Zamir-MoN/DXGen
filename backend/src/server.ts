import { createApp } from './app.js';
import { initDatabase } from './database/db.js';
import { config } from './config/index.js';

async function bootstrap() {
  try {
    // 1. Initialize Database schema and seeds
    initDatabase();

    // 2. Create Express application
    const app = createApp();

    const server = app.listen(config.port, config.host, () => {
      console.log('====================================================');
      console.log(`🚀 DXGen API Server running in [${config.env}] mode`);
      console.log(`📡 URL: http://${config.host === '0.0.0.0' ? 'localhost' : config.host}:${config.port}`);
      console.log(`🔗 API Base: http://localhost:${config.port}/api/v1`);
      console.log(`🩺 Health: http://localhost:${config.port}/api/v1/health`);
      console.log(`🤖 Configured Gemini Model: ${config.gemini.model}`);
      console.log('====================================================');
    });

    // Graceful shutdown handling
    const shutdown = (signal: string) => {
      console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('Fatal initialization error:', error);
    process.exit(1);
  }
}

bootstrap();
