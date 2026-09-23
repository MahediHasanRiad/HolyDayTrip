export type ClientType = 'browser' | 'mobile';

export interface SafeUser {
    id: string;
    name: string;
    email: string;
    contact: string | null;
    emailVerified: boolean;
}

export interface AuthResponse {
    user: SafeUser;
    accessToken: string;
    expiresIn: number;
    refreshToken?: string;
}

export const toSafeUser = (user: {
    id: string;
    name: string;
    email: string;
    contact: string | null;
    emailVerifiedAt: Date | null;
}): SafeUser => ({
    id: user.id,
    name: user.name,
    email: user.email,
    contact: user.contact,
    emailVerified: user.emailVerifiedAt !== null
});
