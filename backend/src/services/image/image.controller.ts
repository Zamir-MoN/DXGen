import { Request, Response, NextFunction } from 'express';
import { ImageService } from './image.service.js';
import { v4 as uuidv4 } from 'uuid';

export class ImageController {
  /**
   * POST /api/v1/images/generate
   */
  static async generate(req: Request, res: Response, next: NextFunction) {
    const requestId = (req as any).requestId || `req_${uuidv4().replace(/-/g, '').slice(0, 12)}`;

    try {
      const result = await ImageService.generateImage(req.body, {
        userId: req.user?.id,
        businessId: req.body.businessId,
        contentId: req.body.contentId,
        apiKeyId: req.apiKey?.id,
        requestId
      });

      res.status(200).json({
        success: true,
        requestId,
        image: {
          id: result.id,
          url: result.url,
          width: result.width,
          height: result.height,
          model: result.model,
          provider: result.provider,
          prompt: result.prompt,
          style: result.style,
          aspectRatio: result.aspectRatio
        },
        usage: {
          provider: result.provider,
          generationTimeMs: result.generationTimeMs
        }
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * POST /api/v1/images/from-content
   */
  static async generateFromContent(req: Request, res: Response, next: NextFunction) {
    const requestId = (req as any).requestId || `req_${uuidv4().replace(/-/g, '').slice(0, 12)}`;

    try {
      const result = await ImageService.generateFromContent({
        contentId: req.body.contentId,
        title: req.body.title,
        topic: req.body.topic,
        platform: req.body.platform,
        contentType: req.body.contentType,
        style: req.body.style,
        userId: req.user?.id,
        apiKeyId: req.apiKey?.id
      });

      res.status(200).json({
        success: true,
        requestId,
        image: {
          id: result.id,
          url: result.url,
          width: result.width,
          height: result.height,
          model: result.model,
          provider: result.provider,
          prompt: result.prompt,
          style: result.style,
          aspectRatio: result.aspectRatio
        },
        usage: {
          provider: result.provider,
          generationTimeMs: result.generationTimeMs
        }
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/v1/images
   */
  static async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const limit = parseInt(req.query.limit as string || '20', 10);
      const isAdmin = req.user?.role === 'owner' || req.user?.role === 'admin';
      const userId = isAdmin ? undefined : req.user?.id;

      const history = await ImageService.getImageHistory({
        userId,
        page,
        limit
      });

      res.status(200).json({
        success: true,
        data: history.images,
        pagination: {
          page: history.page,
          limit,
          total: history.total,
          totalPages: history.totalPages
        }
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/v1/images/:id
   */
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const isAdmin = req.user?.role === 'owner' || req.user?.role === 'admin';
      const image = await ImageService.getImageById(id, isAdmin ? undefined : req.user?.id);

      if (!image) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Image with ID ${id} not found.`
          }
        });
      }

      res.status(200).json({
        success: true,
        image
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/images/:id
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const isAdmin = req.user?.role === 'owner' || req.user?.role === 'admin';
      const deleted = await ImageService.deleteImage(id, isAdmin ? undefined : req.user?.id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Image with ID ${id} not found or unauthorized.`
          }
        });
      }

      res.status(200).json({
        success: true,
        message: 'Image deleted successfully.'
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/v1/images/models
   */
  static async getModels(req: Request, res: Response) {
    const models = ImageService.getAvailableModels();
    res.status(200).json({
      success: true,
      activeProvider: 'pixazo',
      models
    });
  }

  /**
   * GET /api/v1/images/styles
   */
  static async getStyles(req: Request, res: Response) {
    const data = ImageService.getAvailableStyles();
    res.status(200).json({
      success: true,
      ...data
    });
  }

  /**
   * GET /api/v1/images/usage
   */
  static async getUsage(req: Request, res: Response, next: NextFunction) {
    try {
      const isAdmin = req.user?.role === 'owner' || req.user?.role === 'admin';
      const stats = await ImageService.getImageUsageStats(isAdmin ? undefined : req.user?.id);
      res.status(200).json({
        success: true,
        usage: stats
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * POST /api/v1/images/test
   * (Owner / Admin diagnostic probe)
   */
  static async testProvider(req: Request, res: Response, next: NextFunction) {
    try {
      const testResult = await ImageService.testProvider();
      res.status(200).json({
        success: true,
        test: testResult
      });
    } catch (error: any) {
      next(error);
    }
  }
}
