export interface ImageGenerationOptions {
  prompt: string;
  provider?: 'gemini' | 'openai' | 'stability' | 'mock';
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3';
  style?: string;
  numberOfImages?: number;
}

export interface ImageGenerationResult {
  provider: string;
  images: Array<{
    url: string;
    revisedPrompt?: string;
  }>;
  createdAt: string;
}

export interface IImageGeneratorProvider {
  name: string;
  generate(options: ImageGenerationOptions): Promise<ImageGenerationResult>;
}

export class MockImageProvider implements IImageGeneratorProvider {
  name = 'mock';
  async generate(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    return {
      provider: 'mock',
      images: [
        {
          url: `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop&text=${encodeURIComponent(options.prompt.slice(0, 30))}`,
          revisedPrompt: options.prompt
        }
      ],
      createdAt: new Date().toISOString()
    };
  }
}

export class ImageGenerationService {
  private providers: Map<string, IImageGeneratorProvider> = new Map();

  constructor() {
    this.registerProvider(new MockImageProvider());
  }

  registerProvider(provider: IImageGeneratorProvider) {
    this.providers.set(provider.name.toLowerCase(), provider);
  }

  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    const providerName = (options.provider || 'mock').toLowerCase();
    const provider = this.providers.get(providerName);

    if (!provider) {
      throw new Error(`IMAGE_PROVIDER_NOT_FOUND: Provider "${providerName}" is not registered. Registered providers: ${Array.from(this.providers.keys()).join(', ')}`);
    }

    return await provider.generate(options);
  }
}

export const imageGenerationService = new ImageGenerationService();
