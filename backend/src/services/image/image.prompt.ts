import { ImageStyle, ImageAspectRatio } from './image.types.js';

export const STYLE_MODIFIERS: Record<string, string> = {
  'Realistic': 'realistic photography, natural lighting, high dynamic range, authentic textures, true-to-life details, 8k uhd',
  'Commercial Photography': 'professional commercial photography, studio softbox lighting, clean composition, high-end commercial aesthetic, ultra-detailed',
  'Editorial': 'editorial magazine quality, award-winning composition, narrative depth, artistic lighting, sophisticated styling',
  'Minimal': 'minimalist design, clean lines, abundant negative space, elegant composition, muted sophisticated color palette',
  '3D Render': 'octane 3D render, raytraced lighting, subsurface scattering, 8k resolution, photorealistic CGI, volumetric light',
  'Illustration': 'modern digital illustration, balanced vector aesthetic, crisp lines, contemporary color harmony',
  'Vector': 'clean vector graphic art, flat shading, scalable geometric shapes, vibrant color palette',
  'Luxury': 'luxurious aesthetic, opulent materials, refined ambient lighting, prestigious atmosphere, premium finish',
  'Technology': 'cutting-edge technology concept, sleek futuristic interface, subtle ambient glow, clean enterprise tech aesthetic',
  'Corporate': 'modern corporate setting, professional business ambiance, crisp architectural glass and steel, polished environment',
  'Lifestyle': 'candid lifestyle photography, warm natural sunlight, genuine emotion, authentic modern living',
  'Product Photography': 'high-end product photography, softbox lighting, shallow depth of field, pristine hero shot, crisp reflections',
  'Cinematic': 'cinematic film still, anamorphic lens flare, 35mm film grain, dramatic lighting, rich color grading, cinematic composition',
  'Artistic': 'artistic expression, creative brushwork, emotional color resonance, fine art concept, expressive lighting'
};

export const DEFAULT_NEGATIVE_PROMPT = 'blurry, low quality, distorted, deformed, duplicate objects, bad anatomy, watermark, unwanted text, logo, artifact, oversaturated, pixelated';

export interface BuildImagePromptParams {
  topic: string;
  style?: ImageStyle | string;
  platform?: string;
  aspectRatio?: ImageAspectRatio;
  customDirectives?: string;
}

export class ImagePromptBuilder {
  /**
   * Checks if a prompt is already a fully formed visual scene prompt created by the prompt builder
   */
  static isAlreadyEnhanced(prompt: string): boolean {
    if (!prompt) return false;
    const lower = prompt.toLowerCase();
    const hasNegativeDirectives = lower.includes('no text') || lower.includes('no watermark');
    const hasStyleOrComposition =
      lower.includes('studio softbox lighting') ||
      lower.includes('realistic photography') ||
      lower.includes('clean photographic composition') ||
      lower.includes('clean composition') ||
      lower.includes('octane 3d render') ||
      lower.includes('editorial magazine quality') ||
      lower.includes('high dynamic range');

    return hasNegativeDirectives && hasStyleOrComposition;
  }

  /**
   * Builds an enhanced visual prompt incorporating style and composition
   */
  static buildPrompt(params: BuildImagePromptParams): string {
    const rawTopic = (params.topic || '').trim();

    // If the topic is already an enhanced visual prompt, avoid recursive wrapping
    if (this.isAlreadyEnhanced(rawTopic)) {
      return rawTopic;
    }

    const parts: string[] = [];

    // 1. Core subject
    parts.push(rawTopic);

    // 2. Style enhancement
    const selectedStyle = params.style || 'Realistic';
    const modifier = STYLE_MODIFIERS[selectedStyle] || STYLE_MODIFIERS['Realistic'];
    parts.push(modifier);

    // 3. Platform framing
    if (params.platform) {
      const p = params.platform.toLowerCase();
      if (p.includes('blog') || p.includes('website')) {
        parts.push('wide banner composition, suitable for website hero image, no text overlays');
      } else if (p.includes('instagram')) {
        parts.push('eye-catching social media visual, vibrant, high engagement composition, no text');
      } else if (p.includes('linkedin')) {
        parts.push('professional B2B business editorial aesthetic, thought leadership visual');
      } else if (p.includes('business') || p.includes('google')) {
        parts.push('local business setting, authentic storefront or service environment');
      }
    }

    // 4. Custom directives
    if (params.customDirectives && params.customDirectives.trim()) {
      parts.push(params.customDirectives.trim());
    }

    // 5. Negative prompt instructions embedded into prompt text for models without separate negative input
    parts.push('no text, no watermark, no logos, clean photographic composition');

    return parts.join(', ');
  }

