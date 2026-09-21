import { createClient } from 'redis';
import { env } from './env.js';

export const redis = createClient({ url: env.REDIS_URL });

redis.on('error', (error: unknown) => {
    console.error('Redis client error', error);
});
