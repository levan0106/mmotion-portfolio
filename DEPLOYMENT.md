# 🚀 Portfolio Backend Deployment Guide

## 📋 Overview

This guide covers the complete deployment setup for the Portfolio Management System using Docker + CI/CD pipeline.

## 🏗️ Architecture

```
GitHub → GitHub Actions → AWS ECR → EC2 Instance (Backend)
                           ↓
                    Docker Compose
                           ↓
              [Backend] [Postgres] [Redis]

GitHub → GitHub Actions → S3 + CloudFront (Frontend)
                           ↓
                    Static Files
                           ↓
              [S3 Bucket] [CloudFront CDN]
```

## 🛠️ Prerequisites

### Local Development
- Docker & Docker Compose
- Node.js 18+
- Git

### Production (EC2)
- Ubuntu 20.04+ or Amazon Linux 2
- Docker & Docker Compose
- AWS CLI
- 2GB+ RAM, 20GB+ storage

## 🚀 Quick Start

### 1. Local Development

```bash
# Clone repository
git clone <your-repo-url>
cd mmotion-portfolio

# Copy environment file
cp env.example .env
# Edit .env with your configuration

# Start all services
docker-compose up -d

# Check status
docker-compose ps
```

### 2. Production Deployment

#### Step 1: Setup EC2 Instance

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install AWS CLI
sudo apt install awscli -y

# Logout and login to apply docker group changes
```

#### Step 2: Configure AWS ECR

```bash
# Create ECR repositories
aws ecr create-repository --repository-name portfolio-backend --region us-east-1
aws ecr create-repository --repository-name portfolio-frontend --region us-east-1

# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
```

#### Step 3: Setup GitHub Secrets

Add these secrets to your GitHub repository:

```
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
EC2_HOST=your-ec2-public-ip
EC2_USER=ec2-user
EC2_SSH_KEY=your_private_ssh_key
```

#### Step 4: Deploy

```bash
# On EC2, create project directory
mkdir -p /home/ec2-user/mmotion-portfolio
cd /home/ec2-user/mmotion-portfolio

# Copy environment file
cp env.example .env
# Edit .env with production values

# Set ECR environment variables
export ECR_REGISTRY=<account-id>.dkr.ecr.us-east-1.amazonaws.com
export ECR_REPOSITORY_BACKEND=portfolio-backend
export ECR_REPOSITORY_FRONTEND=portfolio-frontend

# Deploy (this will be done automatically by GitHub Actions)
docker-compose -f docker-compose.prod.yml up -d
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_HOST` | PostgreSQL host | `postgres` |
| `DATABASE_PORT` | PostgreSQL port | `5432` |
| `DATABASE_NAME` | Database name | `portfolio_db` |
| `DATABASE_USER` | Database user | `portfolio_user` |
| `DATABASE_PASSWORD` | Database password | **Required** |
| `REDIS_HOST` | Redis host | `redis` |
| `REDIS_PORT` | Redis port | `6379` |
| `NODE_ENV` | Environment | `production` |
| `PORT` | Backend port | `3000` |

### Docker Services (Backend Only)

| Service | Port | Description |
|---------|------|-------------|
| Backend | 3000 | NestJS API |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache & Sessions |

### Frontend Services (S3 + CloudFront)

| Service | Type | Description |
|---------|------|-------------|
| Frontend | S3 + CloudFront | React Static Files |
| CDN | CloudFront | Global Content Delivery |

## 🔄 CI/CD Pipeline

### Workflow Triggers
- **Push to main**: Deploy to production
- **Pull Request**: Run tests only
- **Manual**: Deploy to staging/production

### Pipeline Steps
1. **Test**: Run unit tests and linting
2. **Build Backend**: Build Docker image for backend
3. **Build Frontend**: Build static files for frontend
4. **Push Backend**: Push backend image to AWS ECR
5. **Deploy Backend**: Deploy backend to EC2
6. **Deploy Frontend**: Deploy frontend to S3 + CloudFront
7. **Health Check**: Verify both deployments

## 📊 Monitoring

### Health Checks
- Backend: `http://your-ec2-ip:3000/health`
- Frontend: `https://your-cloudfront-domain.cloudfront.net/`
- Database: Internal health checks

