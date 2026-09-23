import type { RequestHandler } from 'express';
import type { z } from 'zod';
import { AppError } from '../shared/errors/app-error.js';

export const validate =
    <T extends { body: unknown; params: unknown; query: unknown }>(
        schema: z.ZodType<T>
    ): RequestHandler =>
    (request, _response, next) => {
        const result = schema.safeParse({
            body: request.body,
            params: request.params,
            query: request.query
        });
        if (!result.success) {
            next(
                new AppError(
                    400,
                    'VALIDATION_ERROR',
                    'The request is invalid.',
                    result.error.flatten()
                )
            );
            return;
        }
        request.body = result.data.body;
        request.params = result.data.params as typeof request.params;
        request.query = result.data.query as typeof request.query;
        next();
    };
