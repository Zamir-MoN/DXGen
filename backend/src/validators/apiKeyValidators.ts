import { z } from 'zod';

export const createApiKeySchema = z.object({
  name: z.string().min(2, 'Key name must be at least 2 characters.').max(60),
  businessId: z.string().optional(),
  environment: z.enum(['live', 'test']).default('live'),
  rateLimitHour: z.number().int().min(1).max(5000).optional(),
  rateLimitDay: z.number().int().min(1).max(50000).optional()
});

export const updateApiKeySchema = z.object({
  name: z.string().min(2).max(60).optional(),
  status: z.enum(['active', 'disabled']).optional(),
  rateLimitHour: z.number().int().min(1).max(5000).optional(),
  rateLimitDay: z.number().int().min(1).max(50000).optional()
});
