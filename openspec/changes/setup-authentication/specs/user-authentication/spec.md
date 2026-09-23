# Spec Delta

## Purpose

Provide secure account registration, local and Google sign-in, and usable authenticated sessions for HolyDayTrip clients.

## ADDED Requirements

### Requirement: Account registration
The system SHALL let a client register an account with a name, valid email address, password, and contact number. It MUST reject malformed or unknown request fields, enforce the password policy, and reject an email already associated with an account without creating a duplicate account. The system MUST never return a password or password-derived value in an API response.

#### Scenario: Successful registration
- **WHEN** a client submits valid, unused registration details
- **THEN** the system creates an unverified account and returns a safe account representation with a 201 response

#### Scenario: Duplicate registration email
- **WHEN** a client submits a registration request for an existing email address
- **THEN** the system returns a 409 error and does not create another account

### Requirement: Email and password sign-in
The system SHALL authenticate an active account when valid email and password credentials are supplied. It MUST reject invalid credentials with a safe 401 response that does not disclose whether the email exists, and MUST apply stricter rate limiting to sign-in attempts than general API traffic.

#### Scenario: Successful local sign-in
- **WHEN** an active user submits correct email and password credentials
- **THEN** the system establishes an authenticated session and returns the safe authenticated-user response

#### Scenario: Invalid local credentials
- **WHEN** a client submits an unknown email or incorrect password
- **THEN** the system returns the same safe 401 error response for either condition

### Requirement: Google sign-in
The system SHALL let a client authenticate through Google using a Google identity whose issuer, audience, signature, expiry, and verified email have been validated. It MUST create a new account for a verified Google email not yet registered, and link the Google identity to an existing account with the same verified email without creating a second account.

#### Scenario: First Google sign-in
- **WHEN** a client completes Google sign-in with a valid identity for an unused verified email
- **THEN** the system creates a linked account and establishes an authenticated session

#### Scenario: Google sign-in for an existing email
- **WHEN** a client completes Google sign-in with a valid identity whose verified email belongs to an existing account
- **THEN** the system authenticates that account and records no duplicate user

### Requirement: Session issuance and authenticated requests
The system SHALL issue a revocable authenticated session after successful local or Google sign-in. It MUST support secure browser credentials and bearer credentials for mobile clients, identify the authenticated user for protected routes, and reject missing, expired, invalid, or revoked credentials with a 401 response.

#### Scenario: Authenticated protected request
- **WHEN** a client sends valid current credentials to a protected route
- **THEN** the route receives the authenticated account identity

#### Scenario: Rejected stale credentials
- **WHEN** a client sends expired or revoked credentials to a protected route
- **THEN** the system returns a 401 error and performs no protected operation

### Requirement: Sign-out and session revocation
The system SHALL let an authenticated client sign out by revoking its current session. After sign-out, the revoked session MUST no longer authorize protected requests.

#### Scenario: Successful sign-out
- **WHEN** an authenticated client requests sign-out
- **THEN** the system invalidates its current session and returns 204 with no response body

