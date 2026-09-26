import { ImageProvider, ImageProviderModelInfo } from './image-provider.interface.js';
import { ImageGenerationOptions, ImageGenerationResult } from '../image.types.js';
import { config } from '../../../config/index.js';
import { v4 as uuidv4 } from 'uuid';

export class PixazoError extends Error {
  code: string;
  statusCode: number;
  details?: any;

  constructor(message: string, code: string = 'IMAGE_GENERATION_FAILED', statusCode: number = 500, details?: any) {
    super(message);
    this.name = 'PixazoError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class PixazoProvider implements ImageProvider {
  readonly name = 'pixazo';

  private apiKey: string;
  private baseUrl: string;
  private timeoutMs: number;
  private maxRetries: number;

  constructor() {
    this.apiKey = config.image.pixazo.apiKey;
    this.baseUrl = config.image.pixazo.baseUrl;
    this.timeoutMs = config.image.timeoutMs || 60000;
    this.maxRetries = config.image.maxRetries || 2;
  }

  getSupportedModels(): ImageProviderModelInfo[] {
    return [
      {
        id: 'flux-schnell',
        name: 'FLUX.1 Schnell',
        provider: 'pixazo',
        description: 'Ultra-fast sub-second diffusion model generating high-fidelity photorealistic and commercial imagery',
        aspectRatios: ['1:1', '16:9', '4:5', '9:16'],
        defaultDimensions: { width: 1024, height: 1024 }
      },
      {
        id: 'sdxl',
        name: 'SDXL Turbo / 1.0',
        provider: 'pixazo',
        description: 'High-resolution Stable Diffusion XL model with rich detail rendering and fine artistic control',
        aspectRatios: ['1:1', '16:9', '4:5', '9:16'],
        defaultDimensions: { width: 1024, height: 1024 }
      }
    ];
  }

  /**
   * Resolves the gateway URL for the requested model
   */
  private getModelEndpoint(modelId?: string): string {
    const model = (modelId || config.image.defaultModel).toLowerCase();
    
    // Mappings for Pixazo Gateway endpoints
    if (model.includes('flux') || model.includes('schnell')) {
      return `${this.baseUrl}/flux-1-schnell/v1/getData`;
    }
    if (model.includes('sdxl') || model.includes('turbo')) {
      return `${this.baseUrl}/sdxlTurbo/v2/getData`;
    }
    if (model.includes('sd3')) {
      return `${this.baseUrl}/sd3/v1/getData`;
    }
    
    // Default to flux-1-schnell
    return `${this.baseUrl}/flux-1-schnell/v1/getData`;
  }

  /**
   * Generates an image using Pixazo API
   */
  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    const startTime = Date.now();
    const model = options.model || config.image.defaultModel;
    const endpoint = this.getModelEndpoint(model);

    // If no API key configured, use high quality local placeholder
    if (!this.apiKey || this.apiKey.trim() === '') {
      console.warn('[PixazoProvider] PIXAZO_API_KEY is not configured. Generating placeholder preview image.');
      return this.generateFallbackImage(options, startTime);
    }

    // Build the payload supported by Pixazo
    // Note: FLUX Schnell gateway strictly accepts { prompt: string }. Sending negative_prompt causes gateway hangs.
    const isFlux = model.toLowerCase().includes('flux');
    let effectivePrompt = options.prompt.trim();

    if (isFlux && options.negativePrompt && options.negativePrompt.trim()) {
      effectivePrompt += `, without: ${options.negativePrompt.trim()}`;
    }

    const payload: Record<string, any> = {
      prompt: effectivePrompt
    };

    // Only send negative_prompt for models that explicitly support it (like SDXL)
    if (!isFlux && options.negativePrompt && options.negativePrompt.trim()) {
      payload.negative_prompt = options.negativePrompt.trim();
    }

    let lastError: Error | null = null;
    let attempts = 0;

    while (attempts <= this.maxRetries) {
      attempts++;
      try {
        const result = await this.executeRequest(endpoint, payload);
        const generationTimeMs = Date.now() - startTime;

        const id = `img_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
        return {
          id,
          url: result.url,
          width: options.width || config.image.defaultWidth,
          height: options.height || config.image.defaultHeight,
          model,
          provider: this.name,
          prompt: options.prompt,
          style: options.style,
          aspectRatio: options.aspectRatio || '1:1',
          generationTimeMs,
          createdAt: new Date().toISOString()
        };
      } catch (err: any) {
        lastError = err;
        
        // Do NOT retry timeouts (retrying an 80s timeout would make the request 160s+)
        // Only retry temporary server errors (500, 502, 503, 504)
        const isRetryable = (err.statusCode >= 500 && err.statusCode <= 504) && err.code !== 'IMAGE_TIMEOUT';

        if (!isRetryable || attempts > this.maxRetries) {
          break;
        }

        const delay = Math.pow(2, attempts) * 1000;
        console.warn(`[PixazoProvider] Temporary failure (${err.message}). Retrying attempt ${attempts}/${this.maxRetries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // If Pixazo request failed, normalize error
    if (lastError instanceof PixazoError) {
      throw lastError;
    }

    throw new PixazoError(
      lastError?.message || 'Image generation failed via Pixazo.',
      'IMAGE_GENERATION_FAILED',
      502,
      { attempts }
    );
  }

  /**
   * Internal HTTP executor with timeout and error normalization
   */
  private async executeRequest(endpoint: string, payload: Record<string, any>): Promise<{ url: string }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': this.apiKey,
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timer);

      // Handle HTTP error statuses
      if (!response.ok) {
        const status = response.status;
        let responseBody = '';
        try {
          responseBody = await response.text();
        } catch {
          // ignore
        }

        if (status === 401) {
          throw new PixazoError('Pixazo API key is invalid or expired. Check PIXAZO_API_KEY in configuration.', 'IMAGE_PROVIDER_UNAUTHORIZED', 401);
        }
        if (status === 402) {
          throw new PixazoError('Pixazo account balance or credit quota is insufficient for this model.', 'IMAGE_INSUFFICIENT_BALANCE', 402);
        }
        if (status === 403) {
          throw new PixazoError('Access to the requested Pixazo model is forbidden for this subscription key.', 'IMAGE_MODEL_UNAVAILABLE', 403);
        }
        if (status === 404) {
          throw new PixazoError('The requested Pixazo image model endpoint is not available.', 'IMAGE_MODEL_UNAVAILABLE', 404);
        }
        if (status === 429) {
          throw new PixazoError('Pixazo API rate limit reached. Please retry in a few moments.', 'IMAGE_RATE_LIMITED', 429);
        }
        if (status >= 500) {
          throw new PixazoError('Pixazo image generation service is temporarily unavailable.', 'IMAGE_PROVIDER_UNAVAILABLE', 502);
        }

        throw new PixazoError(
          `Pixazo image generation failed (${status}): ${responseBody.slice(0, 200)}`,
          'IMAGE_GENERATION_FAILED',
          status
        );
      }

      const data = await response.json() as any;

      // Extract image URL from normalized responses
      let imageUrl = '';
      if (typeof data === 'string' && data.startsWith('http')) {
        imageUrl = data;
      } else if (data?.output) {
        if (Array.isArray(data.output) && data.output.length > 0) {
          imageUrl = data.output[0];
        } else if (typeof data.output === 'string') {
          imageUrl = data.output;
        } else if (data.output?.media_url) {
          imageUrl = Array.isArray(data.output.media_url) ? data.output.media_url[0] : data.output.media_url;
        }
      } else if (data?.url) {
        imageUrl = data.url;
      } else if (data?.data && Array.isArray(data.data) && data.data[0]?.url) {
        imageUrl = data.data[0].url;
      }

      if (!imageUrl) {
        throw new PixazoError(
          'Pixazo returned an unexpected response format without an image URL.',
          'IMAGE_GENERATION_FAILED',
          502
        );
      }

      return { url: imageUrl };
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === 'AbortError' || err.code === 20) {
        throw new PixazoError(
          `Image generation timed out after ${this.timeoutMs / 1000} seconds.`,
          'IMAGE_TIMEOUT',
          504
        );
      }
      if (err instanceof PixazoError) {
        throw err;
      }
      throw new PixazoError(
        `Failed to communicate with Pixazo: ${err.message}`,
        'IMAGE_PROVIDER_UNAVAILABLE',
        502
      );
    }
  }

  /**
   * Pings Pixazo to test connectivity and credentials
   */
  async testConnection(): Promise<{ ok: boolean; latencyMs: number; error?: string; model?: string }> {
    if (!this.apiKey || this.apiKey.trim() === '') {
      return { ok: false, latencyMs: 0, error: 'PIXAZO_API_KEY is not configured in backend environment.' };
    }

    const start = Date.now();
    try {
      // Test generation with a simple minimal prompt to verify model & credit
      const endpoint = this.getModelEndpoint('flux-schnell');
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': this.apiKey,
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ prompt: 'Pixazo connection diagnostic ping' }),
        signal: controller.signal
      });

      clearTimeout(timer);
      const latencyMs = Date.now() - start;

      if (response.ok) {
        return { ok: true, latencyMs, model: 'FLUX.1 Schnell' };
      }

      const text = await response.text();
      return {
        ok: false,
        latencyMs,
        error: `HTTP ${response.status}: ${text.slice(0, 150)}`
      };
    } catch (err: any) {
      return {
        ok: false,
        latencyMs: Date.now() - start,
        error: err.message
      };
    }
  }

  /**
   * Local SVG fallback generator when offline or no API key is configured
   */
  private generateFallbackImage(options: ImageGenerationOptions, startTime: number): ImageGenerationResult {
    const width = options.width || config.image.defaultWidth;
    const height = options.height || config.image.defaultHeight;
    const promptSnippet = (options.prompt || 'Generated Concept').slice(0, 60);
    const style = options.style || 'Realistic';

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#090d16"/>
            <stop offset="50%" stop-color="#0f172a"/>
            <stop offset="100%" stop-color="#1e1b4b"/>
          </linearGradient>
          <linearGradient id="acc" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#6366f1"/>
            <stop offset="100%" stop-color="#06b6d4"/>
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#bg)"/>
        <circle cx="${width / 2}" cy="${height / 2 - 40}" r="${Math.min(width, height) / 5}" fill="url(#acc)" opacity="0.2"/>
        <circle cx="${width / 2}" cy="${height / 2 - 40}" r="${Math.min(width, height) / 7}" fill="url(#acc)" opacity="0.4"/>
        <text x="50%" y="${height / 2 - 30}" font-family="system-ui, sans-serif" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle">DXGen AI Image</text>
        <text x="50%" y="${height / 2 + 10}" font-family="system-ui, sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">Style: ${style} | ${width}x${height}</text>
        <text x="50%" y="${height / 2 + 45}" font-family="system-ui, sans-serif" font-size="12" fill="#64748b" text-anchor="middle">${promptSnippet}...</text>
      </svg>
    `.trim();

    const base64 = Buffer.from(svg).toString('base64');
    const url = `data:image/svg+xml;base64,${base64}`;

    return {
      id: `img_${uuidv4().replace(/-/g, '').slice(0, 16)}`,
      url,
      width,
      height,
      model: options.model || config.image.defaultModel,
      provider: this.name,
      prompt: options.prompt,
      style: options.style,
      aspectRatio: options.aspectRatio || '1:1',
      generationTimeMs: Date.now() - startTime,
      createdAt: new Date().toISOString()
    };
  }
}
