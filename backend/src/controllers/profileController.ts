import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db.js';
import { AppError } from '../middleware/errorHandler.js';

export class ProfileController {
  static async listProfiles(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const profiles = await db.query(
        'SELECT * FROM business_profiles WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );
      res.status(200).json({
        success: true,
        profiles
      });
    } catch (error) {
      next(error);
    }
  }

  static async createProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const profileId = `prof_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
      let businessId = req.body.businessId;

      if (!businessId) {
        // Create business record if not provided
        businessId = `biz_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
        const now = new Date().toISOString();
        await db.execute(
          'INSERT INTO businesses (id, user_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
          [businessId, userId, req.body.name, now, now]
        );
      }

      const now = new Date().toISOString();
      await db.execute(`
        INSERT INTO business_profiles (
          id, business_id, user_id, name, industry, description, website,
          location, target_audience, services, products, brand_voice, contact_info,
          cta, usps, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        profileId,
        businessId,
        userId,
        req.body.name,
        req.body.industry || '',
        req.body.description || '',
        req.body.website || '',
        req.body.location || '',
        req.body.targetAudience || '',
        req.body.services || '',
        req.body.products || '',
        req.body.brandVoice || '',
        req.body.contactInfo || '',
        req.body.cta || '',
        req.body.usps || '',
        now,
        now
      ]);

      const created = await db.queryOne('SELECT * FROM business_profiles WHERE id = ?', [profileId]);
      res.status(201).json({
        success: true,
        message: 'Business profile created successfully.',
        profile: created
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const profile = await db.queryOne('SELECT * FROM business_profiles WHERE id = ?', [id]);
      if (!profile) {
        const err: AppError = new Error('Business profile not found.');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        return next(err);
      }

      if (profile.user_id !== userId && req.user?.role === 'business_user') {
        const err: AppError = new Error('Unauthorized to modify this profile.');
        err.statusCode = 403;
        err.code = 'FORBIDDEN';
        return next(err);
      }

      const now = new Date().toISOString();
      await db.execute(`
        UPDATE business_profiles SET
          name = COALESCE(?, name),
          industry = COALESCE(?, industry),
          description = COALESCE(?, description),
          website = COALESCE(?, website),
          location = COALESCE(?, location),
          target_audience = COALESCE(?, target_audience),
          services = COALESCE(?, services),
          products = COALESCE(?, products),
          brand_voice = COALESCE(?, brand_voice),
          contact_info = COALESCE(?, contact_info),
          cta = COALESCE(?, cta),
          usps = COALESCE(?, usps),
          updated_at = ?
        WHERE id = ?
      `, [
        req.body.name,
        req.body.industry,
        req.body.description,
        req.body.website,
        req.body.location,
        req.body.targetAudience,
        req.body.services,
        req.body.products,
        req.body.brandVoice,
        req.body.contactInfo,
        req.body.cta,
        req.body.usps,
        now,
        id
      ]);

      const updated = await db.queryOne('SELECT * FROM business_profiles WHERE id = ?', [id]);
      res.status(200).json({
        success: true,
        message: 'Business profile updated successfully.',
        profile: updated
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const profile = await db.queryOne('SELECT * FROM business_profiles WHERE id = ?', [id]);
      if (!profile) {
        const err: AppError = new Error('Business profile not found.');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        return next(err);
      }

      if (profile.user_id !== userId && req.user?.role === 'business_user') {
        const err: AppError = new Error('Unauthorized to delete this profile.');
        err.statusCode = 403;
        err.code = 'FORBIDDEN';
        return next(err);
      }

      await db.execute('DELETE FROM business_profiles WHERE id = ?', [id]);
      res.status(200).json({
        success: true,
        message: 'Business profile deleted successfully.'
      });
    } catch (error) {
      next(error);
    }
  }
}
