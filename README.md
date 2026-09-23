# HolyDayTrip API

A Docker-based Node.js/TypeScript foundation for the HolyDayTrip weekend-hotel marketplace API. It provides Express, PostgreSQL through Prisma, Redis, strict environment validation, and liveness/readiness endpoints.

## Prerequisites

- Docker Engine with Docker Compose v2

## Quick start

1. Create local configuration: `cp .env.example .env`
2. Start the development stack: `docker compose up --build`
3. Apply the initial schema: `docker compose exec api npm run prisma:migrate:deploy`
4. Check the API: `curl http://localhost:3000/health`

The API reloads after edits to `src/`. PostgreSQL and Redis data are stored in named Docker volumes.

## Commands

| Task                               | Command                                                               |
| ---------------------------------- | --------------------------------------------------------------------- |
| Start development services         | `docker compose up --build`                                           |
| Stop services                      | `docker compose down`                                                 |
| View service status                | `docker compose ps`                                                   |
| Run a Prisma development migration | `docker compose exec api npm run prisma:migrate:dev -- --name <name>` |
| Apply committed migrations         | `docker compose exec api npm run prisma:migrate:deploy`               |
| Generate Prisma Client             | `docker compose exec api npm run prisma:generate`                     |
| Type-check                         | `docker compose exec api npm run typecheck`                           |
| Lint                               | `docker compose exec api npm run lint`                                |
| Run tests                          | `docker compose exec api npm test`                                    |
| Create a production build          | `docker compose exec api npm run build`                               |

`/health` is a liveness check. `/ready` confirms that both PostgreSQL and Redis are reachable.

## Configuration

Copy `.env.example` to `.env`. The Docker API service uses `postgres` and `redis` hostnames internally; do not change them to `localhost` when running in Docker.

The included PostgreSQL credentials are for local development only. Use unique secrets and environment-specific connection URLs for deployed environments.

## Authentication

`/api/v1/auth` supports email/password and Google sign-in, browser refresh cookies, mobile bearer access tokens, email verification, and password reset OTPs sent through Brevo. Configure the Google client ID, Brevo credentials, sender address, and a unique `AUTH_JWT_SECRET` before deploying. Browser clients must set `CORS_ORIGIN` to their exact origin and send credentials when refreshing a session. The API contract is documented in `docs/openapi.yaml`.

## Migration recovery

The repository's initial schema is `20260921180000_init`. If a local development database recorded the removed `20260921123425_init` migration as failed, recreate the disposable local database before applying migrations:

```bash
docker compose down -v
docker compose up --build -d
docker compose exec api npm run prisma:migrate:deploy
```

Do not reset a shared or production database. A failed production migration requires inspection of `_prisma_migrations` and the live schema before using `prisma migrate resolve`.
