import { describe, it, expect } from 'vitest';
import { generateContentSchema } from '../src/validators/contentValidators.js';
import { registerSchema, loginSchema } from '../src/validators/authValidators.js';

describe('API Request Validation', () => {
  it('should accept valid generation payload', async () => {
    const payload = {
      topic: 'How to scale SaaS to 10k MRR',
      contentType: 'seo_blog_article',
      platform: 'website',
      tone: 'educational',
      length: '1500',
      keywords: ['saas growth', 'mrr']
    };

    const parsed = await generateContentSchema.parseAsync(payload);
    expect(parsed.topic).toBe(payload.topic);
    expect(parsed.tone).toBe('educational');
  });

  it('should reject generation request with missing or short topic', async () => {
    await expect(generateContentSchema.parseAsync({
      topic: 'a'
    })).rejects.toThrow();

    await expect(generateContentSchema.parseAsync({
      contentType: 'blog'
    })).rejects.toThrow();
  });

  it('should validate user registration schemas correctly', async () => {
    const validUser = {
      email: 'founder@startup.com',
      password: 'StrongPassword123!',
      fullName: 'Jane Doe',
      businessName: 'Innovate AI'
    };
    const parsed = await registerSchema.parseAsync(validUser);
    expect(parsed.email).toBe('founder@startup.com');

    // Invalid email
    await expect(registerSchema.parseAsync({
      ...validUser,
      email: 'not-an-email'
    })).rejects.toThrow();

    // Password too short
    await expect(registerSchema.parseAsync({
      ...validUser,
      password: '123'
    })).rejects.toThrow();
  });
});
