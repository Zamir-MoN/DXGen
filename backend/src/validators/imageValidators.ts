import { z } from 'zod';
import { ALLOWED_STYLES, ALLOWED_ASPECT_RATIOS } from '../services/image/image.utils.js';

export const generateImageSchema = z.object({
  prompt: z.string({
    required_error: 'Prompt is required.'
  })
    .min(3, 'Prompt must be at least 3 characters.')
    .max(1000, 'Prompt cannot exceed 1000 characters.'),
  model: z.string().optional(),
  width: z.number().int().min(256).max(2048).optional(),
  height: z.number().int().min(256).max(2048).optional(),
  style: z.enum(ALLOWED_STYLES as [string, ...string[]]).or(z.string()).optional(),
  aspectRatio: z.enum(ALLOWED_ASPECT_RATIOS as [string, ...string[]]).optional(),
  negativePrompt: z.string().max(500, 'Negative prompt cannot exceed 500 characters.').optional(),
  seed: z.number().int().optional(),
  numberOfImages: z.number().int().min(1).max(4).default(1).optional(),
  businessId: z.string().optional(),
  contentId: z.string().optional()
});

export const generateFromContentSchema = z.object({
  contentId: z.string().optional(),
  title: z.string().optional(),
  topic: z.string().optional(),
  platform: z.string().optional(),
  contentType: z.string().optional(),
  style: z.string().optional()
}).refine(data => data.contentId || data.topic || data.title, {
  message: 'Either contentId or topic/title must be provided.'
});
