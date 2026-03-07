#!/usr/bin/env bash
# Start the full Westbridge platform (app + Postgres + ERPNext) with Docker.
# Usage: ./start.sh   or   bash start.sh
# Requires: Docker and Docker Compose v2.

set -e
cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required. Install from https://docs.docker.com/get-docker/"
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose v2 is required. Run: docker compose version"
  exit 1
fi

echo "Starting Westbridge platform (app + Postgres + ERPNext)..."
docker compose -f docker-compose.platform.yml up -d --build

echo ""
echo "Stack is starting. Wait 1–2 minutes for ERPNext first-time setup."
echo "  App:     http://localhost:3000"
echo "  ERPNext: http://localhost:8080"
echo ""
echo "To follow logs: docker compose -f docker-compose.platform.yml logs -f"
echo "To stop:        docker compose -f docker-compose.platform.yml down"
