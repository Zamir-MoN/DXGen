import { z } from 'zod';

export const businessProfileSchema = z.object({
  name: z.string().min(2, 'Business name is required.'),
  businessId: z.string().optional(),
  industry: z.string().optional(),
  description: z.string().optional(),
  website: z.string().optional(),
  location: z.string().optional(),
  targetAudience: z.string().optional(),
  services: z.string().optional(),
  products: z.string().optional(),
  brandVoice: z.string().optional(),
  contactInfo: z.string().optional(),
  cta: z.string().optional(),
  usps: z.string().optional()
});
