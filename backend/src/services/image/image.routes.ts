import { Router } from 'express';
import { ImageController } from './image.controller.js';
import { authenticateApiKeyOrJwt } from '../../middleware/apiKeyMiddleware.js';
import { requireRole } from '../../middleware/authMiddleware.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { imageRateLimiter } from '../../middleware/imageRateLimiter.js';
import { generateImageSchema, generateFromContentSchema } from '../../validators/imageValidators.js';

const router = Router();

// Metadata endpoints (models & styles) can be queried publicly or with auth
router.get('/models', ImageController.getModels);
router.get('/styles', ImageController.getStyles);

// All generation & management endpoints require authentication (API key or JWT session)
router.post(
  '/generate',
  authenticateApiKeyOrJwt,
  imageRateLimiter,
  validateRequest(generateImageSchema),
  ImageController.generate
);

router.post(
  '/from-content',
  authenticateApiKeyOrJwt,
  imageRateLimiter,
  validateRequest(generateFromContentSchema),
  ImageController.generateFromContent
);

// History, usage, and item retrieval
router.get('/', authenticateApiKeyOrJwt, ImageController.getHistory);
router.get('/usage', authenticateApiKeyOrJwt, ImageController.getUsage);
router.get('/:id', authenticateApiKeyOrJwt, ImageController.getById);
router.delete('/:id', authenticateApiKeyOrJwt, ImageController.delete);

// Admin diagnostic test endpoint
router.post('/test', authenticateApiKeyOrJwt, requireRole(['owner', 'admin']), ImageController.testProvider);

export default router;
