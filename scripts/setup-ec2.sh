#!/bin/bash
set -e

echo "🚀 Setting up EC2 instance for Portfolio Backend deployment..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
echo "🔧 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install AWS CLI
echo "☁️ Installing AWS CLI..."
sudo apt install awscli -y

# Install additional tools
echo "🛠️ Installing additional tools..."
sudo apt install curl wget git htop -y

# Create project directory
echo "📁 Creating project directory..."
mkdir -p /home/$USER/mmotion-portfolio
cd /home/$USER/mmotion-portfolio

# Set up environment file
echo "⚙️ Setting up environment file..."
cat > .env << EOF
# Database Configuration
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=portfolio_db
DATABASE_USER=portfolio_user
DATABASE_PASSWORD=change_this_password

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379

# Application Configuration
NODE_ENV=production
PORT=3000
API_PREFIX=api

# JWT Configuration
JWT_SECRET=change_this_jwt_secret
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=logs/app.log
EOF

# Set up ECR environment variables
echo "🔐 Setting up ECR environment variables..."
cat >> ~/.bashrc << EOF

# ECR Configuration
export ECR_REGISTRY=your-account-id.dkr.ecr.us-east-1.amazonaws.com
export ECR_REPOSITORY_BACKEND=portfolio-backend
export ECR_REPOSITORY_FRONTEND=portfolio-frontend
EOF

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# Set up log rotation
echo "📝 Setting up log rotation..."
sudo tee /etc/logrotate.d/docker-containers << EOF
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    size=1M
    missingok
    delaycompress
    copytruncate
}
EOF

# Create systemd service for auto-start
echo "🔄 Creating systemd service..."
sudo tee /etc/systemd/system/portfolio-backend.service << EOF
[Unit]
Description=Portfolio Backend Service
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/$USER/mmotion-portfolio
ExecStart=/usr/local/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.prod.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

# Enable the service
sudo systemctl daemon-reload
sudo systemctl enable portfolio-backend.service

echo "✅ EC2 setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your production values"
echo "2. Configure AWS credentials: aws configure"
echo "3. Set up GitHub secrets for CI/CD"
echo "4. Push to main branch to trigger deployment"
echo ""
echo "🔧 Useful commands:"
echo "- Check status: docker-compose ps"
echo "- View logs: docker-compose logs -f"
echo "- Restart: docker-compose restart"
echo "- Stop: docker-compose down"
echo ""
echo "⚠️  Don't forget to:"
echo "- Change default passwords in .env"
echo "- Configure AWS ECR repositories"
echo "- Set up GitHub secrets"
echo "- Test the deployment"
