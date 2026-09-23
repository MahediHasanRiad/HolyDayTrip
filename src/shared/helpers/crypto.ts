import { createHash, randomInt, randomBytes } from 'node:crypto';

export const sha256 = (value: string): string => createHash('sha256').update(value).digest('hex');
export const generateOpaqueToken = (): string => randomBytes(48).toString('base64url');
export const generateOtp = (): string => randomInt(0, 1_000_000).toString().padStart(6, '0');
