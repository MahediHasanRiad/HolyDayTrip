import bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { SignJWT, jwtVerify } from 'jose';
import { Prisma } from '../../../generated/prisma/client.js';
import { prisma } from '../../../config/db.js';
import { env } from '../../../config/env.js';
import { OTP_MAX_ATTEMPTS, OTP_TTL_MS } from '../../../shared/constants/auth.js';
import { generateOpaqueToken, generateOtp, sha256 } from '../../../shared/helpers/crypto.js';
import {
    AuthenticationError,
    ConflictError,
    ValidationError
} from '../../../shared/errors/auth-errors.js';
import { AuthRepository } from './auth.repository.js';
import { type AuthResponse, type ClientType, type SafeUser, toSafeUser } from './auth.types.js';
import { BrevoEmailSender, type EmailSender } from './email.service.js';

const jwtKey = new TextEncoder().encode(env.AUTH_JWT_SECRET);
const googleClient = new OAuth2Client();
const repository = new AuthRepository(prisma);

type LocalRegistration = {
    name: string;
    email: string;
    password: string;
    contact: string;
    clientType: ClientType;
};
type Credentials = { email: string; password: string; clientType: ClientType };

export class AuthService {
    public constructor(private readonly emailSender: EmailSender = new BrevoEmailSender()) {}

    private async createAccessToken(userId: string, sessionId: string): Promise<string> {
        return new SignJWT({ sid: sessionId })
            .setProtectedHeader({ alg: 'HS256' })
            .setSubject(userId)
            .setIssuedAt()
            .setExpirationTime(`${env.ACCESS_TOKEN_TTL_SECONDS}s`)
            .sign(jwtKey);
    }

