# Task Tracker

[![CI/CD](https://github.com/MdTabish24/task-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/MdTabish24/task-tracker/actions/workflows/ci.yml)

A responsive task and time tracker with private workspaces, refresh-safe timers, time logs and daily summaries.

**[Open the live app](https://140-245-9-202.sslip.io:8443/)** · [API health](https://140-245-9-202.sslip.io:8443/health)

**Test account:** `test@example.com` / `password123`

## What it does

- Verify your email with a one-time code at signup, then log in and manage only your own tasks and time logs.
- Create, edit and delete tasks; start or stop one timer at a time. Elapsed time survives refreshes.
- Browse individual time logs and see daily totals by task.
- Switch between light and dark neumorphic themes on desktop or mobile.

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

Requirements: Node.js 20+ and Docker (for PostgreSQL). Run the backend and frontend commands in separate terminals.

```bash
# Postgres (dev and test databases)
docker run -d --name task-tracker-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=task_tracker -p 5433:5432 postgres:16-alpine
docker exec task-tracker-db psql -U postgres -c "CREATE DATABASE task_tracker_test"

# Backend (http://localhost:3000)
cd backend
cp .env.example .env        # then set JWT_SECRET to 32+ random characters
npm ci
npm run migrate
npm run seed                # creates test@example.com / password123
npm run dev

# Frontend (http://localhost:5173, proxies /api to the backend)
cd frontend
npm ci
npm run dev
```

Without SMTP credentials, development prints signup codes in the backend terminal. Production requires a Gmail address with 2-Step Verification and an [app password](https://support.google.com/mail/answer/185833); keep both in the backend `.env` on the VPS.

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
| `SMTP_USER` | production | Gmail address used to send signup codes |
| `SMTP_APP_PASSWORD` | production | Gmail app password (never the account password) |

**Frontend**

| Variable | Description |
|---|---|
| `VITE_API_URL` | API base URL including `/api` (default `/api`, used with the dev proxy) |

## API overview

All routes are under `/api` and need `Authorization: Bearer <token>` except signup, verification, code resend and login. Full request and response shapes are in [PLAN.md](PLAN.md#api-contract).

| Route | Purpose |
|---|---|
| `POST /auth/signup`, `POST /auth/verify`, `POST /auth/resend`, `POST /auth/login`, `GET /auth/me` | Authentication and signup verification |
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

## CI/CD

[GitHub Actions](.github/workflows/ci.yml) runs backend typecheck, API tests against an isolated PostgreSQL service, and both production builds on every pull request and push. A passing push to `main` runs the [VPS deploy script](deploy/vps-deploy.sh): install locked dependencies, build, apply migrations, restart the API and check the live app. Deployment uses a restricted SSH key stored in GitHub Actions secrets; database, JWT and SMTP secrets stay on the VPS.
