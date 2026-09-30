# AGENTS.md

Rules for any AI agent (Claude Code, Codex, etc.) working in this repo. Read [GOAL.md](GOAL.md) for what we're building and [PLAN.md](PLAN.md) for the steps and API contract. Do not start coding a step the user hasn't approved.

## 1. Code quality (most important)
Company reviewers will read this repo. The code must be small, clean and high quality.
- No garbage: no dead code, no unused files, no unused dependencies, no needless abstractions, no noisy comments, no `console.log`, no placeholder or speculative features.
- If it can be done in 10 lines, don't write 50.
- Add a dependency only when it clearly earns its place; remove it the moment it stops being used.
- Comments explain *why*, never *what*. Most code needs none.
- Only build what GOAL.md requires.
- Before finishing a task, re-read your diff and delete anything that isn't needed.

## 2. Backend
- TypeScript, `strict: true`. No `any`.
- Express + PostgreSQL (`pg`, plain SQL, no ORM) + JWT auth with bcrypt + Zod for all input validation.
- Layout: `routes` (wiring + Zod validation middleware) → `controllers` (thin, HTTP in/out) → `services` (business rules) → `repositories` (all SQL, parameterized only). Keep it flat; don't over-engineer.
- Config from environment variables, validated once at startup. Never commit secrets; keep `.env.example` current.

## 3. Security and data scoping
- Every query is scoped to the authenticated user (`WHERE user_id = $1`). A user must never read or modify another user's tasks or time logs.
- Someone else's resource returns `404`, same as a missing one.
- All routes except signup/login require the auth middleware.
- Never return or log password hashes.

## 4. HTTP and errors
- Correct status codes: 200, 201, 204, 400 (validation), 401, 404, 409, 500.
- One central error handler produces the response shape defined in PLAN.md. Controllers throw; they don't format errors.

## 5. Timer
- The server owns `started_at`/`ended_at` (`TIMESTAMPTZ`, UTC). Clients derive elapsed time from `started_at`, never from a local counter, so it stays correct across refreshes.
- One active timer per user, enforced by the database (partial unique index), not just by application code.

## 6. Frontend
- Follow the UI reference image closely once provided. Ask if something is unclear.
- Keep components small; no state library or UI kit unless clearly justified.

## 7. Git
- Small commits, one feature per commit, conventional commit messages (`feat(auth): add signup and login`).
- Don't commit generated files, `node_modules`, or `.env`.
- Don't commit or push unless the user asks.

## 8. Working agreement
- Verify your work (typecheck, run it) before saying it's done. Report failures honestly.
- Keep PLAN.md checkboxes and the API contract in sync with the code; if the contract must change, update PLAN.md in the same commit.
