#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"
PORT=5000
DEPLOY_RUN_PORT="${DEPLOY_RUN_PORT:-$PORT}"

start_service() {
    cd "${COZE_WORKSPACE_PATH}"
    
    # Check if standalone mode is available (for Railway deployment)
    if [ -f ".next/standalone/server.js" ]; then
        echo "Starting standalone Next.js server on port ${DEPLOY_RUN_PORT}..."
        node .next/standalone/server.js
    else
        echo "Starting Next.js server on port ${DEPLOY_RUN_PORT}..."
        npx next start --port ${DEPLOY_RUN_PORT}
    fi
}

echo "Starting HTTP service on port ${DEPLOY_RUN_PORT} for deploy..."
start_service
