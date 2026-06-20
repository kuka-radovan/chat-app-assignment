#!/bin/sh
set -e

cd /app

if [ ! -d node_modules/.pnpm ]; then
  echo "Installing dependencies..."
  pnpm install --frozen-lockfile --ignore-scripts
fi

if [ "${QUASAR_PREPARE:-}" = "true" ]; then
  echo "Preparing Quasar..."
  pnpm --filter @chat/client exec quasar prepare --silent
fi

exec "$@"
