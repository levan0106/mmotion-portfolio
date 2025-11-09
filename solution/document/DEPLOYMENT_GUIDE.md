# Portfolio Management System - Deployment Guide

## 🚀 Quick Deployment Options

### Option 1: Automated CI/CD Pipeline (Recommended)

#### Prerequisites
- GitHub repository with secrets configured
- AWS credentials in GitHub Secrets
- EC2 instance running

#### Secrets Required
```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_ACCOUNT_ID
EC2_PRIVATE_KEY (SSH private key for EC2)
```

#### Deploy via GitHub Actions
1. Push to `main` branch triggers automatic deployment
2. Or manually trigger via GitHub Actions tab
3. Select environment (production/staging)

### Option 2: Manual Deployment Script

#### Prerequisites
- SSH access to EC2 instance
- `mmo-portfolio-key.pem` file in project root
- Node.js 18+ and npm installed locally

#### Deploy Steps
```bash
# 1. Make script executable
chmod +x scripts/deploy-to-ec2.sh

# 2. Run deployment
./scripts/deploy-to-ec2.sh
```

### Option 3: Docker Image Build and Deploy (Recommended for Production)

#### Prerequisites
- Docker installed locally
- Access to container registry (GitHub Container Registry, Docker Hub, etc.)
- SSH access to EC2 instance

#### Deploy Steps
```bash
# 1. Make script executable
chmod +x scripts/docker-build-deploy.sh

# 2. Build and deploy (full process)
./scripts/docker-build-deploy.sh

# 3. Or step by step:
./scripts/docker-build-deploy.sh --build-only    # Only build images
./scripts/docker-build-deploy.sh --push-only     # Only push to registry
./scripts/docker-build-deploy.sh --deploy-only   # Only deploy to EC2
```

#### Manual Docker Build and Deploy
```bash
# 1. Build images locally
docker build -t your-registry/portfolio-backend:latest -f Dockerfile.prod .
docker build -t your-registry/portfolio-frontend:latest -f frontend/Dockerfile.prod ./frontend

# 2. Push to registry
docker push your-registry/portfolio-backend:latest
docker push your-registry/portfolio-frontend:latest

# 3. Deploy to EC2
scp -i "mmo-portfolio-key.pem" docker-compose.registry.yml ec2-user@ec2-34-228-198-131.compute-1.amazonaws.com:/home/ec2-user/mmotion-portfolio/
ssh -i "mmo-portfolio-key.pem" ec2-user@ec2-34-228-198-131.compute-1.amazonaws.com "cd /home/ec2-user/mmotion-portfolio && docker-compose -f docker-compose.registry.yml up -d"
```

### Option 4: Manual Docker Deployment (Local Build)

#### On EC2 Instance
```bash
# 1. Connect to EC2
ssh -i "mmo-portfolio-key.pem" ec2-user@ec2-34-228-198-131.compute-1.amazonaws.com

# 2. Create project directory
mkdir -p /home/ec2-user/mmotion-portfolio
cd /home/ec2-user/mmotion-portfolio

# 3. Upload files (from local machine)
scp -i "mmo-portfolio-key.pem" -r . ec2-user@ec2-34-228-198-131.compute-1.amazonaws.com:/home/ec2-user/mmotion-portfolio/

# 4. Build and run with Docker
sudo docker-compose -f docker-compose.prod.yml up -d --build
```

## 📋 Deployment Checklist

### Before Deployment
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] SSL certificates (if needed)
- [ ] Security groups configured

### During Deployment
- [ ] Backup existing deployment
- [ ] Run database migrations
- [ ] Deploy application
- [ ] Verify health checks
- [ ] Test endpoints

### After Deployment
- [ ] Monitor application logs
- [ ] Check performance metrics
- [ ] Verify all features working
- [ ] Update documentation

## 🔧 Configuration

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Redis
REDIS_URL=redis://host:port

# Application
NODE_ENV=production
PORT=3000
```

### Docker Configuration
- **Backend**: Port 3000
- **Frontend**: Port 80 (Nginx)
- **Redis**: Port 6379 (optional)

## 🏥 Health Checks

### Backend Health
```bash
curl http://your-domain:3000/health
```

### Frontend Health
```bash
curl http://your-domain:80
```

### API Endpoints
```bash
curl http://your-domain:3000/api/v1/portfolios
curl http://your-domain:3000/api/v1/assets
```

## 🔄 Rollback Process

### Quick Rollback
```bash
# On EC2 instance
cd /home/ec2-user/mmotion-portfolio
sudo docker-compose down
sudo docker-compose -f docker-compose.prod.yml up -d
```

### Full Rollback
```bash
# Restore from backup
sudo rm -rf /home/ec2-user/mmotion-portfolio
sudo mv /home/ec2-user/mmotion-portfolio-backup /home/ec2-user/mmotion-portfolio
cd /home/ec2-user/mmotion-portfolio
sudo docker-compose up -d
```

## 📊 Monitoring

### Application Logs
```bash
# Backend logs
sudo docker-compose logs -f backend

# Frontend logs
sudo docker-compose logs -f frontend

# All logs
sudo docker-compose logs -f
```

### System Resources
```bash
# Docker stats
sudo docker stats

# System resources
htop
df -h
free -h
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using the port
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :80

# Kill the process
sudo kill -9 <PID>
```

#### 2. Docker Issues
```bash
# Clean up Docker
sudo docker system prune -a
sudo docker-compose down
sudo docker-compose up -d --build
```

#### 3. Database Connection Issues
```bash
# Check database connectivity
telnet <database-host> 5432

# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

#### 4. Memory Issues
```bash
# Check memory usage
free -h
sudo docker stats

# Restart services
sudo docker-compose restart
```

### Log Locations
- **Application**: `/var/log/nginx/access.log`
- **Docker**: `sudo docker-compose logs`
- **System**: `/var/log/messages`

## 🔐 Security Considerations

### Firewall Rules
```bash
# Allow HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow SSH
sudo ufw allow 22

# Allow application port
sudo ufw allow 3000
```

### SSL/TLS Setup
```bash
# Install Certbot
sudo dnf install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

## 📈 Performance Optimization

### Nginx Configuration
- Enable gzip compression
- Set up caching headers
- Configure rate limiting
- Enable HTTP/2

### Docker Optimization
- Use multi-stage builds
- Optimize image layers
- Set resource limits
- Use health checks

### Database Optimization
- Configure connection pooling
- Set up indexes
- Monitor query performance
- Regular maintenance

## 🆘 Support

### Emergency Contacts
- **System Admin**: [Contact Info]
- **Database Admin**: [Contact Info]
- **DevOps Team**: [Contact Info]

### Escalation Process
1. Check application logs
2. Verify system resources
3. Test connectivity
4. Contact support team
5. Document issue and resolution

---

## 📚 Additional Resources

- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Configuration Guide](https://nginx.org/en/docs/)
- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
