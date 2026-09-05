#!/usr/bin/env bash
# Cloud Agent install phase: durable, idempotent project setup.
# Installs the system database (PostgreSQL 16 + pgvector) and Node dependencies.
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

# --- System dependencies: PostgreSQL 16 + pgvector (schema requires the
#     `vector` extension for bookmark embeddings). Idempotent. ---
if ! command -v psql >/dev/null 2>&1; then
  sudo apt-get update
  sudo apt-get install -y --no-install-recommends \
    postgresql postgresql-contrib postgresql-16-pgvector
fi

# --- Node dependencies ---
# Pin pnpm to the version the lockfile was generated with. Using
# `corepack prepare ... --activate` (rather than `corepack enable`, which grabs
# the latest pnpm) keeps the version deterministic and lockfile-compatible.
corepack prepare pnpm@10.33.3 --activate >/dev/null 2>&1 || true
pnpm install --frozen-lockfile

echo "install.sh: done"
