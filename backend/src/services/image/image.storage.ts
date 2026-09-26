import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface ImageStorageService {
  upload(image: Buffer, mimeType?: string, fileName?: string): Promise<string>;
  delete(url: string): Promise<void>;
}

export class ExternalImageStorageService implements ImageStorageService {
  async upload(image: Buffer, mimeType: string = 'image/png', fileName?: string): Promise<string> {
    // If given an existing remote URL, simply returns it.
    // In external mode, the provider's durable CDN URL is retained.
    return fileName || `https://storage.dxgen.ai/images/${uuidv4()}.png`;
  }

  async delete(url: string): Promise<void> {
    // No-op for external CDN
  }
}

export class LocalDiskImageStorageService implements ImageStorageService {
  private uploadDir: string;

  constructor(customDir?: string) {
    this.uploadDir = customDir || path.resolve(process.cwd(), 'uploads/images');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(image: Buffer, mimeType: string = 'image/png', fileName?: string): Promise<string> {
    const ext = mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'jpg' : 'png';
    const name = fileName || `${uuidv4()}.${ext}`;
    const filePath = path.join(this.uploadDir, name);
    await fs.promises.writeFile(filePath, image);
    return `/uploads/images/${name}`;
  }

  async delete(url: string): Promise<void> {
    const fileName = path.basename(url);
    const filePath = path.join(this.uploadDir, fileName);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }
}

export class ImageStorageFactory {
  static getStorage(provider: string = 'external'): ImageStorageService {
    if (provider === 'local') {
      return new LocalDiskImageStorageService();
    }
    return new ExternalImageStorageService();
  }
}
