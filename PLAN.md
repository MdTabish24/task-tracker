# PLAN

Assumptions (change if you disagree): monorepo with `backend/` and `frontend/`; frontend is React + Vite + TypeScript; auth via `Authorization: Bearer <jwt>` (logout = client discards the token); AI suggestions via the Claude API, optional and off if no key is set.

## Steps
Each step is one commit.

**Backend**
- [x] 1. Scaffold `backend/`: TypeScript strict, Express, env config (Zod), health route, `.gitignore`, `.env.example`
- [x] 2. Postgres connection + SQL migrations (users, tasks, time_logs) + migrate runner + seed script
- [x] 3. Central error handler (`AppError`) + Zod validation middleware
- [x] 4. Auth: signup, login, `me`, JWT middleware, rate limiting, helmet, CORS allowlist
- [x] 5. Tasks: create, list, get, update, delete (user-scoped)
- [x] 6. Timer: start, stop, active (one per user)
- [x] 7. Daily summary
- [ ] 8. AI task suggestion endpoint

**Frontend** (after the UI reference image is provided)
- [x] 9. Scaffold `frontend/`, API client, auth context, protected routes
- [x] 10. Signup / login / logout screens
- [x] 11. Task list + create (with AI suggestion) + edit
- [x] 12. Timer UI (live tick from server `startedAt`)
- [x] 13. Daily summary view
- [x] 14. Polish to match the reference design

**Ship**
- [ ] 15. Deploy DB, backend, frontend
- [ ] 16. README (setup, env, API overview, live links)
- [ ] 17. Final cleanup pass: unused code/deps, typecheck, manual end-to-end test

## Data model
```
users(id uuid pk, name text, email text unique, password_hash text, created_at)
tasks(id uuid pk, user_id fk, title text, description text, status 'todo'|'in_progress'|'done', created_at, updated_at)
time_logs(id uuid pk, user_id fk, task_id fk on delete cascade, started_at timestamptz, ended_at timestamptz null)
unique index on time_logs(user_id) where ended_at is null   -- one active timer per user
```

## API contract
Base path `/api`. JSON everywhere. All routes except signup/login need `Authorization: Bearer <token>`.

**Error shape** (all errors): `{ "error": { "message": string, "details"?: object } }`
Statuses: `400` validation, `401` missing/invalid token or bad credentials, `404` not found (or not yours), `409` conflict, `500` unexpected.

**Types**
```
User    { id, name, email }
Task    { id, title, description, status, createdAt, updatedAt }
TimeLog { id, taskId, startedAt, endedAt: string | null }
```

### Auth
| Route | Body | Success |
|---|---|---|
| `POST /auth/signup` | `{ name, email, password (min 8) }` | `201 { token, user }` (`409` if email taken) |
| `POST /auth/login` | `{ email, password }` | `200 { token, user }` |
| `GET /auth/me` | – | `200 User` |

### Tasks
| Route | Body | Success |
|---|---|---|
| `POST /tasks` | `{ title, description? }` | `201 Task` |
| `GET /tasks` | – | `200 Task[]` (newest first) |
| `GET /tasks/:id` | – | `200 Task` |
| `PATCH /tasks/:id` | any of `{ title, description, status }` | `200 Task` |
| `DELETE /tasks/:id` | – | `204` (its time logs are deleted with it; stops the timer if running) |
| `POST /tasks/suggest` | `{ input }` (natural language) | `200 { title, description }` (not saved; client then calls `POST /tasks`) |

### Timer
| Route | Body | Success |
|---|---|---|
| `POST /tasks/:id/timer/start` | – | `201 TimeLog` (`409` if the user already has an active timer) |
| `POST /timer/stop` | – | `200 TimeLog` with `endedAt` set (`404` if none active) |
| `GET /timer/active` | – | `200 { timeLog: TimeLog \| null, now: string }` |

The client computes elapsed as `now - startedAt` using the server's `now`, then ticks locally from that offset.

### Summary
| Route | Query | Success |
|---|---|---|
| `GET /summary` | `from`, `to` (ISO timestamps bounding the user's local day) | `200 { totalSeconds, tasks: [{ taskId, title, seconds }] }` |

A running timer counts up to the request time; logs are clipped to `[from, to]`.

## Open questions
- Deployment targets (suggestion: Neon/Supabase Postgres, Render backend, Vercel frontend).
