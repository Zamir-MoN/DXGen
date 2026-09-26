import { ImageProvider } from './providers/image-provider.interface.js';
import { PixazoProvider } from './providers/pixazo.provider.js';
import {
  ImageGenerationOptions,
  ImageGenerationResult,
  ImageGenerationRecord,
  ImageUsageStats
} from './image.types.js';
import { ImagePromptBuilder, ContentImagePromptBuilder, DEFAULT_NEGATIVE_PROMPT } from './image.prompt.js';
import { ALLOWED_STYLES, ALLOWED_ASPECT_RATIOS, sanitizeDimension } from './image.utils.js';
import { config } from '../../config/index.js';
import { db } from '../../database/db.js';
import { v4 as uuidv4 } from 'uuid';

export class ImageService {
  private static providerInstance: ImageProvider | null = null;

  /**
   * Factory method to obtain the active Image Provider
   */
  static getProvider(): ImageProvider {
    if (!this.providerInstance) {
      const providerName = config.image.provider.toLowerCase();
      switch (providerName) {
        case 'pixazo':
        default:
          this.providerInstance = new PixazoProvider();
          break;
      }
    }
    return this.providerInstance;
  }

  /**
   * Sets or overrides provider instance (e.g. for testing)
   */
  static setProvider(provider: ImageProvider): void {
    this.providerInstance = provider;
  }

