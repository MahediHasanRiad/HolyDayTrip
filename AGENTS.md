# Repository Guidelines

## Approved Backend Stack

Build this project as a Node.js backend written entirely in TypeScript. Use:

- **Node.js** for the runtime and an HTTP framework appropriate to the feature (Express is the default unless the project later standardizes on another framework).
- **TypeScript** with `strict` mode enabled. Do not introduce JavaScript source files into `src/`.
- **Prisma** as the only database ORM and migration tool.
- **PostgreSQL** as the primary persistent datastore.
- **Zod** for environment, request, and external-data validation.
- **Redis** for caching, rate limiting, ephemeral state, queues, or distributed locks; it is never the source of truth for durable domain data.

Use currently supported stable versions, pin dependency ranges in `package.json`, and commit the lockfile. Keep secrets only in environment variables; commit an up-to-date `.env.example`, never `.env`.

## Project Structure & Module Organization

Keep the repository root for configuration and documentation. Use this layout as the codebase is introduced:

```text
prisma/
  schema.prisma
  migrations/
src/
  app.ts                         # Creates and configures the HTTP application
  server.ts                      # Starts listening and handles graceful shutdown
  config/
    env.ts                       # Zod-validated, typed environment configuration
    db.ts                        # Prisma client lifecycle
    redis.ts                     # Redis client lifecycle
  api/
    v1/
      routes.ts                  # Mounts v1 feature routers
      user/
        user.controller.ts       # HTTP mapping only
        user.service.ts          # Business/use-case logic and transactions
        user.repository.ts       # Prisma queries only
        user.routes.ts
        user.validation.ts       # Zod request schemas
        user.types.ts            # Feature DTOs/types when needed
      article/
        article.controller.ts
        article.service.ts
        article.repository.ts
        article.routes.ts
        article.validation.ts
        article.types.ts
      comment/
        comment.controller.ts
        comment.service.ts
        comment.repository.ts
        comment.routes.ts
        comment.validation.ts
        comment.types.ts
  middleware/
    auth.middleware.ts
    error.middleware.ts
    validate.middleware.ts
    not-found.middleware.ts
    rate-limit.middleware.ts
  shared/
    constants/
    errors/
    helpers/
    utils/
    types/
  tests/
    integration/
    unit/
```

Organize by feature under `api/v1/`; do not create a large cross-feature `controllers/`, `services/`, or `repositories/` directory. Prisma models live in `prisma/schema.prisma`, not in per-feature model files. Keep feature-specific types next to the feature and promote only genuinely shared code to `shared/`.

Dependency direction is `routes -> controller -> service -> repository -> Prisma/Redis`. Controllers must not contain business logic or access Prisma/Redis directly. Repositories must not make HTTP decisions. Services own authorization decisions, business invariants, transaction boundaries, and cache invalidation.

## API Design Rules

- Version public routes from day one, e.g. `/api/v1/users`; use plural nouns and resource-oriented URLs. Use nested resources only when the relationship is essential (for example, `/articles/:articleId/comments`).
- Use HTTP semantics correctly: `GET` is safe, `POST` creates/actions, `PUT` replaces, `PATCH` partially updates, and `DELETE` returns `204` with no body when successful.
- Return appropriate status codes: `200`, `201` (with a `Location` header where useful), `204`, `400`, `401`, `403`, `404`, `409`, `422`, `429`, and `5xx`. Never use `200` to represent an error.
- Validate request body, path parameters, query parameters, and headers with Zod before they reach controllers. Reject unknown fields for public write endpoints unless forward compatibility requires otherwise.
- Define explicit response DTOs; never serialize Prisma records wholesale or expose password hashes, tokens, internal flags, or implementation-only fields.
- Use one documented response envelope consistently, such as `{ "data": ... }` for success and `{ "error": { "code", "message", "details?" } }` for failures. Error messages exposed to clients must be safe and actionable.
- Use cursor pagination for growing collections. Validate and cap page size, return pagination metadata/cursors, and whitelist sorting/filtering fields.
- Make retry-sensitive create operations idempotent when clients may safely retry them, using an idempotency key persisted or coordinated appropriately.
- Keep OpenAPI documentation aligned with public routes, schemas, status codes, and examples whenever an API surface is added or changed.

## Data, Validation, and Caching Rules

- Treat the Prisma schema and migrations as source-controlled production artifacts. Never use `prisma db push` as a production migration workflow; create, review, and apply migrations deliberately.
- Add database constraints for invariants: `NOT NULL`, unique indexes, foreign keys, check constraints, and indexes supporting real query patterns. Application validation supplements—not replaces—database integrity.
- Use `select` deliberately in Prisma queries and paginate before loading related collections. Avoid N+1 queries and unbounded reads.
- Run multi-write business operations inside a Prisma transaction. Convert known Prisma constraint errors into the relevant domain/API error without leaking database details.
- Parse and validate environment variables once at startup with Zod; fail fast on missing, malformed, or insecure configuration.
- Cache only data with defined keys, TTLs, and invalidation behavior. Invalidate/update affected entries after successful writes; tolerate cache misses and Redis outages according to the feature's documented fallback. Never cache credentials or authorization-sensitive data under keys that can cross users/tenants.

## Security, Reliability, and Operations

- Authenticate before protected handlers and authorize every resource operation. Enforce ownership/tenant scope in services, not merely in route shapes.
- Hash passwords with a modern adaptive password hash; never log credentials, session tokens, API keys, request authorization headers, or raw personally identifiable information.
- Use parameterized Prisma queries; raw SQL must be exceptional, reviewed, parameterized, and documented.
- Set secure HTTP headers, restrictive CORS rules, request body size limits, and rate limits—especially for authentication and expensive endpoints.
- Centralize error handling. Log unexpected errors with structured context and a request/correlation ID; return a generic `500` response to clients. Do not let unhandled rejections terminate requests silently.
- Implement graceful startup/shutdown: validate configuration, connect dependencies intentionally, stop accepting traffic, and disconnect Prisma/Redis on shutdown.
- Add health/readiness endpoints that do not disclose secrets. Readiness should reflect required dependency availability.
- Use UTC ISO-8601 timestamps at API boundaries and store timestamp data with timezone-aware PostgreSQL types.

## Coding Style, Testing, and Tooling

- Enable TypeScript `strict`, avoid `any`, and prefer narrow types, typed errors, and `unknown` at trust boundaries.
- Use `camelCase` for variables/functions, `PascalCase` for types/classes, and `kebab-case` for non-code assets. Use `.ts` filenames such as `user.service.ts` and four-space indentation unless formatter configuration says otherwise.
- Configure ESLint and Prettier early, and run them along with type-checking before requesting review. Avoid formatting-only changes in functional pull requests.
- Add unit tests for services, validators, and helpers; add integration tests for routes, authentication, error handling, database constraints, and Redis-dependent behavior. Include authorization, malformed input, boundary, not-found, and conflict cases.
- Tests must use isolated test configuration and must never point at a development or production database. Run migrations against the test database as part of reproducible integration setup.
- Document canonical clean-checkout commands in `README.md` when tooling is added (at minimum: development, lint, type-check, test, build, Prisma migration, and seed commands if applicable).

## Commits and Pull Requests

Use concise imperative commit subjects, such as `Add article creation validation`. Keep commits focused. Pull requests should explain the behavior and motivation, list migrations/configuration changes, state validation performed, update API documentation where relevant, and include examples or screenshots for user-visible changes. Do not commit generated output, caches, credentials, local database files, or editor-specific settings.
