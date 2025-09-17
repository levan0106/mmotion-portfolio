# Local Implementation & Run Guide

This guide explains how to run the Portfolio Management System locally before deploying to cloud.

## Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 14+ (via Docker recommended)
- Redis 6+ (via Docker recommended)

## Services (Docker Compose)
Create `docker-compose.yml` at the project root:

```yaml
version: '3.9'
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: portfolio_db
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:6
    ports:
      - "6379:6379"

volumes:
  pgdata:
```

## Environment Variables
Copy `.env.example` to `.env` and update:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/portfolio_db
REDIS_URL=redis://localhost:6379
PORT=3000
NODE_ENV=development
```

## Install & Run
```bash
# Install dependencies
npm install

# Start infra
docker-compose up -d postgres redis

# Run migrations
npm run typeorm:migration:run

# Seed minimal data (optional script)
npm run seed:dev

# Start backend
npm run dev
```

## Verify Locally
- Swagger: `http://localhost:3000/api`
- Healthcheck: `GET /health`
- WebSocket: connect to `ws://localhost:3000` (if enabled)
- Basic endpoints:
  - `GET /api/v1/portfolios`
  - `GET /api/v1/trades`
  - `GET /api/v1/market/prices`

## Troubleshooting
- If migrations fail, ensure `DATABASE_URL` is correct and Postgres is up.
- If Redis connection errors appear, confirm `REDIS_URL` and container status.
- Use `docker logs <service>` for container logs.
- Clear node modules and rebuild if dependency issues persist.

## Next Steps
- After local verification, proceed to build production Docker images and deploy to cloud (see `ci_cd_pipeline.md`).
