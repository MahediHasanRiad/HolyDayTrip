# Design

## Context

The Express API has global security headers, a general rate limiter, Zod environment validation, Prisma/PostgreSQL, and Redis, but no feature routes or authentication middleware. The existing `User` table requires a password and contact number, which cannot represent a Google-only account. See `proposal.md` and the two delta specs for required behavior.

## Goals / Non-Goals

**Goals:**

- Add a feature-scoped authentication API that follows the repository's routes → controller → service → repository dependency direction.
- Make account identity, OTP state, and revocable session state durable and transactionally consistent in PostgreSQL; use Redis only for rate limiting.
- Serve browser clients with secure cookies and mobile clients with bearer credentials from one session model.
- Keep credentials, raw OTPs, and provider tokens out of logs, responses, and persistent plaintext storage.

**Non-Goals:**

- Authorization roles, hotel ownership policy, multi-factor authentication beyond requested email OTP flows, or social providers other than Google.
- Passwordless sign-in, phone verification, account deletion, or general outbound-email infrastructure.
- Migrating or repairing existing production user records beyond the schema changes required for authentication.

## Decisions

### Account and identity representation

Evolve `User` with `emailVerifiedAt`; make its local-password and contact fields nullable so a Google-created account can exist without fabricated values. Add a unique provider-identity record keyed by provider and provider subject, plus a unique user relation. Google identity is verified server-side from its ID token; only the verified email claim is eligible for automatic email-based linking.

This preserves one canonical HolyDayTrip user across local and Google login while allowing either credential type. A separate account per provider was rejected because it duplicates bookings and makes account recovery ambiguous. Requiring a password/contact during first Google sign-in was rejected because it prevents the requested single-step Google flow; profile-completion requirements can be added later by the owning feature.

### Local credential protection

Use bcrypt with an application-configured secure work factor for all locally set passwords. Enforce a documented minimum password policy in Zod and store only the resulting hash. Compare credentials through the password library and return one 401 response for unknown email, missing local credential, inactive account, or wrong password.

bcrypt is selected as the project's required adaptive password-hashing algorithm. Reversible encryption and fast hashes are rejected because they weaken password protection; a hand-rolled password scheme is rejected because mature libraries provide the necessary safe primitives.

### Session and token model

Create a durable session for each completed sign-in. Give it a random opaque refresh credential, persist only a hash of that credential, and rotate it when refreshed. Issue a short-lived signed access token carrying only session and user identifiers. Browser responses set the refresh credential in an `HttpOnly`, `Secure`, `SameSite` cookie; mobile clients receive the refresh credential in the response body and send the access token as a Bearer token. Sign-out and password reset revoke session records, so access-token validation also checks the session's validity.

This supports both requested client types and immediate revocation. Stateless JWT-only authentication was rejected because it cannot reliably revoke sessions before expiry. A server-side cookie-only design was rejected because mobile clients require bearer support.

### OTP lifecycle and Brevo integration

Store OTP challenges durably with account/email, purpose (`email_verification` or `password_reset`), hashed code, expiry, attempt count, consumed timestamp, and send metadata. Generate cryptographically random numeric OTPs, expire them after 10 minutes, invalidate prior active challenges for the same purpose, and atomically consume a successful challenge. Use a Brevo adapter behind an email service boundary; validate Brevo credentials and sender details at startup, without logging them.

Durable challenges guarantee single use across API instances and allow reset completion to revoke sessions transactionally. Redis-only OTPs were rejected because Redis is not the durable source of truth for domain security state. Email links were rejected because the requested workflow is OTP-based.

### Abuse prevention and API surface

Mount `/api/v1/auth` routes for registration, local sign-in, Google sign-in, refresh, sign-out, verification OTP request/confirmation, reset OTP request, and reset completion. Strict Zod schemas reject unknown body fields. Add route-specific Redis-backed limits for registration/sign-in, OTP sends, OTP verification, and reset requests, keyed by a privacy-preserving combination of route, IP, and account/email hash where applicable. Preserve the API's `{ data }` / `{ error }` envelope, safe errors, `201` for registration, `204` for sign-out, and `429` for rate-limit responses.

The current global limit remains a baseline but is insufficient for credential and OTP abuse. Storing plain email values in rate-limit keys is rejected to reduce operational exposure.

## Risks / Trade-offs

- [Google token validation or Brevo delivery outage blocks a login or OTP send] → apply short dependency timeouts, map failures to safe 5xx errors, log request IDs and provider context without secrets, and retain database consistency when delivery fails.
- [Email delivery delay outlives the 10-minute OTP lifetime] → make OTP lifetime/configuration explicit, expose resend behavior, and monitor delivery failures before changing the default.
- [Cookie and bearer support increases test and configuration surface] → centralize credential issuance/extraction and cover both paths with integration tests.
- [Existing `User.password` and `User.contact` are non-null] → review data before deploying the migration; nullable changes are backward compatible and local registration remains strict.
- [Refresh-token theft] → hash stored refresh credentials, rotate on use, use secure cookie attributes, and revoke sessions after reset/sign-out.

## Migration Plan

1. Add and review a Prisma migration for nullable provider-independent user fields, email verification state, provider identities, sessions, and OTP challenges with appropriate foreign keys, uniqueness, expiry/query indexes, and timestamps.
2. Add required non-secret placeholders to `.env.example`, configure production secrets outside version control, and validate startup configuration before deployment.
3. Deploy the migration before application code that relies on the new tables, then deploy the API and verify `/ready`, local login, Google validation, Brevo delivery, OTP completion, and sign-out in a non-production environment.
4. Roll back application code independently if necessary; do not drop authentication columns or tables in an emergency rollback. Use a forward migration after examining any production data issue.
