CREATE TABLE pending_signups (
  email         text PRIMARY KEY,
  name          text NOT NULL,
  password_hash text NOT NULL,
  code_hash     text NOT NULL,
  expires_at    timestamptz NOT NULL,
  sent_at       timestamptz NOT NULL DEFAULT now(),
  attempts      integer NOT NULL DEFAULT 0
);
