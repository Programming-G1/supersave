#!/bin/zsh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$ROOT_DIR/frontend"
npm run build

mkdir -p "$ROOT_DIR/backend/src/main/resources/static"
rsync -a --delete "$ROOT_DIR/frontend/dist/" "$ROOT_DIR/backend/src/main/resources/static/"

echo "Frontend assets synced to backend/src/main/resources/static"
