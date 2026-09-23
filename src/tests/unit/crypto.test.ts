import { describe, expect, it } from 'vitest';
import { generateOpaqueToken, generateOtp, sha256 } from '../../shared/helpers/crypto.js';

describe('authentication cryptography helpers', () => {
    it('creates six digit OTPs without retaining a raw value', () => {
        expect(generateOtp()).toMatch(/^\d{6}$/);
        expect(sha256('123456')).toMatch(/^[a-f0-9]{64}$/);
    });

    it('creates high entropy opaque tokens', () => {
        expect(generateOpaqueToken()).not.toEqual(generateOpaqueToken());
    });
});
