# GOAL

Build a **Task and Time Tracking App** (full stack) for a job assignment. Users manage tasks, track time with a real-time timer, and view daily productivity summaries.

**Deadline: 2 October 2026.**

## Requirements

### 1. Authentication
- [ ] Sign up
- [ ] Verify email with a one-time code before first login
- [ ] Log in
- [ ] Log out
- [ ] Passwords hashed (bcrypt), sessions via JWT
- [ ] A user only sees and manages their own tasks and time logs
- [ ] Every protected route/API enforces authorization

### 2. Task management
- [ ] Create a task from natural-language input (e.g. "follow up with designer")
- [ ] View all tasks
- [ ] Edit/update task details
- [ ] Delete a task

### 3. Time tracking
- [ ] Start a timer on a task, stop it
- [ ] Timer is real-time in the UI and survives page refresh (computed from a server-stored start timestamp)
- [ ] One active timer per user
- [ ] Time logs stored per task
- [ ] View all time logs

### 4. Daily summary
- [ ] Total time tracked for a day
- [ ] Breakdown per task

### 5. Deployment
- [ ] Backend, database and frontend deployed and reachable via public URLs
- [ ] README with setup steps and live links

## Deliverables
- [ ] Git repository with small, clear commits
- [ ] Working backend (Express + PostgreSQL, TypeScript)
- [ ] Working frontend matching the UI reference image (to be supplied)
- [ ] Deployed app (live URLs)
- [ ] README: setup, env vars, API overview, design decisions

## Evaluation criteria
Stated: backend design, API structure, authentication, deployment, ability to build clean, functional UIs.

Our own bar: reviewers will read the code. It must be tight, clean and obviously intentional. No dead code, no padding, nothing that doesn't serve a requirement above.
