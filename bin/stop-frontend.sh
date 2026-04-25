#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "Stopping and removing frontend service..."
docker-compose stop frontend || true
docker-compose rm -f frontend || true
echo "Done."
