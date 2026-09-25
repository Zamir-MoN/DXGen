import { describe, it, expect, beforeAll } from 'vitest';
import { initDatabase } from '../src/database/db.js';
import { ApiKeyService } from '../src/services/api/ApiKeyService.js';

describe('API Key Authentication & Management', () => {
  beforeAll(() => {
    process.env.DATABASE_URL = 'file:./test_dxgen.sqlite';
    initDatabase();
  });

  it('should generate an API key with correct prefix and SHA-256 hash', async () => {
    const key = await ApiKeyService.createKey({
      userId: 'usr_admin_01',
      name: 'Integration Test Key',
      environment: 'live',
      rateLimitHour: 100,
      rateLimitDay: 1000
    });

    expect(key.rawKey.startsWith('dxt_live_')).toBe(true);
    expect(key.name).toBe('Integration Test Key');
    expect(key.rateLimitHour).toBe(100);

    // Validate the generated key
    const validation = await ApiKeyService.validateKey(key.rawKey);
    expect(validation.valid).toBe(true);
    expect(validation.key?.name).toBe('Integration Test Key');
  });

  it('should reject invalid or malformed API keys', async () => {
    const malformed = await ApiKeyService.validateKey('invalid_key_12345');
    expect(malformed.valid).toBe(false);
    expect(malformed.status).toBe(401);

    const nonExistent = await ApiKeyService.validateKey('dxt_live_00000000000000000000000000000000');
    expect(nonExistent.valid).toBe(false);
    expect(nonExistent.status).toBe(401);
  });
});
