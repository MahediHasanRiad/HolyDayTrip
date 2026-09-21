import type { ErrorRequestHandler } from 'express';
import { AppError } from '../shared/errors/app-error.js';

export const errorHandler: ErrorRequestHandler = (error, _request, response, next) => {
    void next;
    if (error instanceof AppError) {
        response.status(error.statusCode).json({
            error: {
                code: error.code,
                message: error.message,
                ...(error.details === undefined ? {} : { details: error.details })
            }
        });
        return;
    }

    console.error('Unhandled request error', error);
    response.status(500).json({
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred.'
        }
    });
};
