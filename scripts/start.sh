#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"
# Railway provides PORT environment variable
PORT="${PORT:-5000}"

start_service() {
    cd "${COZE_WORKSPACE_PATH}"
    
    echo "Starting Next.js server on port ${PORT}..."
    # Use npx next start with explicit port
    npx next start --port ${PORT} --hostname 0.0.0.0
}

echo "Starting HTTP service on port ${PORT}..."
start_service
