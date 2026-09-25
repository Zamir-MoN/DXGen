export interface ParsedAiContent {
  title: string;
  body: string;
  metaTitle?: string;
  metaDescription?: string;
  slug?: string;
  keywords?: string[];
  faq?: Array<{ question: string; answer: string }>;
  hashtags?: string[];
  cta?: string;
}

export class ResponseParser {
  static parse(rawText: string, fallbackTopic: string): ParsedAiContent {
    let clean = rawText.trim();

    // Remove markdown code fences if wrapped
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    try {
      const parsed = JSON.parse(clean);
      return {
        title: parsed.title || fallbackTopic,
        body: parsed.body || clean,
        metaTitle: parsed.metaTitle || undefined,
        metaDescription: parsed.metaDescription || undefined,
        slug: parsed.slug || undefined,
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
        faq: Array.isArray(parsed.faq) ? parsed.faq : [],
        hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
        cta: parsed.cta || undefined
      };
    } catch (err) {
      console.warn('[ResponseParser] Failed to parse raw text as JSON, attempting regex extraction');
      // Fallback extraction
      const titleMatch = clean.match(/"title":\s*"([^"]+)"/);
      const bodyMatch = clean.match(/"body":\s*"((?:\\.|[^"\\])*)"/);
      
      return {
        title: titleMatch ? titleMatch[1] : fallbackTopic,
        body: bodyMatch ? bodyMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : clean,
        keywords: [],
        faq: [],
        hashtags: []
      };
    }
  }
}
