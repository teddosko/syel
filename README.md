# DB Chat Guard

Production-ready multi-tenant web application for safe natural-language database access.

## Why JWT over cookies?
This project uses short-lived JWT access tokens + refresh tokens because API and frontend are separate services in Docker/VM deployments. This avoids CSRF complexity for API calls and supports future mobile/CLI clients.

## Stack
- Backend: Fastify + TypeScript + Prisma + PostgreSQL metadata DB
- Frontend: Next.js + Tailwind
- Shared package: policy engine + SQL validator
- SQL AST parser: `pgsql-ast-parser` (Postgres-aware parser)

## Security defaults
- Default deny allowlist (role table/column permissions)
- Read-only role permissions by default
- SQL AST validation + blocked keyword hard checks
- Multi-statement blocked
- DB connector secrets encrypted at rest using AES-256-GCM via `ENCRYPTION_KEY`
- `SET LOCAL statement_timeout` and `SET LOCAL default_transaction_read_only = on`
- Tenant isolation enforced in route scoping and queries
- Audit log for every chat execution
- Password hashing via argon2
- Basic user rate limiting

## Run locally
```bash
cp .env.example .env
docker compose -f infra/docker-compose.yml up --build
```

## Seeded access
- Admin email: `admin@example.com`
- Admin password: `ChangeMe123!`
- Tenant name: `Acme Inc`
- Tenant ID is printed in backend logs during seed.

## Core workflows
1. Login as admin.
2. Add DB connection (`POST /connections`) with least privileged DB user.
3. Test connection (`POST /connections/test`).
4. Introspect schema (`POST /connections/:id/introspect`).
5. Configure role allowlist/policies (`/roles`, `/policies`).
6. Invite analyst (`POST /auth/invite`).
7. Analyst chats via `/chat/:conversationId/message`; sees explanation + executed SQL + row count + latency.

## API endpoints
- Auth: `/auth/login`, `/auth/logout`, `/auth/refresh`, `/auth/invite`, `/auth/reset`
- Tenants: `/tenants`
- Users: `/users` (CRUD-ish)
- Roles: `/roles`
- Policies: `/policies`
- Connections: `/connections`, `/connections/test`, `/connections/:id/introspect`
- Chat: `POST /chat/:conversationId/message`
- Logs: `GET /audit`

## Deployment to single VM
- Install Docker + Compose plugin
- Copy repo and `.env`
- `docker compose -f infra/docker-compose.yml up -d --build`
- Put frontend/backend behind reverse proxy (Caddy/Nginx)

## Prompt injection mitigation
- LLM only receives scoped allowlisted schema subset and user question.
- No connection credentials or secrets are included in prompts.
- Strict JSON response format is required from model.

## Notes
- MySQL support is enabled by architecture via connector service boundary (`query.service.ts`) and can be added by implementing a MySQL connector adapter.
