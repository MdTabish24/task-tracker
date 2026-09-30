#!/usr/bin/env bash
set -euo pipefail

cd /srv/contabo/task-tracker/backend
npm ci --no-audit --no-fund
npm run build
node --env-file=.env dist/db/migrate.js

cd ../frontend
npm ci --no-audit --no-fund
npm run build
sudo restorecon -RF dist >/dev/null
sudo systemctl restart task-tracker-api

for attempt in {1..15}; do
  if curl --fail --silent http://127.0.0.1:3100/health >/dev/null; then
    exit 0
  fi
  sleep 2
done
exit 1
