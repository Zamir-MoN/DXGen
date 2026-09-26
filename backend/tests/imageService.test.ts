import { describe, it, expect, beforeEach } from 'vitest';
import { ImagePromptBuilder, ContentImagePromptBuilder } from '../src/services/image/image.prompt.js';
import { ImageService } from '../src/services/image/image.service.js';
import { generateImageSchema, generateFromContentSchema } from '../src/validators/imageValidators.js';
import { ImageProvider } from '../src/services/image/providers/image-provider.interface.js';
import { ImageGenerationOptions, ImageGenerationResult } from '../src/services/image/image.types.js';
import { initDatabase, db } from '../src/database/db.js';

// Mock Provider for testing ImageService orchestration
class MockImageProvider implements ImageProvider {
  readonly name = 'mock-provider';

  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    return {
      id: `img_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`,
      url: 'https://cdn.example.com/test-image.png',
      width: options.width || 1024,
      height: options.height || 1024,
      model: options.model || 'flux-schnell',
      provider: this.name,
      prompt: options.prompt,
      style: options.style,
      aspectRatio: options.aspectRatio || '1:1',
      generationTimeMs: 450,
      createdAt: new Date().toISOString()
    };
  }

  async testConnection() {
    return { ok: true, latencyMs: 120, model: 'mock-flux' };
  }

  getSupportedModels() {
    return [
      {
        id: 'mock-flux',
        name: 'Mock FLUX',
        provider: 'mock-provider',
        description: 'Test model',
        aspectRatios: ['1:1', '16:9'],
        defaultDimensions: { width: 1024, height: 1024 }
      }
    ];
  }
}

describe('AI Image Generation Service Suite', () => {
  beforeEach(() => {
    initDatabase();
  });

  describe('ImagePromptBuilder', () => {
    it('should enhance base prompt with style modifiers', () => {
      const prompt = ImagePromptBuilder.buildPrompt({
        topic: 'Modern sleek workstation',
        style: 'Commercial Photography'
      });

      expect(prompt).toContain('Modern sleek workstation');
      expect(prompt).toContain('commercial photography');
      expect(prompt).toContain('no text, no watermark');
    });

    it('should adapt prompt framing for website blog vs instagram', () => {
      const blogPrompt = ImagePromptBuilder.buildPrompt({
        topic: 'AI Automation',
        platform: 'website'
      });

      const instaPrompt = ImagePromptBuilder.buildPrompt({
        topic: 'AI Automation',
        platform: 'instagram'
      });

      expect(blogPrompt).toContain('website hero image');
      expect(instaPrompt).toContain('social media visual');
    });

    it('should map aspect ratios to standard pixel dimensions', () => {
      expect(ImagePromptBuilder.getDimensionsForAspectRatio('1:1')).toEqual({ width: 1024, height: 1024 });
      expect(ImagePromptBuilder.getDimensionsForAspectRatio('16:9')).toEqual({ width: 1280, height: 720 });
      expect(ImagePromptBuilder.getDimensionsForAspectRatio('4:5')).toEqual({ width: 896, height: 1120 });
      expect(ImagePromptBuilder.getDimensionsForAspectRatio('9:16')).toEqual({ width: 720, height: 1280 });
    });

    it('should sanitize editorial title words and enforce zero-text directives', () => {
      const sanitized = ImagePromptBuilder.sanitizeVisualSubject(
        'Understanding Prosthodontics: Restoring Smiles and Oral Function'
      );
      expect(sanitized).not.toContain('Understanding');
      expect(sanitized).not.toContain('Restoring');
      expect(sanitized).not.toContain(':');
      expect(sanitized).toContain('Prosthodontics');

      const enforced = ImagePromptBuilder.enforceNoText('A modern dental clinic with teeth models');
      expect(enforced).toContain('textless');
      expect(enforced).toContain('no text');
      expect(enforced).toContain('no typography');
      expect(enforced).toContain('no words');
    });
  });

  describe('ContentImagePromptBuilder', () => {
    it('should extract visual themes from generated blog content for featured images', () => {
      const result = ContentImagePromptBuilder.buildPromptFromContent({
        title: '10 Ways Cloud Scalability Accelerates Enterprise Revenue',
        topic: 'Enterprise Cloud',
        platform: 'website'
      });

      expect(result.aspectRatio).toBe('16:9');
      expect(result.style).toBe('Commercial Photography');
      expect(result.prompt).toContain('Cloud Scalability');
      expect(result.prompt).toContain('no text');
    });

    it('should set appropriate social aspect ratio for Instagram content', () => {
      const result = ContentImagePromptBuilder.buildPromptFromContent({
        title: 'Morning motivation for founders',
        topic: 'Founder habits',
        platform: 'instagram'
      });

      expect(result.aspectRatio).toBe('4:5');
      expect(result.style).toBe('Realistic');
    });
  });

  describe('ImageService Orchestration & Persistence', () => {
    it('should generate an image and persist record in database', async () => {
      ImageService.setProvider(new MockImageProvider());

      const result = await ImageService.generateImage({
        prompt: 'Futuristic electric vehicle in rainy metropolis',
        style: 'Cinematic',
        aspectRatio: '16:9'
      }, {
        userId: 'usr_admin_01'
      });

      expect(result).toBeDefined();
      expect(result.id).toContain('img_');
      expect(result.url).toBe('https://cdn.example.com/test-image.png');
      expect(result.width).toBe(1280);
      expect(result.height).toBe(720);

      // Verify DB persistence
      const record = await db.queryOne(
        'SELECT * FROM image_generations WHERE id = ?',
        [result.id]
      );
      expect(record).toBeDefined();
      expect(record.style).toBe('Cinematic');
      expect(record.status).toBe('completed');
    });

    it('should calculate image usage metrics', async () => {
      const stats = await ImageService.getImageUsageStats();
      expect(stats).toBeDefined();
      expect(typeof stats.imagesGeneratedToday).toBe('number');
      expect(typeof stats.successfulImages).toBe('number');
    });
  });

  describe('Validation Schemas', () => {
    it('should validate valid image generation requests', () => {
      const valid = generateImageSchema.safeParse({
        prompt: 'Beautiful alpine landscape in golden hour',
        model: 'flux-schnell',
        aspectRatio: '16:9',
        style: 'Realistic'
      });
      expect(valid.success).toBe(true);
    });

    it('should reject empty or too short prompts', () => {
      const invalid = generateImageSchema.safeParse({
        prompt: 'a'
      });
      expect(invalid.success).toBe(false);
    });

    it('should validate content-to-image request', () => {
      const valid = generateFromContentSchema.safeParse({
        topic: 'Remote developer habits',
        platform: 'website'
      });
      expect(valid.success).toBe(true);

      const invalid = generateFromContentSchema.safeParse({});
      expect(invalid.success).toBe(false);
    });
  });
});
