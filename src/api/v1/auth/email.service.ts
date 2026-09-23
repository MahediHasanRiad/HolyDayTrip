import { env } from '../../../config/env.js';

export interface EmailSender {
    sendOtp(email: string, otp: string, purpose: 'verification' | 'password reset'): Promise<void>;
}

export class BrevoEmailSender implements EmailSender {
    public async sendOtp(
        email: string,
        otp: string,
        purpose: 'verification' | 'password reset'
    ): Promise<void> {
        if (!env.BREVO_API_KEY || !env.BREVO_SENDER_EMAIL)
            throw new Error('Email delivery is not configured.');
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: { 'api-key': env.BREVO_API_KEY, 'content-type': 'application/json' },
            body: JSON.stringify({
                sender: { email: env.BREVO_SENDER_EMAIL, name: env.BREVO_SENDER_NAME },
                to: [{ email }],
                subject: `HolyDayTrip ${purpose} code`,
                textContent: `Your HolyDayTrip ${purpose} code is ${otp}. It expires in 10 minutes.`
            }),
            signal: AbortSignal.timeout(10_000)
        });
        if (!response.ok) throw new Error('Email provider rejected the request.');
    }
}
