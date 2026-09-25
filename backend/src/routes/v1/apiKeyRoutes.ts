import { Router } from 'express';
import { ApiKeyController } from '../../controllers/apiKeyController.js';
import { authenticateJwt } from '../../middleware/authMiddleware.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { createApiKeySchema, updateApiKeySchema } from '../../validators/apiKeyValidators.js';

const router = Router();

router.use(authenticateJwt);

router.get('/', ApiKeyController.listKeys);
router.post('/', validateRequest(createApiKeySchema), ApiKeyController.createKey);
router.patch('/:id', validateRequest(updateApiKeySchema), ApiKeyController.updateKey);
router.delete('/:id', ApiKeyController.deleteKey);

export default router;