  /**
   * Main image generation pipeline
   */
  static async generateImage(
    options: ImageGenerationOptions,
    context?: {
      userId?: string;
      businessId?: string;
      contentId?: string;
      apiKeyId?: string;
      requestId?: string;
    }
  ): Promise<ImageGenerationResult> {
    const provider = this.getProvider();
    const requestId = context?.requestId || `req_${uuidv4().replace(/-/g, '').slice(0, 12)}`;

    // 1. Calculate & sanitize dimensions
    let width = options.width;
    let height = options.height;

    if (options.aspectRatio && (!width || !height)) {
      const dims = ImagePromptBuilder.getDimensionsForAspectRatio(options.aspectRatio);
      width = dims.width;
      height = dims.height;
    }

    width = sanitizeDimension(width, config.image.defaultWidth);
    height = sanitizeDimension(height, config.image.defaultHeight);

    // 2. Build and enhance the prompt (avoid duplicate enhancement if already a full scene prompt)
    let enhancedPrompt = options.prompt.trim();
    if (options.style && !ImagePromptBuilder.isAlreadyEnhanced(options.prompt)) {
      enhancedPrompt = ImagePromptBuilder.buildPrompt({
        topic: options.prompt,
        style: options.style,
        aspectRatio: options.aspectRatio
      });
    }

    const negativePrompt = options.negativePrompt?.trim() || DEFAULT_NEGATIVE_PROMPT;
    const model = options.model || config.image.defaultModel;

    const normalizedOptions: ImageGenerationOptions = {
      prompt: enhancedPrompt,
      model,
      width,
      height,
      style: options.style,
      aspectRatio: options.aspectRatio || '1:1',
      negativePrompt,
      seed: options.seed,
      numberOfImages: options.numberOfImages || 1,
      metadata: {
        userId: context?.userId,
        businessId: context?.businessId,
        contentId: context?.contentId,
        requestId
      }
    };

    try {
      // 3. Execute generation via provider
      const result = await provider.generateImage(normalizedOptions);

      // 4. Record generation in SQLite DB
      await db.execute(`
        INSERT INTO image_generations (
          id, user_id, business_id, content_id, request_id,
          provider, model, prompt, negative_prompt, style, aspect_ratio,
          width, height, image_url, status, generation_time_ms, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        result.id,
        context?.userId || null,
        context?.businessId || null,
        context?.contentId || null,
        requestId,
        result.provider,
        result.model,
        options.prompt, // store original user prompt
        negativePrompt,
        options.style || '',
        options.aspectRatio || '1:1',
        result.width,
        result.height,
        result.url,
        'completed',
        result.generationTimeMs,
        result.createdAt
      ]);

      return result;
    } catch (error: any) {
      // Record failed generation
      const failedId = `img_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
      const now = new Date().toISOString();
      await db.execute(`
        INSERT INTO image_generations (
          id, user_id, business_id, content_id, request_id,
          provider, model, prompt, negative_prompt, style, aspect_ratio,
          width, height, image_url, status, error_code, generation_time_ms, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
      `, [
        failedId,
        context?.userId || null,
        context?.businessId || null,
        context?.contentId || null,
        requestId,
        provider.name,
        model,
        options.prompt,
        negativePrompt,
        options.style || '',
        options.aspectRatio || '1:1',
        width,
        height,
        '',
        'failed',
        error.code || 'IMAGE_GENERATION_FAILED',
        now
      ]).catch(e => console.error('[ImageService] Failed to record error:', e));

      throw error;
    }
  }

  /**
   * Generates a hero image from existing generated content
   */
  static async generateFromContent(params: {
    contentId?: string;
    title?: string;
    topic?: string;
    platform?: string;
    contentType?: string;
    style?: string;
    userId?: string;
    businessId?: string;
    apiKeyId?: string;
  }): Promise<ImageGenerationResult> {
    let title = params.title || '';
    let topic = params.topic || '';
    let platform = params.platform || 'website';
    let contentType = params.contentType || 'seo_blog_article';

    // If contentId provided, fetch from content_generations table
    if (params.contentId) {
      const content = await db.queryOne<{
        title: string;
        topic: string;
        platform: string;
        content_type: string;
        business_id: string;
      }>(
        'SELECT title, topic, platform, content_type, business_id FROM content_generations WHERE id = ?',
        [params.contentId]
      );
      if (content) {
        title = content.title || title;
        topic = content.topic || topic;
        platform = content.platform || platform;
        contentType = content.content_type || contentType;
        if (!params.businessId && content.business_id) {
          params.businessId = content.business_id;
        }
      }
    }

    if (!topic && !title) {
      throw new Error('Either contentId or topic/title must be provided to generate a featured image.');
    }

    const { prompt, aspectRatio, style } = ContentImagePromptBuilder.buildPromptFromContent({
      title,
      topic: topic || title,
      platform,
      contentType,
      style: params.style
    });

    const dims = ImagePromptBuilder.getDimensionsForAspectRatio(aspectRatio);

    return this.generateImage({
      prompt,
      style,
      aspectRatio,
      width: dims.width,
      height: dims.height
    }, {
      userId: params.userId,
      businessId: params.businessId,
      contentId: params.contentId,
      apiKeyId: params.apiKeyId
    });
  }

  /**
   * Returns paginated image generation history
   */
  static async getImageHistory(params: {
    userId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ images: ImageGenerationRecord[]; total: number; page: number; totalPages: number }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const offset = (page - 1) * limit;

    let whereClause = '';
    const queryParams: any[] = [];

    if (params.userId) {
      whereClause = 'WHERE user_id = ?';
      queryParams.push(params.userId);
    }

    const countRes = await db.queryOne<{ total: number }>(
      `SELECT COUNT(*) as total FROM image_generations ${whereClause}`,
      queryParams
    );
    const total = countRes?.total || 0;

    const images = await db.query<ImageGenerationRecord>(
      `SELECT * FROM image_generations ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    return {
      images,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1
    };
  }

  /**
   * Retrieves a single image by ID
   */
  static async getImageById(id: string, userId?: string): Promise<ImageGenerationRecord | null> {
    if (userId) {
      return db.queryOne<ImageGenerationRecord>(
        'SELECT * FROM image_generations WHERE id = ? AND (user_id = ? OR user_id IS NULL)',
        [id, userId]
      );
    }
    return db.queryOne<ImageGenerationRecord>(
      'SELECT * FROM image_generations WHERE id = ?',
      [id]
    );
  }

  /**
   * Deletes an image record
   */
  static async deleteImage(id: string, userId?: string): Promise<boolean> {
    if (userId) {
      const res = await db.execute(
        'DELETE FROM image_generations WHERE id = ? AND user_id = ?',
        [id, userId]
      );
      return res.changes > 0;
    }
    const res = await db.execute('DELETE FROM image_generations WHERE id = ?', [id]);
    return res.changes > 0;
  }

  /**
   * Calculates image usage statistics
   */
  static async getImageUsageStats(userId?: string): Promise<ImageUsageStats> {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const thisMonth = now.toISOString().slice(0, 7);

    const userFilter = userId ? 'AND user_id = ?' : '';
    const userParams = userId ? [userId] : [];

    const [todayCount, monthCount, successfulCount, failedCount, avgTime] = await Promise.all([
      db.queryOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM image_generations WHERE created_at LIKE ? ${userFilter}`,
        [`${today}%`, ...userParams]
      ),
      db.queryOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM image_generations WHERE created_at LIKE ? ${userFilter}`,
        [`${thisMonth}%`, ...userParams]
      ),
      db.queryOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM image_generations WHERE status = 'completed' ${userFilter}`,
        userParams
      ),
      db.queryOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM image_generations WHERE status = 'failed' ${userFilter}`,
        userParams
      ),
      db.queryOne<{ avg_time: number }>(
        `SELECT AVG(generation_time_ms) as avg_time FROM image_generations WHERE status = 'completed' ${userFilter}`,
        userParams
      )
    ]);

    return {
      imagesGeneratedToday: todayCount?.count || 0,
      imagesGeneratedThisMonth: monthCount?.count || 0,
      successfulImages: successfulCount?.count || 0,
      failedImages: failedCount?.count || 0,
      averageGenerationTimeMs: Math.round(avgTime?.avg_time || 0)
    };
  }

  /**
   * Tests provider connection & credentials
   */
  static async testProvider(): Promise<{ ok: boolean; latencyMs: number; error?: string; model?: string; provider: string }> {
    const provider = this.getProvider();
    const res = await provider.testConnection();
    return {
      ...res,
      provider: provider.name
    };
  }

  /**
   * Lists available models
   */
  static getAvailableModels() {
    const provider = this.getProvider();
    return provider.getSupportedModels();
  }

  /**
   * Lists available styles and aspect ratios
   */
  static getAvailableStyles() {
    return {
      styles: ALLOWED_STYLES,
      aspectRatios: ALLOWED_ASPECT_RATIOS
    };
  }
}
