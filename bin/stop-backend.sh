#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "Stopping and removing backend service..."
docker-compose stop backend || true
docker-compose rm -f backend || true
echo "Done."
