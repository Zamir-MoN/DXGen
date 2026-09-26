import { ImageAspectRatio, ImageStyle } from './image.types.js';

export const ALLOWED_STYLES: ImageStyle[] = [
  'Realistic',
  'Commercial Photography',
  'Editorial',
  'Minimal',
  '3D Render',
  'Illustration',
  'Vector',
  'Luxury',
  'Technology',
  'Corporate',
  'Lifestyle',
  'Product Photography',
  'Cinematic',
  'Artistic'
];

export const ALLOWED_ASPECT_RATIOS: ImageAspectRatio[] = ['1:1', '16:9', '4:5', '9:16'];

export const ALLOWED_DIMENSIONS = [
  { width: 1024, height: 1024, label: 'Square (1:1)' },
  { width: 1280, height: 720, label: 'Landscape Banner (16:9)' },
  { width: 896, height: 1120, label: 'Portrait (4:5)' },
  { width: 720, height: 1280, label: 'Story / Reel (9:16)' }
];

export function sanitizeDimension(val?: number, fallback: number = 1024): number {
  if (!val || typeof val !== 'number' || isNaN(val)) return fallback;
  // Bound between 256 and 2048
  const clamped = Math.max(256, Math.min(2048, val));
  // Round to nearest multiple of 16
  return Math.round(clamped / 16) * 16;
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
