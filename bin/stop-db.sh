#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "Stopping and removing db service..."
docker-compose stop db || true
docker-compose rm -f db || true
echo "Done."
