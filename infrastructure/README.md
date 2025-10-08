# Infrastructure - AWS CDK

## Overview

This directory contains the AWS CDK infrastructure code for the Portfolio Management System deployed on AWS with the `mmotion.cloud` domain.

## File Structure

```
infrastructure/
├── README.md                    # This file
├── package.json                 # CDK dependencies
├── cdk.json                     # CDK configuration
├── tsconfig.json                # TypeScript configuration
├── bin/
│   └── portfolio-app.ts        # CDK app entry point
├── lib/
│   └── aws-cdk-stack.ts        # Main CDK stack definition
├── production.env              # Production environment variables
└── dns-configuration.md        # DNS setup guide
```

## Main Components

### 🏗️ **aws-cdk-stack.ts**
**Main infrastructure definition** - Defines all AWS resources:
- VPC with public/private/isolated subnets
- ECS cluster with Fargate tasks
- RDS PostgreSQL database
- ElastiCache Redis cluster
- Application Load Balancer
- CloudFront distribution
- SSL certificates
- Security groups and IAM roles
- CloudWatch monitoring

### 🚀 **portfolio-app.ts**
**CDK app entry point** - Defines different environments:
- **Staging**: `staging.mmotion.cloud`
- **Production**: `mmotion.cloud`
- **Development**: `dev.mmotion.cloud`

## Usage

### Prerequisites
```powershell
# Install AWS CDK
npm install -g aws-cdk

# Install dependencies
cd infrastructure
npm install

# Bootstrap CDK (first time only)
cdk bootstrap
```

### Deployment Commands

#### **Deploy to Staging**
```powershell
# Using npm script
npm run deploy:staging

# Using CDK directly
cdk deploy PortfolioStackStaging --require-approval never
```

#### **Deploy to Production**
```powershell
# Using npm script
npm run deploy:production

# Using CDK directly
cdk deploy PortfolioStackProduction --require-approval never
```

#### **Deploy All Environments**
```powershell
npm run deploy:all
```

### Development Commands

#### **Synthesize CloudFormation**
```powershell
# Staging
npm run synth:staging

# Production
npm run synth:production
```

#### **View Differences**
```powershell
# Staging
npm run diff:staging

# Production
npm run diff:production
```

#### **List Stacks**
```powershell
npm run list
```

### Cleanup Commands

#### **Destroy Staging**
```powershell
npm run destroy:staging
```

#### **Destroy Production**
```powershell
npm run destroy:production
```

#### **Destroy All**
```powershell
npm run destroy:all
```

## Infrastructure Components

### 🌐 **Networking**
- **VPC**: Custom VPC with 3-tier architecture
- **Subnets**: Public, Private, and Isolated subnets
- **Security Groups**: Network security rules
- **NAT Gateway**: Outbound internet access

### 🐳 **Container Orchestration**
- **ECS Cluster**: Container orchestration
- **Fargate**: Serverless containers
- **Task Definitions**: Backend and frontend containers
- **Services**: Auto-scaling services

### 🗄️ **Database**
- **RDS PostgreSQL**: Managed database
- **Multi-AZ**: High availability (production)
- **Backup**: Automated backups
- **Encryption**: Data encryption at rest

### 🔴 **Caching**
- **ElastiCache Redis**: In-memory cache
- **Subnet Group**: Cache subnet configuration
- **Security**: Network isolation

### ⚖️ **Load Balancing**
- **Application Load Balancer**: Traffic distribution
- **Target Groups**: Backend and frontend targets
- **Health Checks**: Service health monitoring
- **SSL/TLS**: HTTPS termination

### 🌍 **CDN**
- **CloudFront**: Global content delivery
- **Caching**: Static asset caching
- **SSL**: HTTPS everywhere
- **Custom Domain**: mmotion.cloud

### 🔒 **Security**
- **SSL Certificates**: ACM certificates
- **IAM Roles**: Service permissions
- **Secrets Manager**: Secure credential storage
- **WAF**: Web application firewall

