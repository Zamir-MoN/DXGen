import { ParsedAiContent } from './ResponseParser.js';

export interface FormattedContentResult {
  title: string;
  body: string;
  metaTitle?: string;
  metaDescription?: string;
  slug?: string;
  keywords?: string[];
  faq?: Array<{ question: string; answer: string }>;
  hashtags?: string[];
  cta?: string;
  readingTimeMinutes?: number;
  wordCount: number;
}

export class ContentFormatter {
  static format(parsed: ParsedAiContent, contentType: string, platform: string): FormattedContentResult {
    const isBlog = contentType.includes('blog') || platform.includes('website') || contentType.includes('article');
    const isSocial = platform.includes('instagram') || platform.includes('twitter') || platform.includes('facebook') || platform.includes('linkedin');

    // Calculate word count
    const words = parsed.body.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

    const result: FormattedContentResult = {
      title: parsed.title,
      body: parsed.body,
      wordCount,
      readingTimeMinutes,
      cta: parsed.cta
    };

    if (isBlog) {
      result.metaTitle = parsed.metaTitle || `${parsed.title} | Complete Guide`;
      result.metaDescription = parsed.metaDescription || parsed.body.substring(0, 150).replace(/[#*`\n]/g, ' ').trim() + '...';
      result.slug = parsed.slug || parsed.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      result.keywords = parsed.keywords || [];
      result.faq = parsed.faq || [];
    }

    if (isSocial || (parsed.hashtags && parsed.hashtags.length > 0)) {
      result.hashtags = parsed.hashtags || [];
    }

    return result;
  }
}
