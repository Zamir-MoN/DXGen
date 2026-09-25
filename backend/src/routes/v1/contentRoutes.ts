import { Router } from 'express';
import { ContentController } from '../../controllers/contentController.js';
import { authenticateApiKeyOrJwt } from '../../middleware/apiKeyMiddleware.js';

const router = Router();

router.get('/', authenticateApiKeyOrJwt, ContentController.listContent);
router.get('/:id', authenticateApiKeyOrJwt, ContentController.getContentById);
router.delete('/:id', authenticateApiKeyOrJwt, ContentController.deleteContent);

export default router;
