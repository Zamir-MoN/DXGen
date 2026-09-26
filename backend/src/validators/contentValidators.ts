import { z } from 'zod';

export const generateContentSchema = z.object({
  topic: z.string({ required_error: 'Topic is required.' })
    .min(3, 'Topic must be at least 3 characters long.')
    .max(500, 'Topic must not exceed 500 characters.'),
  contentType: z.string().default('seo_blog_article'),
  platform: z.string().default('website'),
  tone: z.string().default('professional'),
  customTone: z.string().optional(),
  length: z.union([z.string(), z.number()]).default('medium'),
  language: z.string().default('English'),
  keywords: z.array(z.string()).optional(),
  audience: z.string().optional(),
  location: z.string().optional(),
  businessId: z.string().optional(),
  customInstructions: z.string().max(1000, 'Custom instructions must be under 1000 characters').optional(),
  modelOverride: z.string().optional(),
  includeImage: z.boolean().optional(),
  imageStyle: z.string().optional(),
  imageAspectRatio: z.string().optional(),
  imageModel: z.string().optional(),
  seo: z.object({
    primaryKeyword: z.string().optional(),
    secondaryKeywords: z.array(z.string()).optional(),
    targetLocation: z.string().optional(),
    targetAudience: z.string().optional(),
    searchIntent: z.string().optional(),
    industry: z.string().optional(),
    brandName: z.string().optional(),
    competitorReference: z.string().optional(),
  }).optional()
});

export const blogGenerateSchema = generateContentSchema.extend({
  contentType: z.string().default('seo_blog_article'),
  platform: z.string().default('website')
});

export const socialGenerateSchema = generateContentSchema.extend({
  contentType: z.string().default('instagram_caption'),
  platform: z.string().default('instagram')
});

export const businessGenerateSchema = generateContentSchema.extend({
  contentType: z.string().default('google_business_profile_post'),
  platform: z.string().default('google_business')
});
