import 'dotenv/config';
import { z } from 'zod';

const envSchema = z
    .object({
        NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
        PORT: z.coerce.number().int().min(1).max(65535).default(3000),
        DATABASE_URL: z.url(),
        REDIS_URL: z.url(),
        CORS_ORIGIN: z.url().optional(),
        AUTH_JWT_SECRET: z.string().min(32).default('development-only-auth-secret-change-me'),
        BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
        ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().min(60).max(3600).default(900),
        REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(30),
        GOOGLE_CLIENT_ID: z.string().min(1).optional(),
        BREVO_API_KEY: z.string().min(1).optional(),
        BREVO_SENDER_EMAIL: z.email().optional(),
        BREVO_SENDER_NAME: z.string().min(1).max(120).default('HolyDayTrip'),
        COOKIE_SECURE: z
            .enum(['true', 'false'])
            .transform((value) => value === 'true')
            .optional(),
        COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax')
    })
    .superRefine((value, context) => {
        if (value.NODE_ENV === 'production') {
            for (const key of [
                'GOOGLE_CLIENT_ID',
                'BREVO_API_KEY',
                'BREVO_SENDER_EMAIL'
            ] as const) {
                if (!value[key])
                    context.addIssue({
                        code: 'custom',
                        path: [key],
                        message: `${key} is required in production`
                    });
            }
            if (value.AUTH_JWT_SECRET === 'development-only-auth-secret-change-me')
                context.addIssue({
                    code: 'custom',
                    path: ['AUTH_JWT_SECRET'],
                    message: 'AUTH_JWT_SECRET must be configured in production'
                });
        }
    });

export const env = envSchema.parse(process.env);
