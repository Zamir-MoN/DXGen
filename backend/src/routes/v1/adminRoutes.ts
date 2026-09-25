import { Router } from 'express';
import { AdminController } from '../../controllers/adminController.js';
import { authenticateJwt, requireRole } from '../../middleware/authMiddleware.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { createApiKeySchema, updateApiKeySchema } from '../../validators/apiKeyValidators.js';

const router = Router();

router.use(authenticateJwt);
router.use(requireRole(['owner', 'admin']));

router.get('/overview', AdminController.getOverview);
router.get('/users', AdminController.getUsers);
router.get('/api-keys', AdminController.getApiKeys);
router.post('/api-keys', validateRequest(createApiKeySchema), AdminController.createApiKey);
router.patch('/api-keys/:id', validateRequest(updateApiKeySchema), AdminController.patchApiKey);
router.delete('/api-keys/:id', AdminController.deleteApiKey);
router.get('/requests', AdminController.getRequests);
router.get('/gemini-status', AdminController.getGeminiStatus);

export default router;
