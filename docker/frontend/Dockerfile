# Frontend Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY src/frontend/package*.json ./src/frontend/

# Install root dependencies
RUN npm install --legacy-peer-deps

# Install workspace dependencies
WORKDIR /app/src/frontend
RUN npm install --legacy-peer-deps

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy all source code
COPY . .

# Install dependencies
RUN npm install --legacy-peer-deps

# Build frontend
WORKDIR /app/src/frontend
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/src/frontend/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/src/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/src/frontend/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
