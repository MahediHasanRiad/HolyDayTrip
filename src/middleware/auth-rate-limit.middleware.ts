import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redis } from '../config/redis.js';
import { sha256 } from '../shared/helpers/crypto.js';

export const authRateLimit = (prefix: string, limit: number) =>
    rateLimit({
        windowMs: 15 * 60_000,
        limit,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        keyGenerator: (request) => {
            const candidate =
                typeof request.body?.email === 'string' ? request.body.email.toLowerCase() : '';
            return `${prefix}:${ipKeyGenerator(request.ip ?? '')}:${candidate ? sha256(candidate) : 'anonymous'}`;
        },
        ...(redis.isOpen
            ? {
                  store: new RedisStore({
                      prefix: `rate-limit:auth:${prefix}:`,
                      sendCommand: (...args: string[]) => redis.sendCommand(args)
                  })
              }
            : {})
    });
