import type { RequestHandler } from 'express';
import { authService } from '../api/v1/auth/auth.service.js';
import { AuthenticationError } from '../shared/errors/auth-errors.js';

declare module 'express-serve-static-core' {
    interface Request {
        auth?: { userId: string; sessionId: string };
    }
}

export const authenticate: RequestHandler = async (request, _response, next) => {
    const authorization = request.header('authorization');
    if (!authorization?.startsWith('Bearer ')) {
        next(new AuthenticationError());
        return;
    }
    try {
        request.auth = await authService.authenticateAccessToken(authorization.slice(7));
        next();
    } catch (error: unknown) {
        next(error);
    }
};
