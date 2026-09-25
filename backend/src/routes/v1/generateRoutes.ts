import { Router } from 'express';
import { GenerationController } from '../../controllers/generationController.js';
import { authenticateApiKeyOrJwt } from '../../middleware/apiKeyMiddleware.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import {
  generateContentSchema,
  blogGenerateSchema,
  socialGenerateSchema,
  businessGenerateSchema
} from '../../validators/contentValidators.js';

const router = Router();

// All generate endpoints require either an API Key or authenticated session
router.post(
  '/',
  authenticateApiKeyOrJwt,
  validateRequest(generateContentSchema),
  GenerationController.generate
);

router.post(
  '/blog',
  authenticateApiKeyOrJwt,
  validateRequest(blogGenerateSchema),
  GenerationController.generateBlog
);

router.post(
  '/social',
  authenticateApiKeyOrJwt,
  validateRequest(socialGenerateSchema),
  GenerationController.generateSocial
);

router.post(
  '/business',
  authenticateApiKeyOrJwt,
  validateRequest(businessGenerateSchema),
  GenerationController.generateBusiness
);

// Preview prompt without executing generation
router.post(
  '/preview-prompt',
  authenticateApiKeyOrJwt,
  validateRequest(generateContentSchema),
  GenerationController.previewPrompt
);

export default router;