  /**
   * Resolves recommended dimensions based on aspect ratio
   */
  static getDimensionsForAspectRatio(aspectRatio?: ImageAspectRatio): { width: number; height: number } {
    switch (aspectRatio) {
      case '16:9':
        return { width: 1280, height: 720 };
      case '4:5':
        return { width: 896, height: 1120 };
      case '9:16':
        return { width: 720, height: 1280 };
      case '1:1':
      default:
        return { width: 1024, height: 1024 };
    }
  }

  /**
   * Maps platform to recommended aspect ratio
   */
  static getPlatformAspectRatio(platform?: string): ImageAspectRatio {
    if (!platform) return '1:1';
    const p = platform.toLowerCase();
    if (p.includes('blog') || p.includes('website') || p.includes('article') || p.includes('newsletter')) {
      return '16:9';
    }
    if (p.includes('instagram')) {
      return '4:5';
    }
    if (p.includes('linkedin') || p.includes('twitter') || p.includes('facebook')) {
      return '16:9';
    }
    if (p.includes('business') || p.includes('google')) {
      return '1:1';
    }
    return '1:1';
  }
}

export class ContentImagePromptBuilder {
  /**
   * Generates a visual image prompt from generated blog or post content
   */
  static buildPromptFromContent(params: {
    title?: string;
    topic: string;
    platform?: string;
    contentType?: string;
    summaryOrExcerpt?: string;
    style?: ImageStyle | string;
  }): { prompt: string; aspectRatio: ImageAspectRatio; style: string } {
    const platform = params.platform || 'website';
    const aspectRatio = ImagePromptBuilder.getPlatformAspectRatio(platform);
    const style = (params.style as string) || (platform === 'website' ? 'Commercial Photography' : 'Realistic');

    // Extract core visual theme without editorial headline noise
    let subject = (params.title || params.topic)
      .replace(/[^\w\s-]/g, ' ')
      .replace(/\b(?:the\s+definitive\s+guide\s+to|the\s+ultimate\s+guide\s+to|everything\s+you\s+need\s+to\s+know\s+about|step\s+by\s+step\s+guide\s+to)\b/gi, '')
      .replace(/\b(?:how\s+to\s+(?:cure|fix|treat|overcome|get|build|start|use))\b/gi, '')
      .replace(/\b(?:causes\s+and\s+(?:solutions|cures|treatments))\b/gi, 'solutions and care')
      .replace(/\b(?:permanently|fast|easily|effectively|in\s+2026)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!subject) subject = params.topic.trim();

    let visualConcept = `Aesthetic visual of ${subject}`;

    if (platform === 'website') {
      visualConcept = `Aesthetic hero visual of ${subject}, clean modern composition, natural studio lighting`;
    } else if (platform === 'instagram') {
      visualConcept = `Vibrant lifestyle visual of ${subject}, high contrast, aesthetic lighting, premium modern vibe`;
    } else if (platform === 'linkedin') {
      visualConcept = `Executive commercial visual of ${subject}, modern professional setting, clean composition`;
    } else if (platform === 'google_business') {
      visualConcept = `Authentic storefront visual of ${subject}, clean welcoming setting`;
    }

    const fullPrompt = ImagePromptBuilder.buildPrompt({
      topic: visualConcept,
      style,
      platform,
      aspectRatio,
      customDirectives: 'depth of field, photorealistic, 8k uhd'
    });

    return {
      prompt: fullPrompt,
      aspectRatio,
      style
    };
  }
}
