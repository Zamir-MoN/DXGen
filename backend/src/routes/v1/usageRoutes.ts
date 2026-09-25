import { Router } from 'express';
import { UsageController } from '../../controllers/usageController.js';
import { authenticateApiKeyOrJwt } from '../../middleware/apiKeyMiddleware.js';

const router = Router();

router.get('/', authenticateApiKeyOrJwt, UsageController.getUsageMetrics);
router.get('/logs', authenticateApiKeyOrJwt, UsageController.getRequestLogs);

export default router;
