import { Request, Response, NextFunction } from 'express';
import { ContentService } from '../services/content/ContentService.js';

export class GenerationController {
  static async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const response = await ContentService.generateContent({
        ...req.body,
        userId: req.user?.id,
        apiKeyId: req.apiKey?.id
      });

      // Pass tokens for logger
      res.locals.inputTokens = response.usage.inputTokens;
      res.locals.outputTokens = response.usage.outputTokens;

      res.status(200).json(response);
    } catch (error: any) {
      res.locals.errorMessage = error.message;
      next(error);
    }
  }

  static async generateBlog(req: Request, res: Response, next: NextFunction) {
    try {
      const response = await ContentService.generateContent({
        ...req.body,
        contentType: req.body.contentType || 'seo_blog_article',
        platform: req.body.platform || 'website',
        userId: req.user?.id,
        apiKeyId: req.apiKey?.id
      });

      res.locals.inputTokens = response.usage.inputTokens;
      res.locals.outputTokens = response.usage.outputTokens;

      res.status(200).json(response);
    } catch (error: any) {
      res.locals.errorMessage = error.message;
      next(error);
    }
  }

  static async generateSocial(req: Request, res: Response, next: NextFunction) {
    try {
      const response = await ContentService.generateContent({
        ...req.body,
        contentType: req.body.contentType || 'instagram_caption',
        platform: req.body.platform || 'instagram',
        userId: req.user?.id,
        apiKeyId: req.apiKey?.id
      });

      res.locals.inputTokens = response.usage.inputTokens;
      res.locals.outputTokens = response.usage.outputTokens;

      res.status(200).json(response);
    } catch (error: any) {
      res.locals.errorMessage = error.message;
      next(error);
    }
  }

  static async generateBusiness(req: Request, res: Response, next: NextFunction) {
    try {
      const response = await ContentService.generateContent({
        ...req.body,
        contentType: req.body.contentType || 'google_business_profile_post',
        platform: req.body.platform || 'google_business',
        userId: req.user?.id,
        apiKeyId: req.apiKey?.id
      });

      res.locals.inputTokens = response.usage.inputTokens;
      res.locals.outputTokens = response.usage.outputTokens;

      res.status(200).json(response);
    } catch (error: any) {
      res.locals.errorMessage = error.message;
      next(error);
    }
  }

  static async previewPrompt(req: Request, res: Response, next: NextFunction) {
    try {
      const businessProfile = await ContentService.resolveBusinessProfile(req.body.businessId, req.user?.id);
      const prompt = ContentService.previewPrompt({
        ...req.body,
        businessProfile
      });

      res.status(200).json({
        success: true,
        prompt
      });
    } catch (error: any) {
      next(error);
    }
  }
}
