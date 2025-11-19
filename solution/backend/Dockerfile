# Multi-stage build for production
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files first (for better layer caching)
# Explicitly copy package.json and package-lock.json
COPY package.json ./
COPY package-lock.json* ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci --prefer-offline --no-audit && \
    npm cache clean --force && \
    # Remove source maps and unnecessary files to save space
    find node_modules -name "*.map" -type f -delete 2>/dev/null || true && \
    find node_modules -name "*.ts" -type f -delete 2>/dev/null || true && \
    find node_modules -name "*.d.ts" -not -path "*/@types/*" -type f -delete 2>/dev/null || true && \
    find node_modules -name "*.md" -type f -delete 2>/dev/null || true && \
    find node_modules -name "LICENSE" -type f -delete 2>/dev/null || true && \
    find node_modules -name "CHANGELOG*" -type f -delete 2>/dev/null || true

# Copy source code
COPY . .

# Build the application
RUN npm run build && \
    # Compile migrations to dist/migrations (nest build doesn't compile migrations by default)
    # Create dist/migrations directory
    mkdir -p dist/migrations && \
    # Compile all migrations using TypeScript compiler with proper config
    if [ -d "src/migrations" ] && [ "$(ls -A src/migrations/*.ts 2>/dev/null)" ]; then \
      npx tsc src/migrations/*.ts \
        --outDir dist/migrations \
        --module commonjs \
        --target ES2020 \
        --esModuleInterop \
        --skipLibCheck \
        --resolveJsonModule \
        --moduleResolution node \
        --declaration false \
        --sourceMap false \
        --noEmitOnError false 2>&1 || \
      echo "⚠️ Migration compilation completed with warnings"; \
    fi && \
    # Remove source maps from dist after build
    find dist -name "*.map" -type f -delete 2>/dev/null || true

# Production stage
FROM node:18-alpine AS production

# Install dumb-init and wget for proper signal handling and health checks
RUN apk add --no-cache dumb-init curl wget

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001 -G nodejs

# Set working directory
WORKDIR /app

# Copy only necessary files from builder stage
COPY --from=builder /app/dist ./dist
# Note: Migrations should already be compiled to dist/migrations/*.js during build stage
# Install only production dependencies (exclude dev dependencies)
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json* ./
RUN npm ci --only=production --prefer-offline --no-audit && \
    npm cache clean --force && \
    # Remove source maps and unnecessary files from production node_modules
    find node_modules -name "*.map" -type f -delete 2>/dev/null || true && \
    find node_modules -name "*.ts" -type f -delete 2>/dev/null || true && \
    find node_modules -name "*.d.ts" -not -path "*/@types/*" -type f -delete 2>/dev/null || true && \
    find node_modules -name "*.md" -type f -delete 2>/dev/null || true && \
    find node_modules -name "LICENSE" -type f -delete 2>/dev/null || true && \
    find node_modules -name "CHANGELOG*" -type f -delete 2>/dev/null || true
# Create default .env if it doesn't exist
RUN if [ ! -f .env ]; then echo "NODE_ENV=production" > .env; fi

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=5 CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["dumb-init", "node", "dist/main"]
