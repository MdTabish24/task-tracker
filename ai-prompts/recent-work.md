# Recent AI-assisted work

This is a summary supplement to `codex.md`, not a verbatim conversation export.

## User requests

- Improve the README and add a CI/CD pipeline.
- Mention CI/CD in the README and add email OTP verification at first account creation using Gmail and an app password.
- Add an Inbox/Spam reminder because verification emails arrived in Spam, and cross-check the assignment requirements.
- Commit, push and deploy the reminder; read the pasted HR correspondence and identify remaining submission requirements.

## Work performed

- Added GitHub Actions checks for backend typecheck, API integration tests and both production builds, followed by deployment to the Oracle VPS after successful pushes to main.
- Added signup email verification, code expiry, attempt limits and resend cooldown; SMTP credentials remain on the VPS.
- Added the frontend verification screen and a persistent Inbox/Spam reminder.
- Updated the README and API contract, and checked live authentication, tasks, timer, time logs and summary endpoints.
- Reviewed the HR correspondence: TypeScript backend, submission by October 2, 2026, and AI prompts/history accompanying the submission.

No passwords, tokens, private keys or verification codes are included here.
