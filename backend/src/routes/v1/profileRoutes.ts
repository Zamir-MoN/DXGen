import { Router } from 'express';
import { ProfileController } from '../../controllers/profileController.js';
import { authenticateJwt, requireRole } from '../../middleware/authMiddleware.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { businessProfileSchema } from '../../validators/profileValidators.js';

const router = Router();

router.use(authenticateJwt);

router.get('/', ProfileController.listProfiles);
router.post('/', requireRole(['owner', 'admin']), validateRequest(businessProfileSchema), ProfileController.createProfile);
router.put('/:id', requireRole(['owner', 'admin']), validateRequest(businessProfileSchema), ProfileController.updateProfile);
router.delete('/:id', requireRole(['owner', 'admin']), ProfileController.deleteProfile);

export default router;
