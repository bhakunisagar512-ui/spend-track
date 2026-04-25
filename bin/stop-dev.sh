#!/usr/bin/env bash
set -euo pipefail

# ─── Paths ────────────────────────────────────────────────────────────────────
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$DIR/.."
cd "$PROJECT_ROOT"

# ─── Helpers ──────────────────────────────────────────────────────────────────
log()     { echo -e "\033[0;36m[spendai]\033[0m $1"; }
success() { echo -e "\033[0;32m[✔]\033[0m $1"; }

# ─── Parse flags ──────────────────────────────────────────────────────────────
# Usage:
#   bin/stop-dev.sh           → stop containers, keep DB data
#   bin/stop-dev.sh --wipe-db → stop containers, delete DB volume
WIPE_DB=false
[[ "${1:-}" == "--wipe-db" ]] && WIPE_DB=true

# ─── Stop ─────────────────────────────────────────────────────────────────────
log "Stopping all services..."
if [[ "$WIPE_DB" == true ]]; then
  echo -e "\033[0;31m[!]\033[0m --wipe-db flag set. Database volume will be deleted."
  docker-compose down --volumes --remove-orphans
else
  docker-compose down --remove-orphans
fi
success "All services stopped."

# ─── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  SpendAI — Stopped"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [[ "$WIPE_DB" == true ]]; then
  echo "  Database volume wiped."
else
  echo "  Database volume preserved."
  echo "  Use --wipe-db flag to clear it."
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Restart:  bin/start-dev.sh"
echo "  Rebuild:  bin/build-and-run.sh"
echo ""