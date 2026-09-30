# Task Tracker

A task and time tracking app: create and manage tasks, run a real-time timer per task, browse time logs, and see a daily productivity summary.

- **App:** https://140-245-9-202.sslip.io:8443/
- **API:** https://140-245-9-202.sslip.io:8443/api (health check: `/health`)

**Test account:** `test@example.com` / `password123`

## Tech stack

- **Backend:** Node.js, Express 5, TypeScript (strict), PostgreSQL (`pg`, plain SQL), Zod, JWT + bcrypt
- **Frontend:** React, Vite, TypeScript, Tailwind CSS
- **Hosting:** Oracle Cloud VPS: Nginx (HTTPS, reverse proxy), Node API as a systemd service, PostgreSQL in Docker

## Design notes

- **Layers:** `routes` (validation middleware) → `controllers` → `services` (business rules) → `repositories` (all SQL, parameterized).
- **Authorization:** every query is scoped by `user_id`. Another user's task or log is indistinguishable from a missing one (`404`).
- **Timer:** the server stores `started_at`/`ended_at` (`timestamptz`, UTC); elapsed time is derived from them, so it survives refreshes. A partial unique index (`time_logs(user_id) WHERE ended_at IS NULL`) guarantees one active timer per user, even under concurrent requests.
- **Daily summary:** one aggregate query. The client sends its local day as `from`/`to` timestamps with an offset, so days follow the user's timezone.
- **Errors:** a single error handler returns `{ "error": { "message", "details?" } }` with correct status codes and never leaks stack traces.
- **Security:** bcrypt (cost 12), short-lived JWTs, helmet, a strict CORS allowlist, and rate limiting on auth endpoints.

## Local setup

Requirements: Node.js 20+ and Docker (for Postgres).

```bash
# Postgres (dev and test databases)
docker run -d --name task-tracker-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=task_tracker -p 5433:5432 postgres:16-alpine
docker exec task-tracker-db psql -U postgres -c "CREATE DATABASE task_tracker_test"

# Backend (http://localhost:3000)
cd backend
cp .env.example .env        # then set JWT_SECRET to 32+ random characters
npm install
npm run migrate
npm run seed                # creates test@example.com / password123
npm run dev

# Frontend (http://localhost:5173, proxies /api to the backend)
cd frontend
npm install
npm run dev
```

Backend tests (Vitest + Supertest, run against `task_tracker_test`):

```bash
cd backend && npm test
```

## Environment variables

**Backend** (`backend/.env`, see `.env.example`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `JWT_SECRET` | yes | Signing secret, at least 32 characters |
| `CORS_ORIGINS` | yes | Comma-separated list of allowed frontend origins |
| `NODE_ENV` | no | `development` (default), `production` or `test` |
| `PORT` | no | Default `3000` |
| `JWT_EXPIRES_IN` | no | Token lifetime such as `24h` (default), `90m` |

**Frontend**

| Variable | Description |
|---|---|
| `VITE_API_URL` | API base URL including `/api` (default `/api`, used with the dev proxy) |

## API overview

All routes are under `/api` and need `Authorization: Bearer <token>` except signup and login. Full request and response shapes are in [PLAN.md](PLAN.md#api-contract).

| Route | Purpose |
|---|---|
| `POST /auth/signup`, `POST /auth/login`, `GET /auth/me` | Authentication |
| `GET /tasks`, `POST /tasks`, `GET/PATCH/DELETE /tasks/:id` | Task management |
| `POST /tasks/:id/timer/start`, `POST /timer/stop`, `GET /timer/active` | Timer |
| `GET /time-logs` | Paginated time logs (`from`, `to`, `taskId`, `limit`, `offset`) |
| `GET /summary` | Daily totals per task for a `from`/`to` range |

## Deployment

The app and API are served from one origin on an Oracle Cloud VPS.

- **Nginx** terminates HTTPS (Let's Encrypt, auto-renewed by `certbot-renew.timer`), serves the frontend build and proxies `/api` to the API.
- **API:** `task-tracker-api` systemd service runs the built Node server with `NODE_ENV=production`. Migrations are applied separately during deployment; Nginx forwards the client IP for auth rate limiting.
- **Database:** PostgreSQL in a Docker container with the `unless-stopped` restart policy.
- Nginx, the API service and Docker are enabled at boot.
