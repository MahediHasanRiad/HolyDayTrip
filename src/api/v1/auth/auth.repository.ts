/* eslint-disable no-useless-catch -- repository methods deliberately preserve Prisma errors for services */
import type { OtpPurpose, Prisma, PrismaClient } from '../../../generated/prisma/client.js';

type Database = PrismaClient | Prisma.TransactionClient;
const userSelect = {
    id: true,
    name: true,
    email: true,
    contact: true,
    password: true,
    isActive: true,
    emailVerifiedAt: true
} as const;

export class AuthRepository {
    public constructor(private readonly db: Database) {}

    public async findUserByEmail(email: string) {
        try {
            return await this.db.user.findUnique({ where: { email }, select: userSelect });
        } catch (error: unknown) {
            throw error;
        }
    }
    public async findUserById(id: string) {
        try {
            return await this.db.user.findUnique({ where: { id }, select: userSelect });
        } catch (error: unknown) {
            throw error;
        }
    }
    public async createUser(data: {
        name: string;
        email: string;
        contact?: string;
        password?: string;
        emailVerifiedAt?: Date;
    }) {
        try {
            return await this.db.user.create({ data, select: userSelect });
        } catch (error: unknown) {
            throw error;
        }
    }
    public async updatePassword(userId: string, password: string) {
        try {
            return await this.db.user.update({
                where: { id: userId },
                data: { password },
                select: userSelect
            });
        } catch (error: unknown) {
            throw error;
        }
    }
    public async verifyEmail(userId: string) {
        try {
            return await this.db.user.update({
                where: { id: userId },
                data: { emailVerifiedAt: new Date() },
                select: userSelect
            });
        } catch (error: unknown) {
            throw error;
        }
    }
    public async findIdentity(providerSubject: string) {
        try {
            return await this.db.providerIdentity.findUnique({
                where: { provider_providerSubject: { provider: 'GOOGLE', providerSubject } },
                include: { user: { select: userSelect } }
            });
        } catch (error: unknown) {
            throw error;
        }
    }
    public async createGoogleIdentity(userId: string, providerSubject: string) {
        try {
            return await this.db.providerIdentity.create({
                data: { userId, provider: 'GOOGLE', providerSubject }
            });
        } catch (error: unknown) {
            throw error;
        }
    }
    public async createSession(userId: string, refreshTokenHash: string, expiresAt: Date) {
        try {
            return await this.db.session.create({ data: { userId, refreshTokenHash, expiresAt } });
        } catch (error: unknown) {
            throw error;
        }
    }
    public async findSessionByRefreshHash(refreshTokenHash: string) {
        try {
            return await this.db.session.findUnique({
                where: { refreshTokenHash },
                include: { user: { select: userSelect } }
            });
        } catch (error: unknown) {
            throw error;
        }
    }
    public async findSessionById(id: string) {
        try {
            return await this.db.session.findUnique({
                where: { id },
                include: { user: { select: userSelect } }
            });
        } catch (error: unknown) {
            throw error;
        }
    }
    public async rotateSession(id: string, refreshTokenHash: string, expiresAt: Date) {
        try {
            return await this.db.session.update({
                where: { id },
                data: { refreshTokenHash, expiresAt }
            });
        } catch (error: unknown) {
            throw error;
        }
    }
    public async revokeSession(id: string) {
        try {
            return await this.db.session.updateMany({
                where: { id, revokedAt: null },
                data: { revokedAt: new Date() }
            });
        } catch (error: unknown) {
            throw error;
        }
    }
    public async revokeUserSessions(userId: string) {
        try {
            return await this.db.session.updateMany({
                where: { userId, revokedAt: null },
                data: { revokedAt: new Date() }
            });
        } catch (error: unknown) {
            throw error;
        }
    }
    public async invalidateOtps(userId: string, purpose: OtpPurpose) {
        try {
            return await this.db.otpChallenge.updateMany({
                where: { userId, purpose, consumedAt: null },
                data: { consumedAt: new Date() }
            });
        } catch (error: unknown) {
            throw error;
        }
    }
    public async createOtp(userId: string, purpose: OtpPurpose, codeHash: string, expiresAt: Date) {
        try {
            return await this.db.otpChallenge.create({
                data: { userId, purpose, codeHash, expiresAt }
            });
        } catch (error: unknown) {
            throw error;
        }
    }
    public async findOtp(userId: string, purpose: OtpPurpose, codeHash: string) {
        try {
            return await this.db.otpChallenge.findFirst({
                where: { userId, purpose, codeHash },
                orderBy: { createdAt: 'desc' }
            });
        } catch (error: unknown) {
            throw error;
        }
    }
    public async consumeOtp(id: string) {
        try {
            return await this.db.otpChallenge.updateMany({
                where: { id, consumedAt: null, expiresAt: { gt: new Date() }, attempts: { lt: 5 } },
                data: { consumedAt: new Date() }
            });
        } catch (error: unknown) {
            throw error;
        }
    }
    public async incrementOtpAttempts(id: string) {
        try {
            return await this.db.otpChallenge.update({
                where: { id },
                data: { attempts: { increment: 1 } }
            });
        } catch (error: unknown) {
            throw error;
        }
    }
}
