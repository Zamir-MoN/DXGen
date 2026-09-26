export type ImageStyle =
  | 'Realistic'
  | 'Commercial Photography'
  | 'Editorial'
  | 'Minimal'
  | '3D Render'
  | 'Illustration'
  | 'Vector'
  | 'Luxury'
  | 'Technology'
  | 'Corporate'
  | 'Lifestyle'
  | 'Product Photography'
  | 'Cinematic'
  | 'Artistic';

export type ImageAspectRatio = '1:1' | '16:9' | '4:5' | '9:16';

export interface ImageGenerationOptions {
  prompt: string;
  model?: string;
  width?: number;
  height?: number;
  style?: ImageStyle | string;
  aspectRatio?: ImageAspectRatio;
  negativePrompt?: string;
  seed?: number;
  numberOfImages?: number;
  metadata?: {
    userId?: string;
    businessId?: string;
    contentId?: string;
    requestId?: string;
  };
}

export interface ImageGenerationResult {
  id: string;
  url: string;
  width: number;
  height: number;
  model: string;
  provider: string;
  prompt: string;
  style?: string;
  aspectRatio?: string;
  generationTimeMs: number;
  createdAt: string;
}

export interface NormalizedImageResponse {
  success: boolean;
  requestId: string;
  image?: {
    id: string;
    url: string;
    width: number;
    height: number;
    model: string;
    provider: string;
    prompt: string;
    style?: string;
    aspectRatio?: string;
  };
  usage?: {
    provider: string;
    generationTimeMs: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface ImageGenerationRecord {
  id: string;
  user_id: string | null;
  business_id: string | null;
  content_id: string | null;
  request_id: string | null;
  provider: string;
  model: string;
  prompt: string;
  negative_prompt: string;
  style: string;
  aspect_ratio: string;
  width: number;
  height: number;
  image_url: string;
  status: 'completed' | 'failed' | 'queued';
  error_code: string | null;
  generation_time_ms: number;
  created_at: string;
}

export interface ImageUsageStats {
  imagesGeneratedToday: number;
  imagesGeneratedThisMonth: number;
  successfulImages: number;
  failedImages: number;
  averageGenerationTimeMs: number;
}
