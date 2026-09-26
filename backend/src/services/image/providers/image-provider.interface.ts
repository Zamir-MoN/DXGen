import { ImageGenerationOptions, ImageGenerationResult } from '../image.types.js';

export interface ImageProviderModelInfo {
  id: string;
  name: string;
  provider: string;
  description: string;
  aspectRatios: string[];
  defaultDimensions: { width: number; height: number };
}

export interface ImageProvider {
  readonly name: string;
  generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult>;
  testConnection(): Promise<{ ok: boolean; latencyMs: number; error?: string; model?: string }>;
  getSupportedModels(): ImageProviderModelInfo[];
}
