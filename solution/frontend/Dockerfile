# Build stage
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files first (for better layer caching)
COPY package*.json ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Create .env file from production.env if it exists, otherwise create default
RUN if [ -f production.env ]; then cp production.env .env; else \
      echo "VITE_API_URL=http://localhost:3000" > .env && \
      echo "VITE_WS_URL=http://localhost:3000" >> .env && \
      echo "VITE_ENV=production" >> .env; \
    fi

# Build the application
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine AS production

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built frontend files
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration from builder stage
COPY --from=builder /app/nginx.conf /etc/nginx/nginx.conf

# Change ownership (nginx user already exists)
RUN chown -R nginx:nginx /usr/share/nginx/html
RUN chown -R nginx:nginx /var/cache/nginx
RUN chown -R nginx:nginx /var/log/nginx
RUN chown -R nginx:nginx /etc/nginx/conf.d
RUN touch /var/run/nginx.pid
RUN chown -R nginx:nginx /var/run/nginx.pid

# Switch to nginx user
USER nginx

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=5 CMD curl -f http://localhost || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]