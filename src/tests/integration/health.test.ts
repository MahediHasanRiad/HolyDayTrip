import request from 'supertest';
import { describe, expect, it } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/holydaytrip_test?schema=public';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.CORS_ORIGIN = 'http://localhost:3000';

const { app } = await import('../../app.js');

describe('service health', () => {
    it('returns a liveness response', async () => {
        const response = await request(app).get('/health');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ data: { status: 'ok' } });
    });

    it('returns the standard error envelope for unknown routes', async () => {
        const response = await request(app).get('/missing');

        expect(response.status).toBe(404);
        expect(response.body.error.code).toBe('NOT_FOUND');
    });
});
