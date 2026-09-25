import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db.js';
import { config } from '../config/index.js';
import { AppError } from '../middleware/errorHandler.js';

const ADMIN_EMAILS = ['admin', 'admin@dxgen.ai', 'zamir.0huo@gmail.com'];

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, fullName, businessName } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

      // Check if email already exists
      const existing = await db.queryOne('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
      if (existing) {
        const err: AppError = new Error('An account with this email address already exists.');
        err.statusCode = 400;
        err.code = 'EMAIL_EXISTS';
        return next(err);
      }

      const userId = `usr_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
      const hash = await bcrypt.hash(password, 10);
      const now = new Date().toISOString();

      // Check if this is the owner email or first user
      const userCount = await db.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM users');
      const isOwner = ADMIN_EMAILS.includes(normalizedEmail) || (userCount?.count || 0) === 0;
      const role = isOwner ? 'owner' : 'business_user';

      await db.execute(`
        INSERT INTO users (id, email, password_hash, full_name, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [userId, normalizedEmail, hash, fullName.trim(), role, now, now]);

      // Create default business
      const bizId = `biz_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
      const bName = businessName?.trim() || `${fullName.trim()}'s Business`;
      await db.execute(`
        INSERT INTO businesses (id, user_id, name, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `, [bizId, userId, bName, now, now]);

      // Create initial business profile
      const profId = `prof_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
      await db.execute(`
        INSERT INTO business_profiles (
          id, business_id, user_id, name, industry, description, website,
          location, target_audience, services, products, brand_voice, contact_info,
          cta, usps, created_at, updated_at
        ) VALUES (?, ?, ?, ?, '', '', '', '', '', '', '', '', '', '', '', ?, ?)
      `, [profId, bizId, userId, bName, now, now]);

      const token = jwt.sign(
        { id: userId, email: normalizedEmail, role, fullName: fullName.trim() },
        config.jwtSecret,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        success: true,
        message: 'Account registered successfully.',
        token,
        user: {
          id: userId,
          email: normalizedEmail,
          fullName: fullName.trim(),
          role,
          businessId: bizId,
          businessName: bName
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const normalizedEmail = (email || '').toLowerCase().trim();
      let user = await db.queryOne(
        'SELECT * FROM users WHERE LOWER(email) = ?',
        [normalizedEmail]
      );

      // Support 'admin' as alias for 'admin@dxgen.ai' and vice versa
      if (!user && (normalizedEmail === 'admin' || normalizedEmail === 'admin@dxgen.ai')) {
        user = await db.queryOne(
          'SELECT * FROM users WHERE LOWER(email) IN ("admin", "admin@dxgen.ai") LIMIT 1'
        );
      }

      if (!user) {
        const err: AppError = new Error('Invalid email or password.');
        err.statusCode = 401;
        err.code = 'INVALID_CREDENTIALS';
        return next(err);
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        const err: AppError = new Error('Invalid email or password.');
        err.statusCode = 401;
        err.code = 'INVALID_CREDENTIALS';
        return next(err);
      }

      // Automatically promote designated admin/owner emails
      if (ADMIN_EMAILS.includes(normalizedEmail) && user.role !== 'owner') {
        await db.execute("UPDATE users SET role = 'owner' WHERE id = ?", [user.id]);
        user.role = 'owner';
      }

      // Fetch primary business
      const biz = await db.queryOne('SELECT id, name FROM businesses WHERE user_id = ? LIMIT 1', [user.id]);

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, fullName: user.full_name },
        config.jwtSecret,
        { expiresIn: '7d' }
      );

      res.status(200).json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          businessId: biz?.id,
          businessName: biz?.name
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const user = await db.queryOne(
        'SELECT id, email, full_name, role, created_at FROM users WHERE id = ?',
        [userId]
      );

      if (!user) {
        const err: AppError = new Error('User not found.');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        return next(err);
      }

      const normalizedEmail = user.email.toLowerCase().trim();
      if (ADMIN_EMAILS.includes(normalizedEmail) && user.role !== 'owner') {
        await db.execute("UPDATE users SET role = 'owner' WHERE id = ?", [user.id]);
        user.role = 'owner';
      }

      const businesses = await db.query('SELECT id, name, created_at FROM businesses WHERE user_id = ?', [userId]);
      const profiles = await db.query('SELECT * FROM business_profiles WHERE user_id = ?', [userId]);

      res.status(200).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          createdAt: user.created_at,
          businesses,
          profiles
        }
      });
    } catch (error) {
      next(error);
    }
  }
}
