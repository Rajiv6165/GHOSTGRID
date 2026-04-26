# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci && npm cache clean --force

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 3: Runner
FROM node:18-alpine AS runner
WORKDIR /app

# Set environment
ENV NODE_ENV production

# Create non-root user
RUN addgroup --g 1001 --system nodejs
RUN adduser --uid 1001 --system nextjs

# Copy standalone build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy package.json for production dependencies
COPY --from=builder /app/package.json ./package.json

# Install production dependencies
RUN npm install --production

# Change ownership
RUN chown -R nextjs:nodejs /app/.next
RUN chown -R nextjs:nodejs /app/public
RUN chown nextjs:nodejs /app/package.json

USER nextjs

# Expose port
EXPOSE 3000

# Set environment variables
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Start the application
CMD ["node", "server.js"]