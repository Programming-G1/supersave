#!/bin/zsh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_STATIC_DIR="$ROOT_DIR/backend/src/main/resources/static"

cd "$FRONTEND_DIR"
npm run build

rm -rf "$BACKEND_STATIC_DIR"
mkdir -p "$BACKEND_STATIC_DIR"
cp -R "$FRONTEND_DIR/dist/." "$BACKEND_STATIC_DIR/"
