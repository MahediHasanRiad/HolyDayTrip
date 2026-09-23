import { AppError } from './app-error.js';

export class AuthenticationError extends AppError {
    constructor() {
        super(401, 'UNAUTHENTICATED', 'Invalid credentials or session.');
    }
}
export class ConflictError extends AppError {
    constructor(message: string) {
        super(409, 'CONFLICT', message);
    }
}
export class ValidationError extends AppError {
    constructor(message: string, details?: unknown) {
        super(422, 'VALIDATION_ERROR', message, details);
    }
}
