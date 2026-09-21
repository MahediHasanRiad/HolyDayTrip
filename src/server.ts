import { app } from './app.js';
import { prisma } from './config/db.js';
import { env } from './config/env.js';
import { redis } from './config/redis.js';

const start = async (): Promise<void> => {
    await prisma.$connect();
    await redis.connect();

    const server = app.listen(env.PORT, () => {
        console.log(`HolyDayTrip API listening on port ${env.PORT}`);
    });

    const shutdown = async (): Promise<void> => {
        server.close(async () => {
            await Promise.all([prisma.$disconnect(), redis.quit()]);
            process.exit(0);
        });
    };

    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
};

start().catch(async (error: unknown) => {
    console.error('Failed to start HolyDayTrip API', error);
    await Promise.allSettled([prisma.$disconnect(), redis.quit()]);
    process.exit(1);
});
