import { z } from 'zod';
import { PASSWORD_MIN_LENGTH } from '../../../shared/constants/auth.js';

const clientType = z.enum(['browser', 'mobile']).default('browser');
const password = z.string().min(PASSWORD_MIN_LENGTH).max(128);
const email = z
    .email()
    .max(320)
    .transform((value) => value.toLowerCase());
const body = <T extends z.ZodRawShape>(shape: T) =>
    z.object({
        body: z.object(shape).strict(),
        params: z.object({}).strict(),
        query: z.object({}).strict()
    });

export const registerSchema = body({
    name: z.string().trim().min(1).max(120),
    email,
    password,
    contact: z.string().regex(/^\+?[0-9]{7,15}$/),
    clientType
});
export const loginSchema = body({ email, password: z.string().min(1).max(128), clientType });
export const googleSchema = body({ idToken: z.string().min(1).max(8192), clientType });
export const refreshSchema = body({
    refreshToken: z.string().min(20).max(512).optional(),
    clientType
});
export const otpSchema = body({ otp: z.string().regex(/^\d{6}$/) });
export const resetRequestSchema = body({ email });
export const resetCompleteSchema = body({
    email,
    otp: z.string().regex(/^\d{6}$/),
    newPassword: password
});
export const emptySchema = body({});
