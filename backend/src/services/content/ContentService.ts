import { v4 as uuidv4 } from 'uuid';
import { PromptBuilder, PromptInput, BusinessProfileData } from '../prompt/PromptBuilder.js';
import { geminiService } from '../ai/GeminiService.js';
import { ResponseParser } from './ResponseParser.js';
import { ContentFormatter, FormattedContentResult } from './ContentFormatter.js';
import { db } from '../../database/db.js';

export interface GenerateContentRequest extends PromptInput {
  userId?: string;
  businessId?: string;
  apiKeyId?: string;
  modelOverride?: string;
}

export interface GenerateContentResponse {
  success: boolean;
  requestId: string;
  contentId: string;
  content: FormattedContentResult;
  prompt: string;
  usage: {
    model: string;
    inputTokens: number;
    outputTokens: number;
    generationTimeMs: number;
  };
}

export class ContentService {
  static async resolveBusinessProfile(businessId?: string, userId?: string): Promise<BusinessProfileData | undefined> {
    if (!businessId) {
      if (userId) {
        // Auto-fetch latest user profile
        const profile = await db.queryOne(
          'SELECT * FROM business_profiles WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
          [userId]
        );
        if (profile) {
          return {
            name: profile.name,
            industry: profile.industry,
            description: profile.description,
            website: profile.website,
            location: profile.location,
            targetAudience: profile.target_audience,
            services: profile.services,
            products: profile.products,
            brandVoice: profile.brand_voice,
            contactInfo: profile.contact_info,
            cta: profile.cta,
            usps: profile.usps
          };
        }
      }
      return undefined;
    }

    const profile = await db.queryOne(
      'SELECT * FROM business_profiles WHERE id = ? OR business_id = ? LIMIT 1',
      [businessId, businessId]
    );

    if (!profile) return undefined;

    return {
      name: profile.name,
      industry: profile.industry,
      description: profile.description,
      website: profile.website,
      location: profile.location,
      targetAudience: profile.target_audience,
      services: profile.services,
      products: profile.products,
      brandVoice: profile.brand_voice,
      contactInfo: profile.contact_info,
      cta: profile.cta,
      usps: profile.usps
    };
  }

  static previewPrompt(input: PromptInput): string {
    return PromptBuilder.buildPrompt(input);
  }

  static async generateContent(params: GenerateContentRequest): Promise<GenerateContentResponse> {
    const requestId = `req_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
    const contentId = `cnt_${uuidv4().replace(/-/g, '').slice(0, 16)}`;

    // Resolve business profile if not explicitly populated
    let businessProfile = params.businessProfile;
    if (!businessProfile && (params.businessId || params.userId)) {
      businessProfile = await this.resolveBusinessProfile(params.businessId, params.userId);
    }

    // 1. Build optimized internal prompt
    const prompt = PromptBuilder.buildPrompt({
      ...params,
      businessProfile
    });

    // 2. Call AI Service
    const aiResult = await geminiService.generate(prompt, params.modelOverride);

    // 3. Parse JSON response
    const parsed = ResponseParser.parse(aiResult.rawText, params.topic);

    // 4. Format Content
    const formatted = ContentFormatter.format(parsed, params.contentType, params.platform);

    // 5. Store record in Database
    const now = new Date().toISOString();
    await db.execute(`
      INSERT INTO content_generations (
        id, user_id, business_id, api_key_id, topic, content_type, platform, tone,
        length, language, keywords, audience, prompt_used, title, body, meta_title,
        meta_description, slug, faq, cta, model, input_tokens, output_tokens,
        generation_time_ms, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      contentId,
      params.userId || null,
      params.businessId || null,
      params.apiKeyId || null,
      params.topic,
      params.contentType,
      params.platform,
      params.tone,
      String(params.length),
      params.language || 'English',
      JSON.stringify(params.keywords || []),
      params.audience || '',
      prompt,
      formatted.title,
      formatted.body,
      formatted.metaTitle || '',
      formatted.metaDescription || '',
      formatted.slug || '',
      JSON.stringify(formatted.faq || []),
      formatted.cta || '',
      aiResult.model,
      aiResult.inputTokens,
      aiResult.outputTokens,
      aiResult.generationTimeMs,
      now
    ]);

    return {
      success: true,
      requestId,
      contentId,
      content: formatted,
      prompt,
      usage: {
        model: aiResult.model,
        inputTokens: aiResult.inputTokens,
        outputTokens: aiResult.outputTokens,
        generationTimeMs: aiResult.generationTimeMs
      }
    };
  }
}