    private async issueSession(
        user: Awaited<ReturnType<AuthRepository['findUserById']>> extends infer T
            ? NonNullable<T>
            : never,
        clientType: ClientType
    ): Promise<AuthResponse> {
        const refreshToken = generateOpaqueToken();
        const session = await repository.createSession(
            user.id,
            sha256(refreshToken),
            new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 86_400_000)
        );
        void clientType;
        return {
            user: toSafeUser(user),
            accessToken: await this.createAccessToken(user.id, session.id),
            expiresIn: env.ACCESS_TOKEN_TTL_SECONDS,
            refreshToken
        };
    }

    public async register(input: LocalRegistration): Promise<AuthResponse> {
        const password = await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS);
        try {
            const user = await repository.createUser({
                name: input.name,
                email: input.email.toLowerCase(),
                contact: input.contact,
                password
            });
            return this.issueSession(user, input.clientType);
        } catch (error: unknown) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
                throw new ConflictError('An account with that email already exists.');
            throw error;
        }
    }

    public async login(input: Credentials): Promise<AuthResponse> {
        const user = await repository.findUserByEmail(input.email.toLowerCase());
        if (
            !user ||
            !user.password ||
            !user.isActive ||
            !(await bcrypt.compare(input.password, user.password))
        )
            throw new AuthenticationError();
        return this.issueSession(user, input.clientType);
    }

    public async googleLogin(idToken: string, clientType: ClientType): Promise<AuthResponse> {
        if (!env.GOOGLE_CLIENT_ID) throw new ValidationError('Google sign-in is not configured.');
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: env.GOOGLE_CLIENT_ID
        });
        const claims = ticket.getPayload();
        if (!claims?.sub || !claims.email || !claims.email_verified)
            throw new AuthenticationError();
        const email = claims.email.toLowerCase();
        const user = await prisma.$transaction(async (tx) => {
            const txRepository = new AuthRepository(tx);
            const identity = await txRepository.findIdentity(claims.sub);
            if (identity) return identity.user;
            let account = await txRepository.findUserByEmail(email);
            if (!account)
                account = await txRepository.createUser({
                    name: claims.name?.slice(0, 120) || email.split('@')[0],
                    email,
                    emailVerifiedAt: new Date()
                });
            await txRepository.createGoogleIdentity(account.id, claims.sub);
            return account;
        });
        if (!user.isActive) throw new AuthenticationError();
        return this.issueSession(user, clientType);
    }

    public async refresh(refreshToken: string, clientType: ClientType): Promise<AuthResponse> {
        const session = await repository.findSessionByRefreshHash(sha256(refreshToken));
        if (
            !session ||
            session.revokedAt ||
            session.expiresAt <= new Date() ||
            !session.user.isActive
        )
            throw new AuthenticationError();
        const newRefreshToken = generateOpaqueToken();
        await repository.rotateSession(
            session.id,
            sha256(newRefreshToken),
            new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 86_400_000)
        );
        void clientType;
        return {
            user: toSafeUser(session.user),
            accessToken: await this.createAccessToken(session.userId, session.id),
            expiresIn: env.ACCESS_TOKEN_TTL_SECONDS,
            refreshToken: newRefreshToken
        };
    }

    public async authenticateAccessToken(
        token: string
    ): Promise<{ userId: string; sessionId: string }> {
        try {
            const { payload } = await jwtVerify(token, jwtKey);
            if (typeof payload.sub !== 'string' || typeof payload.sid !== 'string')
                throw new AuthenticationError();
            const session = await repository.findSessionById(payload.sid);
            if (
                !session ||
                session.userId !== payload.sub ||
                session.revokedAt ||
                session.expiresAt <= new Date() ||
                !session.user.isActive
            )
                throw new AuthenticationError();
            return { userId: payload.sub, sessionId: payload.sid };
        } catch (error: unknown) {
            if (error instanceof AuthenticationError) throw error;
            throw new AuthenticationError();
        }
    }

    public async signOut(sessionId: string): Promise<void> {
        await repository.revokeSession(sessionId);
    }

    public async getCurrentUser(userId: string): Promise<SafeUser> {
        const user = await repository.findUserById(userId);
        if (!user || !user.isActive) throw new AuthenticationError();
        return toSafeUser(user);
    }

    private async issueOtp(
        userId: string,
        email: string,
        purpose: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET'
    ): Promise<void> {
        const otp = generateOtp();
        await prisma.$transaction(async (tx) => {
            const txRepository = new AuthRepository(tx);
            await txRepository.invalidateOtps(userId, purpose);
            await txRepository.createOtp(
                userId,
                purpose,
                sha256(otp),
                new Date(Date.now() + OTP_TTL_MS)
            );
        });
        await this.emailSender.sendOtp(
            email,
            otp,
            purpose === 'EMAIL_VERIFICATION' ? 'verification' : 'password reset'
        );
    }

    public async requestVerification(userId: string): Promise<void> {
        const user = await repository.findUserById(userId);
        if (!user || !user.isActive) throw new AuthenticationError();
        if (!user.emailVerifiedAt) await this.issueOtp(user.id, user.email, 'EMAIL_VERIFICATION');
    }

    public async requestReset(email: string): Promise<void> {
        const user = await repository.findUserByEmail(email.toLowerCase());
        if (user?.isActive && user.password)
            await this.issueOtp(user.id, user.email, 'PASSWORD_RESET');
    }

    private async consumeOtp(
        userId: string,
        purpose: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET',
        otp: string
    ): Promise<void> {
        const challenge = await repository.findOtp(userId, purpose, sha256(otp));
        if (
            !challenge ||
            challenge.consumedAt ||
            challenge.expiresAt <= new Date() ||
            challenge.attempts >= OTP_MAX_ATTEMPTS
        )
            throw new ValidationError('The verification code is invalid or expired.');
        const consumed = await repository.consumeOtp(challenge.id);
        if (consumed.count !== 1) {
            await repository.incrementOtpAttempts(challenge.id);
            throw new ValidationError('The verification code is invalid or expired.');
        }
    }

    public async confirmVerification(userId: string, otp: string): Promise<void> {
        await prisma.$transaction(async (tx) => {
            const txRepository = new AuthRepository(tx);
            const challenge = await txRepository.findOtp(userId, 'EMAIL_VERIFICATION', sha256(otp));
            if (
                !challenge ||
                challenge.consumedAt ||
                challenge.expiresAt <= new Date() ||
                challenge.attempts >= OTP_MAX_ATTEMPTS
            )
                throw new ValidationError('The verification code is invalid or expired.');
            if ((await txRepository.consumeOtp(challenge.id)).count !== 1)
                throw new ValidationError('The verification code is invalid or expired.');
            await txRepository.verifyEmail(userId);
        });
    }

    public async completeReset(email: string, otp: string, newPassword: string): Promise<void> {
        const user = await repository.findUserByEmail(email.toLowerCase());
        if (!user) throw new ValidationError('The verification code is invalid or expired.');
        const password = await bcrypt.hash(newPassword, env.BCRYPT_SALT_ROUNDS);
        await prisma.$transaction(async (tx) => {
            const txRepository = new AuthRepository(tx);
            const challenge = await txRepository.findOtp(user.id, 'PASSWORD_RESET', sha256(otp));
            if (
                !challenge ||
                challenge.consumedAt ||
                challenge.expiresAt <= new Date() ||
                challenge.attempts >= OTP_MAX_ATTEMPTS
            )
                throw new ValidationError('The verification code is invalid or expired.');
            if ((await txRepository.consumeOtp(challenge.id)).count !== 1)
                throw new ValidationError('The verification code is invalid or expired.');
            await txRepository.updatePassword(user.id, password);
            await txRepository.revokeUserSessions(user.id);
        });
    }
}

export const authService = new AuthService();
