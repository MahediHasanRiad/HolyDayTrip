import type { RequestHandler } from 'express';
import { env } from '../../../config/env.js';
import { ACCESS_TOKEN_COOKIE } from '../../../shared/constants/auth.js';
import { AuthenticationError } from '../../../shared/errors/auth-errors.js';
import { authService } from './auth.service.js';
import type { AuthResponse, ClientType } from './auth.types.js';

const cookieOptions = {
    httpOnly: true,
    secure: env.COOKIE_SECURE ?? env.NODE_ENV === 'production',
    sameSite: env.COOKIE_SAME_SITE as 'lax' | 'strict' | 'none',
    path: '/api/v1/auth',
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 86_400_000
};

const sendAuth = (
    response: Parameters<RequestHandler>[1],
    result: AuthResponse,
    clientType: ClientType,
    status = 200
): void => {
    const { refreshToken, ...body } = result;
    if (clientType === 'browser' && refreshToken)
        response.cookie(ACCESS_TOKEN_COOKIE, refreshToken, cookieOptions);
    response
        .status(status)
        .json({ data: clientType === 'mobile' ? { ...body, refreshToken } : body });
};

const client = (request: Parameters<RequestHandler>[0]): ClientType =>
    request.body.clientType as ClientType;

const cookieValue = (request: Parameters<RequestHandler>[0]): string | undefined =>
    request.headers.cookie
        ?.split(';')
        .map((value) => value.trim())
        .find((value) => value.startsWith(`${ACCESS_TOKEN_COOKIE}=`))
        ?.slice(ACCESS_TOKEN_COOKIE.length + 1);

export const register: RequestHandler = async (request, response, next) => {
    try {
        sendAuth(response, await authService.register(request.body), client(request), 201);
    } catch (error) {
        next(error);
    }
};

export const login: RequestHandler = async (request, response, next) => {
    try {
        sendAuth(response, await authService.login(request.body), client(request));
    } catch (error) {
        next(error);
    }
};

export const googleLogin: RequestHandler = async (request, response, next) => {
    try {
        sendAuth(
            response,
            await authService.googleLogin(request.body.idToken, client(request)),
            client(request)
        );
    } catch (error) {
        next(error);
    }
};

export const refresh: RequestHandler = async (request, response, next) => {
    try {
        const refreshToken = request.body.refreshToken ?? cookieValue(request);
        if (!refreshToken) throw new AuthenticationError();
        sendAuth(
            response,
            await authService.refresh(refreshToken, client(request)),
            client(request)
        );
    } catch (error) {
        next(error);
    }
};

export const signOut: RequestHandler = async (request, response, next) => {
    try {
        if (!request.auth) throw new AuthenticationError();
        await authService.signOut(request.auth.sessionId);
        response.clearCookie(ACCESS_TOKEN_COOKIE, cookieOptions).status(204).send();
    } catch (error) {
        next(error);
    }
};

export const me: RequestHandler = async (request, response, next) => {
    try {
        if (!request.auth) throw new AuthenticationError();
        response.status(200).json({ data: await authService.getCurrentUser(request.auth.userId) });
    } catch (error) {
        next(error);
    }
};

export const requestVerification: RequestHandler = async (request, response, next) => {
    try {
        if (!request.auth) throw new AuthenticationError();
        await authService.requestVerification(request.auth.userId);
        response
            .status(200)
            .json({ data: { message: 'If needed, a verification code has been sent.' } });
    } catch (error) {
        next(error);
    }
};

export const confirmVerification: RequestHandler = async (request, response, next) => {
    try {
        if (!request.auth) throw new AuthenticationError();
        await authService.confirmVerification(request.auth.userId, request.body.otp);
        response.status(200).json({ data: { message: 'Email verified.' } });
    } catch (error) {
        next(error);
    }
};

export const requestPasswordReset: RequestHandler = async (request, response, next) => {
    try {
        await authService.requestReset(request.body.email);
        response
            .status(200)
            .json({ data: { message: 'If an account exists, a reset code has been sent.' } });
    } catch (error) {
        next(error);
    }
};

export const completePasswordReset: RequestHandler = async (request, response, next) => {
    try {
        await authService.completeReset(
            request.body.email,
            request.body.otp,
            request.body.newPassword
        );
        response.status(200).json({ data: { message: 'Password reset complete.' } });
    } catch (error) {
        next(error);
    }
};
