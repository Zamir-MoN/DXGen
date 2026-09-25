import { Request, Response } from 'express';
import { config } from '../config/index.js';
import { contentTypeRulesMap } from '../services/prompt/ContentTypeRules.js';
import { platformRulesMap } from '../services/prompt/PlatformRules.js';
import { toneRulesMap } from '../services/prompt/ToneRules.js';
import { db } from '../database/db.js';

export class MetadataController {
  static async getHealth(req: Request, res: Response) {
    let dbStatus = 'disconnected';
    try {
      await db.queryOne('SELECT 1 as ping');
      dbStatus = 'connected';
    } catch {
      dbStatus = 'error';
    }

    res.status(200).json({
      status: 'ok',
      service: 'content-api',
      version: '1.0.0',
      database: dbStatus,
      aiModel: config.gemini.model,
      timestamp: new Date().toISOString()
    });
  }

  static getModels(req: Request, res: Response) {
    res.status(200).json({
      success: true,
      activeModel: config.gemini.model,
      models: config.gemini.availableModels
    });
  }

  static getContentTypes(req: Request, res: Response) {
    const list = Object.entries(contentTypeRulesMap).map(([id, item]) => ({
      id,
      label: item.label,
      category: item.category,
      requirements: item.requirements
    }));

    res.status(200).json({
      success: true,
      contentTypes: list
    });
  }

  static getPlatforms(req: Request, res: Response) {
    const list = Object.entries(platformRulesMap).map(([id, item]) => ({
      id,
      name: item.name,
      rules: item.rules
    }));

    res.status(200).json({
      success: true,
      platforms: list
    });
  }

  static getTones(req: Request, res: Response) {
    const list = Object.entries(toneRulesMap).map(([id, description]) => ({
      id,
      label: id.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      description
    }));

    res.status(200).json({
      success: true,
      tones: list
    });
  }
}
