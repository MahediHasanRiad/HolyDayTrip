import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.middleware.js';
import { authRateLimit } from '../../../middleware/auth-rate-limit.middleware.js';
import { validate } from '../../../middleware/validate.middleware.js';
import * as controller from './auth.controller.js';
import {
    emptySchema,
    googleSchema,
    loginSchema,
    otpSchema,
    refreshSchema,
    registerSchema,
    resetCompleteSchema,
    resetRequestSchema
} from './auth.validation.js';

export const authRouter = Router();

authRouter.post(
    '/register',
    authRateLimit('register', 10),
    validate(registerSchema),
    controller.register
);

authRouter.post('/login', authRateLimit('login', 10), validate(loginSchema), controller.login);
authRouter.post(
    '/google',
    authRateLimit('google', 10),
    validate(googleSchema),
    controller.googleLogin
);
authRouter.post(
    '/refresh',
    authRateLimit('refresh', 30),
    validate(refreshSchema),
    controller.refresh
);
authRouter.post('/sign-out', authenticate, validate(emptySchema), controller.signOut);
authRouter.get('/me', authenticate, controller.me);
authRouter.post(
    '/verification/request',
    authenticate,
    authRateLimit('verify-send', 5),
    validate(emptySchema),
    controller.requestVerification
);
authRouter.post(
    '/verification/confirm',
    authenticate,
    authRateLimit('verify-confirm', 10),
    validate(otpSchema),
    controller.confirmVerification
);
authRouter.post(
    '/password-reset/request',
    authRateLimit('reset-send', 5),
    validate(resetRequestSchema),
    controller.requestPasswordReset
);
authRouter.post(
    '/password-reset/complete',
    authRateLimit('reset-complete', 10),
    validate(resetCompleteSchema),
    controller.completePasswordReset
);