### 📊 **Monitoring**
- **CloudWatch**: Logs and metrics
- **Alarms**: Automated alerting
- **Dashboards**: Performance monitoring
- **X-Ray**: Distributed tracing

## Environment Configuration

### **Staging Environment**
```typescript
new PortfolioStack(app, 'PortfolioStackStaging', {
  environment: 'staging',
  domainName: 'staging.mmotion.cloud',
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
});
```

### **Production Environment**
```typescript
new PortfolioStack(app, 'PortfolioStackProduction', {
  environment: 'production',
  domainName: 'mmotion.cloud',
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
});
```

## Domain Configuration

### **Primary Domains**
- **Production**: `mmotion.cloud`
- **API**: `api.mmotion.cloud`
- **Staging**: `staging.mmotion.cloud`

### **SSL Certificates**
- **Primary**: `mmotion.cloud`
- **SAN**: `api.mmotion.cloud`, `staging.mmotion.cloud`

## Resource Sizing

### **Staging Environment**
- **ECS Tasks**: 1 backend, 1 frontend
- **RDS**: db.t3.medium
- **Redis**: cache.t3.micro
- **Auto Scaling**: 1-3 tasks

### **Production Environment**
- **ECS Tasks**: 3 backend, 2 frontend
- **RDS**: db.t3.medium with Multi-AZ
- **Redis**: cache.t3.micro
- **Auto Scaling**: 1-10 tasks

## Security Features

### **Network Security**
- VPC with private subnets
- Security groups with least privilege
- NAT Gateway for outbound access
- No direct internet access to containers

### **Data Security**
- RDS encryption at rest
- ElastiCache encryption in transit
- Secrets Manager for credentials
- SSL/TLS everywhere

### **Access Control**
- IAM roles with minimal permissions
- Service-to-service authentication
- No hardcoded credentials
- Audit logging enabled

## Monitoring and Alerting

### **CloudWatch Metrics**
- CPU utilization
- Memory utilization
- Request count
- Error rates
- Database performance

### **Alarms**
- High CPU utilization (>80%)
- High memory utilization (>80%)
- Database connection failures
- Application errors

### **Logs**
- Application logs
- Access logs
- Error logs
- Security logs

## Cost Optimization

### **Resource Optimization**
- Right-sized instances
- Auto-scaling policies
- Spot instances for non-critical workloads
- Reserved instances for predictable workloads

### **Storage Optimization**
- S3 lifecycle policies
- ECR image cleanup
- Log retention policies
- Backup optimization

## Troubleshooting

### **Common Issues**
1. **CDK Bootstrap**: Run `cdk bootstrap` first
2. **Permissions**: Ensure AWS credentials are configured
3. **Domain**: Verify domain ownership for SSL certificates
4. **Resources**: Check AWS service limits

### **Debug Commands**
```powershell
# Check CDK version
cdk --version

# List all stacks
cdk list

# View stack details
cdk synth PortfolioStackProduction

# Check differences
cdk diff PortfolioStackProduction
```

### **Useful Commands**
```powershell
# Watch for changes
cdk watch

# Deploy with verbose output
cdk deploy --verbose

# Deploy specific stack
cdk deploy PortfolioStackStaging --require-approval never
```

## Best Practices

### **Infrastructure as Code**
- Version control all changes
- Use meaningful resource names
- Tag resources appropriately
- Document changes

### **Security**
- Follow least privilege principle
- Encrypt sensitive data
- Use IAM roles instead of users
- Regular security audits

### **Monitoring**
- Set up comprehensive monitoring
- Configure appropriate alerts
- Regular log analysis
- Performance optimization

## Support

### **Documentation**
- AWS CDK Documentation
- AWS Service Documentation
- CloudFormation Templates

### **Troubleshooting**
- Check CloudWatch logs
- Verify IAM permissions
- Test network connectivity
- Review security group rules

## Conclusion

This infrastructure provides a production-ready, scalable, and secure foundation for the Portfolio Management System on AWS with the `mmotion.cloud` domain. The CDK code is maintainable, version-controlled, and follows AWS best practices.
