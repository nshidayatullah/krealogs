# --- Builder Stage ---
FROM node:22-alpine AS builder
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies (including devDependencies for building)
RUN npm ci

# Copy codebase
COPY . .

# Build both client and server bundle
RUN npm run build

# --- Production Stage ---
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy manifests
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built assets from builder
COPY --from=builder /app/dist ./dist

# Copy migrations so they can be run in the container if needed
COPY --from=builder /app/src/db ./src/db
COPY --from=builder /app/src/types.ts ./src/types.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Install global tsx for migrations (lightweight TypeScript execution in production if needed)
RUN npm install -g tsx

EXPOSE 3000

# Command to run database migrations first, then start the production Express server
CMD ["sh", "-c", "npx tsx src/db/migrate.ts && node dist/server.cjs"]
