import { Router } from 'express';
import { ProfileController } from '../../controllers/profileController.js';
import { authenticateJwt } from '../../middleware/authMiddleware.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { businessProfileSchema } from '../../validators/profileValidators.js';

const router = Router();

router.use(authenticateJwt);

router.get('/', ProfileController.listProfiles);
router.post('/', validateRequest(businessProfileSchema), ProfileController.createProfile);
router.put('/:id', validateRequest(businessProfileSchema), ProfileController.updateProfile);
router.delete('/:id', ProfileController.deleteProfile);

export default router;