### Logs
```bash
# View backend logs (EC2)
docker-compose logs backend
docker-compose logs postgres
docker-compose logs redis

# View frontend logs (CloudFront)
aws logs describe-log-groups --log-group-name-prefix /aws/cloudfront
```

### Container Status (Backend Only)
```bash
# Check running containers
docker-compose ps

# Check resource usage
docker stats
```

### Frontend Status (S3 + CloudFront)
```bash
# Check S3 bucket contents
aws s3 ls s3://your-bucket-name/

# Check CloudFront distribution status
aws cloudfront get-distribution --id YOUR_DISTRIBUTION_ID

# Check CloudFront cache invalidation status
aws cloudfront get-invalidation --distribution-id YOUR_DISTRIBUTION_ID --id YOUR_INVALIDATION_ID
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using the port
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :3000

# Kill the process
sudo kill -9 <PID>
```

#### 2. Database Connection Issues
```bash
# Check database logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres psql -U portfolio_user -d portfolio_db
```

#### 3. ECR Login Issues
```bash
# Re-login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
```

#### 4. Permission Issues
```bash
# Fix Docker permissions
sudo chmod 666 /var/run/docker.sock
# Or add user to docker group
sudo usermod -aG docker $USER
```

#### 5. S3 Deployment Issues
```bash
# Check S3 bucket permissions
aws s3api get-bucket-policy --bucket your-bucket-name

# Check CloudFront distribution
aws cloudfront get-distribution --id YOUR_DISTRIBUTION_ID

# Test S3 access
aws s3 ls s3://your-bucket-name/

# Check CloudFront cache
aws cloudfront get-invalidation --distribution-id YOUR_DISTRIBUTION_ID --id YOUR_INVALIDATION_ID
```

#### 6. Frontend Not Loading
```bash
# Check if files are in S3
aws s3 ls s3://your-bucket-name/ --recursive

# Check CloudFront distribution status
aws cloudfront get-distribution --id YOUR_DISTRIBUTION_ID --query 'Distribution.Status'

# Force CloudFront cache invalidation
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

### Reset Everything
```bash
# Stop all containers
docker-compose down

# Remove all containers and volumes
docker-compose down -v

# Remove all images
docker system prune -a

# Start fresh
docker-compose up -d
```

## 🔒 Security

### Production Checklist
- [ ] Change default passwords
- [ ] Use HTTPS (setup SSL certificate)
- [ ] Configure firewall (only ports 80, 443)
- [ ] Regular security updates
- [ ] Database backups
- [ ] Monitor logs for suspicious activity

### SSL Setup (Optional)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

## 📈 Scaling

### Horizontal Scaling
- Use AWS Application Load Balancer
- Multiple EC2 instances
- Database clustering (PostgreSQL)
- Redis clustering

### Vertical Scaling
- Increase EC2 instance size
- Add more RAM/CPU
- Optimize Docker resources

## 🆘 Support

### Useful Commands
```bash
# Restart specific service
docker-compose restart backend

# Update and restart
docker-compose pull && docker-compose up -d

# View real-time logs
docker-compose logs -f backend

# Execute commands in container
docker-compose exec backend sh
docker-compose exec postgres psql -U portfolio_user -d portfolio_db
```

### Backup Database
```bash
# Create backup
docker-compose exec postgres pg_dump -U portfolio_user portfolio_db > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U portfolio_user portfolio_db < backup.sql
```

---

## 🎉 Success!

Your Portfolio Management System is now deployed and running! 

- **Frontend**: https://your-cloudfront-domain.cloudfront.net/
- **Backend API**: http://your-ec2-ip:3000/api/
- **Health Check**: http://your-ec2-ip:3000/health

### Architecture Benefits

✅ **Frontend on S3 + CloudFront**:
- Global CDN for faster loading
- Automatic scaling
- Cost-effective static hosting
- SSL/HTTPS by default

✅ **Backend on EC2**:
- Full control over server environment
- Database and Redis on same network
- Easy debugging and monitoring
- Docker containerization for consistency
