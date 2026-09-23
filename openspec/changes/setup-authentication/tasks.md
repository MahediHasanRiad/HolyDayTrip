# Tasks

## 1. Foundation and configuration

- [x] 1.1 Add pinned dependencies for bcrypt password hashing, signed access tokens, Google ID-token verification, and the Brevo API; verify `npm install` updates `package-lock.json` and `npm run typecheck` succeeds.
- [ ] 1.2 Extend typed Zod environment configuration and `.env.example` with authentication signing, Google client, Brevo sender/API, and cookie/session settings; verify malformed or missing required production values fail at startup without exposing secrets.
- [ ] 1.3 Add shared authentication constants, safe error types, cryptographic helpers, and sanitized response DTO types; verify unit tests cover token/OTP generation and never expose password, token, or raw OTP fields.

## 2. Persistent authentication data

- [x] 2.1 Update the Prisma schema for nullable local-only user fields, email-verification state, provider identities, revocable sessions, and purpose-bound OTP challenges with constraints and query indexes; verify `npm run prisma:generate` succeeds.
- [ ] 2.2 Create and review a named Prisma migration for the authentication data model; verify it applies cleanly to an isolated test database and preserves existing user rows.
- [ ] 2.3 Implement Prisma-only repositories using deliberate selects and transaction-compatible methods for users, provider identities, sessions, and OTP challenges; verify repository/service unit tests cover uniqueness, expiry, consumption, and revocation behavior.

## 3. Authentication services

- [ ] 3.1 Implement registration and local sign-in services with bcrypt hashes, safe duplicate/invalid-credential handling, and session issuance; verify unit tests cover valid registration, duplicate email, correct credentials, and indistinguishable failed credentials.
- [ ] 3.2 Implement Google ID-token validation and transactional identity linking/account creation; verify tests reject invalid issuer/audience/expiry/unverified-email claims and prevent duplicate users.
- [ ] 3.3 Implement access-token issuance, refresh rotation, session validation, and current-session sign-out for browser and mobile clients; verify unit tests cover valid, expired, rotated, and revoked sessions.
- [ ] 3.4 Implement a Brevo email adapter and OTP challenge services for verification and password reset, including 10-minute expiry, hashing, single use, retry limits, and generic reset-request responses; verify mocked-provider tests cover delivery, expiry, purpose mismatch, consumption, and unknown-email behavior.
- [ ] 3.5 Implement verification completion and password reset transactions that update account state and revoke sessions after reset; verify tests prove a consumed OTP cannot be reused and pre-reset credentials are rejected.

## 4. HTTP API and protections

- [ ] 4.1 Add strict Zod request schemas, route-specific Redis-backed rate limiting, controllers, and `/api/v1/auth` routes for all registration, login, refresh, sign-out, verification, and reset flows; verify validation rejects unknown fields and exceeded limits return the standard 429 envelope.
- [ ] 4.2 Add authentication middleware that extracts secure browser cookies or mobile Bearer tokens and attaches the validated identity for protected routes; verify integration tests cover missing, invalid, expired, and revoked credentials returning 401.
- [ ] 4.3 Configure cookie issuance/clearing with secure production attributes and ensure CORS behavior permits the intended browser credential flow; verify integration tests assert cookie flags and sign-out clears the active browser session.
- [ ] 4.4 Add explicit safe response DTOs, HTTP status mappings, and centralized error translations for auth endpoints; verify integration tests assert 201 registration, 204 sign-out, 401 credential failures, 409 duplicate email, and no sensitive fields in responses.

## 5. Documentation and full verification

- [ ] 5.1 Add or update OpenAPI documentation for every `/api/v1/auth` endpoint, request/response schemas, cookies/bearer security, and error examples; verify the documented routes and status codes match integration coverage.
- [ ] 5.2 Add end-to-end integration coverage using isolated PostgreSQL/Redis configuration and mocked Google/Brevo boundaries; verify email/password, Google linking, email verification, password reset, rate limiting, and session revocation paths.
- [x] 5.3 Run `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`; verify all checks pass and document any required local setup updates in `README.md`.
