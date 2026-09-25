import { Router } from 'express';
import { UsageController } from '../../controllers/usageController.js';
import { authenticateApiKeyOrJwt } from '../../middleware/apiKeyMiddleware.js';

const router = Router();

router.use(authenticateApiKeyOrJwt);
router.use((req, res, next) => {
  // If authenticated via JWT, strictly require owner or admin role
  if (req.user && req.user.role !== 'owner' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied. Usage and observability metrics are reserved for platform administrators.'
      }
    });
  }
  next();
});

router.get('/', UsageController.getUsageMetrics);
router.get('/logs', UsageController.getRequestLogs);

export default router;
