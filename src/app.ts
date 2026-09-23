import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { v1Router } from './api/v1/routes.js';
import { env } from './config/env.js';
import { prisma } from './config/db.js';
import { redis } from './config/redis.js';
import { errorHandler } from './middleware/error.middleware.js';
import { notFoundHandler } from './middleware/not-found.middleware.js';
import { requestIdMiddleware } from './middleware/request-id.middleware.js';

export const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(requestIdMiddleware);
app.use(
    cors({
        origin: env.CORS_ORIGIN,
        credentials: true
    })
);
app.use(express.json({ limit: '100kb' }));
app.use(
    rateLimit({ windowMs: 60_000, limit: 100, standardHeaders: 'draft-8', legacyHeaders: false })
);

app.get('/health', (_request, response) => {
    response.status(200).json({ data: { status: 'ok' } });
});

app.get('/ready', async (_request, response, next) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        await redis.ping();
        response.status(200).json({ data: { status: 'ready' } });
    } catch (error: unknown) {
        next(error);
    }
});

app.use('/api/v1', v1Router);
app.use(notFoundHandler);
app.use(errorHandler);
