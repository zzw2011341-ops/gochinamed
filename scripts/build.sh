#!/bin/bash
set -euo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

echo "Installing dependencies..."
pnpm install

# Ensure TypeScript is available
if ! npx tsc --version &> /dev/null; then
  echo "Installing TypeScript..."
  pnpm add -D typescript
fi

echo "Building the project..."
pnpm next build

echo "Build completed successfully!"
