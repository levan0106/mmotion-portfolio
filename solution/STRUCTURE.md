# Cấu Trúc Dự Án Mới

## Tổng Quan

Dự án đã được tái cấu trúc để tách rời backend và frontend code, giúp quản lý dễ dàng hơn.

## Cấu Trúc Thư Mục

```
mmotion-portfolio/
├── solution/                    # Source code và documentation
│   ├── backend/                 # Backend code (NestJS)
│   │   ├── src/                # Source code
│   │   ├── test/               # Tests
│   │   ├── dist/               # Build output
│   │   ├── scripts/            # Utility scripts
│   │   ├── backups/            # Database backups
│   │   ├── logs/               # Application logs
│   │   ├── init-scripts/       # Database initialization
│   │   ├── package.json        # Backend dependencies
│   │   ├── tsconfig.json       # TypeScript config
│   │   ├── Dockerfile          # Production Dockerfile
│   │   ├── Dockerfile.dev      # Development Dockerfile
│   │   └── docker-compose.yml  # Backend-specific compose
│   │
│   ├── frontend/                # Frontend code (React)
│   │   ├── src/                # Source code
│   │   ├── build/              # Build output
│   │   ├── public/             # Static assets
│   │   ├── package.json        # Frontend dependencies
│   │   ├── Dockerfile          # Production Dockerfile
│   │   ├── Dockerfile.dev      # Development Dockerfile
│   │   └── docker-compose.yml  # Frontend-specific compose
│   │
│   └── document/                # Documentation
│       ├── docs/               # Technical documentation
│       ├── memory-bank/        # Project context
│       ├── document/           # Additional docs
│       └── README.md           # Main README
│
├── prompt/                      # Prompt templates (development workflow)
├── infrastructure/              # AWS CDK infrastructure code
├── grafana/                     # Grafana dashboards
├── prometheus/                  # Prometheus configuration
├── logstash/                    # Logstash configuration
├── docker-compose.yml           # Main Docker Compose (full stack)
├── nginx-api-proxy.conf         # Nginx configuration
├── .github/                     # GitHub Actions workflows
└── LICENSE                      # License file
```

## Những Thay Đổi Chính

### 1. Backend Code
- **Trước**: `src/`, `test/`, `package.json` ở root
- **Sau**: Tất cả di chuyển vào `solution/backend/`

### 2. Frontend Code
- **Trước**: `frontend/` ở root
- **Sau**: Di chuyển vào `solution/frontend/`

### 3. Documentation
- **Trước**: `docs/`, `memory-bank/`, `document/`, `prompt/` ở root
- **Sau**: 
  - `docs/`, `memory-bank/`, `document/` → `solution/document/`
  - `prompt/` → `prompt/` (ở root level)

### 4. Scripts & Utilities
- **Trước**: `scripts/`, `backups/`, `logs/` ở root
- **Sau**: Tất cả di chuyển vào `solution/backend/`

### 5. Docker Compose Files
- **Trước**: `docker-compose.backend.yml`, `docker-compose.frontend.yml` ở root
- **Sau**: 
  - `docker-compose.backend.yml` → `solution/backend/docker-compose.yml`
  - `docker-compose.frontend.yml` → `solution/frontend/docker-compose.yml`
  - `docker-compose.yml` (main) vẫn ở root nhưng đã cập nhật paths

### 6. Environment Files
- **Backend**: `env.example`, `env.development.example`, `env.staging.example`, `production.env` → `solution/backend/`
- **Frontend**: `env.example`, `production.env` → `solution/frontend/`

## Cách Sử Dụng

### Development

#### Backend
```bash
cd solution/backend
npm install
npm run start:dev
```

#### Frontend
```bash
cd solution/frontend
npm install
npm run dev
```

#### Full Stack (Docker)
```bash
# Từ root directory
docker-compose up -d
```

### Production

#### Backend
```bash
cd solution/backend
docker-compose up -d
```

#### Frontend
```bash
cd solution/frontend
npm run build
docker-compose up -d
```

## CI/CD Updates

Tất cả GitHub Actions workflows đã được cập nhật:
- `.github/workflows/deploy.yml`
- `.github/workflows/deploy-s3-cloudfront.yml`
- `.github/workflows/deploy-docker-ec2.yml`

Paths đã được cập nhật từ:
- `./frontend` → `solution/frontend`
- `./backend` → `solution/backend`
- `frontend/build/` → `solution/frontend/build/`

## Lưu Ý

1. **Import Paths**: Các import paths trong code không thay đổi vì chúng sử dụng relative paths từ trong mỗi project.

2. **Docker Context**: Docker build context đã được cập nhật trong `docker-compose.yml`:
   - Backend: `context: ./solution/backend`
   - Frontend: `context: ./solution/frontend`

3. **Scripts**: Các scripts trong `package.json` vẫn hoạt động bình thường vì chúng chạy từ trong `solution/backend/` directory.

4. **Database Migrations**: Vẫn chạy từ `solution/backend/`:
   ```bash
   cd solution/backend
   npm run typeorm:migration:run
   ```

## Migration Checklist

- [x] Di chuyển backend code
- [x] Di chuyển frontend code
- [x] Di chuyển documentation
- [x] Di chuyển scripts, backups, logs
- [x] Di chuyển Docker compose files
- [x] Di chuyển environment files
- [x] Xóa duplicate folders
- [x] Cập nhật CI/CD workflows
- [x] Cập nhật docker-compose.yml
- [x] Cập nhật paths trong config files

## Next Steps

1. Test lại toàn bộ application sau khi tái cấu trúc
2. Cập nhật documentation nếu cần
3. Thông báo team về cấu trúc mới
4. Cập nhật deployment scripts nếu có

