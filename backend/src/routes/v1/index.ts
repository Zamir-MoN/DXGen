import { Router } from 'express';
import generateRoutes from './generateRoutes.js';
import contentRoutes from './contentRoutes.js';
import apiKeyRoutes from './apiKeyRoutes.js';
import usageRoutes from './usageRoutes.js';
import authRoutes from './authRoutes.js';
import profileRoutes from './profileRoutes.js';
import metadataRoutes from './metadataRoutes.js';
import adminRoutes from './adminRoutes.js';
import imageRoutes from '../../services/image/image.routes.js';

const router = Router();

router.use('/generate', generateRoutes);
router.use('/images', imageRoutes);
router.use('/content', contentRoutes);
router.use('/api-keys', apiKeyRoutes);
router.use('/usage', usageRoutes);
router.use('/auth', authRoutes);
router.use('/profiles', profileRoutes);
router.use('/admin', adminRoutes);

// Metadata endpoints: /health, /models, /content-types, /platforms, /tones
router.use('/', metadataRoutes);

export default router;
