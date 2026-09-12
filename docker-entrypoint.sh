#!/bin/sh
set -e
DATA_DIR="$(dirname "${ZIKIBOLS_DATA_PATH:-/data/state.json}")"
mkdir -p "$DATA_DIR"
if [ "$(id -u)" = "0" ]; then
  chown -R node:node "$DATA_DIR" 2>/dev/null || true
  if command -v runuser >/dev/null 2>&1; then
    exec runuser -u node -- "$@"
  fi
fi
exec "$@"
