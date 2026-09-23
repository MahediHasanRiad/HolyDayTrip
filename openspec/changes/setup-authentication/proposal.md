# Proposal

## Why

HolyDayTrip has a user data model but no way for customers or hotel owners to register, authenticate, verify their email address, or recover access. Authentication is required before protected marketplace operations can safely be introduced.

## What Changes

- Add email-and-password registration and sign-in with securely hashed passwords.
- Add Google OpenID Connect sign-in and account linking by verified email.
- Add Brevo email delivery for one-time passwords used only for email verification and password reset flows.
- Add authenticated-session issuance for browser and mobile clients, authenticated-request handling, and sign-out/session revocation behavior.
- Add authentication-focused validation, rate limiting, error responses, configuration, database constraints, and API documentation.

## Capabilities

### New Capabilities

- `user-authentication`: Registration, email/password and Google authentication, session lifecycle, and protected-request identity.
- `account-email-security`: Brevo-delivered OTP verification and password-reset flows with expiry, single use, and abuse controls.

### Modified Capabilities

- None.

## Impact

- Affected code: new `api/v1/auth` feature modules, authentication and validation middleware, v1 route mounting, environment configuration, and tests.
- Data: Prisma migrations will evolve the existing `User` model and add durable provider identity, session/refresh-token, and OTP challenge records as needed.
- Dependencies/systems: a password-hashing library, signed-token or session support, Google OAuth/OIDC configuration, and the Brevo transactional email API.
- API: new public `/api/v1/auth` endpoints and protected-route authentication conventions.
