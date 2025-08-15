# Multi-stage Dockerfile for Manito Application
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY core/package.json ./core/
COPY server/package.json ./server/
COPY client/package.json ./client/
COPY cli/package.json ./cli/

# Install dependencies with legacy peer deps resolution
RUN npm ci --legacy-peer-deps

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the client application
WORKDIR /app/client
RUN npm run build

# Production image, copy all the files and run the application
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Create a non-root user to run the application
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the built application
COPY --from=builder /app/package.json ./
COPY --from=builder /app/core ./core
COPY --from=builder /app/server ./server
COPY --from=builder /app/cli ./cli
COPY --from=builder --chown=nextjs:nodejs /app/client/dist ./client/dist

# Copy node_modules
COPY --from=builder /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Start the server
CMD ["node", "server/app.js"]