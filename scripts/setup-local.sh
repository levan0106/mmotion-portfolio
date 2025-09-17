#!/bin/bash
# run with powershell: & "C:\Program Files\Git\bin\bash.exe" scripts/setup-local.sh

# Portfolio Management System - Local Setup Script
echo "🚀 Setting up Portfolio Management System locally..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from env.example..."
    cp env.example .env
    echo "✅ .env file created. Please review and update if needed."
fi

# Install dependencies
echo "📦 Installing backend dependencies..."
npm install

echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Start services
echo "🐳 Starting Docker services..."
docker-compose up -d postgres redis

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if PostgreSQL is ready
echo "🔍 Checking PostgreSQL connection..."
until docker-compose exec postgres pg_isready -U postgres; do
    echo "⏳ Waiting for PostgreSQL..."
    sleep 2
done

# Check if Redis is ready
echo "🔍 Checking Redis connection..."
until docker-compose exec redis redis-cli ping; do
    echo "⏳ Waiting for Redis..."
    sleep 2
done

# Run database migrations
echo "🗄️ Running database migrations..."
npm run typeorm:migration:run

echo "✅ Local setup completed!"
echo ""
echo "🎯 Next steps:"
echo "1. Start the backend: npm run start:dev"
echo "2. Start the frontend: cd frontend && npm start"
echo "3. Or start both with Docker: docker-compose up"
echo "4. Verify setup: & "C:\Program Files\Git\bin\bash.exe" scripts/verify-local-setup.sh"
echo "5. Seed database: npm run seed:dev"
echo "6. Open Swagger UI: http://localhost:3000/api"
echo "7. Open Frontend: http://localhost:3001"
echo ""
echo "📚 Available endpoints:"
echo "- GET /health - Health check"
echo "- GET /api - Swagger documentation"
echo "- GET /api/v1/portfolios - List portfolios"
echo "- POST /api/v1/portfolios - Create portfolio"
echo ""
echo "🛑 To stop services: docker-compose down"
