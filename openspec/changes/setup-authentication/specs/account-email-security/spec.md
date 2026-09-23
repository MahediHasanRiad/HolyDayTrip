# Spec Delta

## Purpose

Protect ownership of user email addresses and enable secure password recovery using Brevo-delivered one-time passwords.

## ADDED Requirements

### Requirement: Email verification OTP delivery
The system SHALL issue and send an email-verification OTP through Brevo for an unverified account. Each OTP MUST be bound to its purpose and account, expire after a defined short lifetime, be single-use, and be protected by resend and verification-attempt limits.

#### Scenario: Verification OTP is requested
- **WHEN** an unverified account requests email verification within the allowed rate limit
- **THEN** the system sends a purpose-bound OTP to that account's email through Brevo and returns a safe success response

#### Scenario: Verification request is rate limited
- **WHEN** an account exceeds the permitted verification OTP request rate
- **THEN** the system returns a 429 error and does not send another OTP

### Requirement: Email verification completion
The system SHALL mark an account's email as verified only after a valid, unexpired, unused email-verification OTP is presented. It MUST reject invalid, expired, previously used, or purpose-mismatched OTPs without changing verification state.

#### Scenario: Valid verification OTP
- **WHEN** an unverified account submits its current valid email-verification OTP
- **THEN** the system marks the email verified and invalidates that OTP

#### Scenario: Expired verification OTP
- **WHEN** an account submits an expired email-verification OTP
- **THEN** the system returns a safe validation error and leaves the email unverified

### Requirement: Password reset OTP delivery
The system SHALL accept a password-reset OTP request for an email address and, when the email belongs to an active local account, send a purpose-bound OTP through Brevo. Its response MUST not disclose whether the requested email is registered, and it MUST apply request-rate limits.

#### Scenario: Password reset requested for a known account
- **WHEN** a client requests a password reset for an active local account within the allowed rate limit
- **THEN** the system sends a password-reset OTP through Brevo and returns the generic reset-request success response

#### Scenario: Password reset requested for an unknown email
- **WHEN** a client requests a password reset for an email with no local account
- **THEN** the system returns the same generic reset-request success response without sending an OTP

### Requirement: Password reset completion
The system SHALL allow a user to set a new policy-compliant password only after presenting a valid, unexpired, unused password-reset OTP for that account. On success, it MUST invalidate the OTP and revoke the account's existing sessions.

#### Scenario: Valid password reset
- **WHEN** a user submits a valid password-reset OTP and a policy-compliant new password
- **THEN** the system updates the password, revokes existing sessions, and returns a safe success response

#### Scenario: Reused password-reset OTP
- **WHEN** a user attempts to reset a password using an OTP that was already consumed
- **THEN** the system returns a safe validation error and does not change the password
