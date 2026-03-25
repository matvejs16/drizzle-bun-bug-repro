ARG BUN_VERSION=1.3.11
FROM oven/bun:${BUN_VERSION}-slim AS base

FROM base AS dependencies
WORKDIR /app

# Ensure we have the structure needed for Bun workspaces
COPY package.json bunfig.toml ./
COPY packages/pg-database/package.json ./packages/pg-database/

# Install everything
RUN bun install

# --- Apply original project patches ---
# We use a separate script to maintain readability for MRE
COPY patch-drizzle-v2.js .
RUN bun patch-drizzle-v2.js && rm patch-drizzle-v2.js

# Target for development
FROM base AS dev
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
