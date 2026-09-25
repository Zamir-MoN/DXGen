import { Router } from 'express';
import { MetadataController } from '../../controllers/metadataController.js';

const router = Router();

router.get('/health', MetadataController.getHealth);
router.get('/models', MetadataController.getModels);
router.get('/content-types', MetadataController.getContentTypes);
router.get('/platforms', MetadataController.getPlatforms);
router.get('/tones', MetadataController.getTones);

export default router;
