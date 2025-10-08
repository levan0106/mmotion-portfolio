# IAM Policies for Portfolio Management System

## 📋 **Available Policies**

This directory contains all the IAM policies needed to deploy the Portfolio Management System on AWS.

### **1. PortfolioMinimal.json**
**Minimum required permissions for CDK bootstrap**
- IAM role management
- CloudFormation access
- S3 bucket operations

**Use for:** Initial CDK bootstrap setup

### **2. PortfolioCDKBootstrap.json**
**CDK Bootstrap specific permissions**
- S3 bucket management (create, delete, configure)
- IAM role operations
- CloudFormation full access

**Use for:** CDK bootstrap process

### **3. PortfolioFreeTier.json**
**Free Tier deployment permissions**
- EC2 instance management (t2.micro)
- RDS database operations (t2.micro)
- ElastiCache Redis operations (t2.micro)
- S3 static hosting
- CloudFront CDN
- Route 53 DNS
- ACM SSL certificates
- Secrets Manager

**Use for:** AWS Free Tier deployment (EC2 + RDS + ElastiCache + S3 + CloudFront)

### **4. PortfolioProduction.json**
**Production deployment permissions**
- ECS container orchestration
- Application Load Balancer
- ECR container registry
- EC2 instance management
- RDS database operations
- ElastiCache Redis operations
- S3 static hosting
- CloudFront CDN
- Route 53 DNS
- ACM SSL certificates
- Secrets Manager

**Use for:** Production deployment (ECS + ALB + RDS + ElastiCache + ECR)

## 🔧 **Setup Instructions**

### **1. Create IAM User**
```bash
aws iam create-user --user-name portfolio-deployer
```

### **2. Create Access Key**
```bash
aws iam create-access-key --user-name portfolio-deployer
```

### **3. Create Custom Policies**
```bash
# CDK Bootstrap Policy
aws iam create-policy --policy-name PortfolioCDKBootstrap --policy-document file://PortfolioCDKBootstrap.json

# Free Tier Policy
aws iam create-policy --policy-name PortfolioFreeTier --policy-document file://PortfolioFreeTier.json

# Production Policy
aws iam create-policy --policy-name PortfolioProduction --policy-document file://PortfolioProduction.json

# Minimal Policy
aws iam create-policy --policy-name PortfolioMinimal --policy-document file://PortfolioMinimal.json
```

### **4. Attach AWS Managed Policies**
```bash
# Attach AWS managed policies
aws iam attach-user-policy --user-name portfolio-deployer --policy-arn arn:aws:iam::aws:policy/PowerUserAccess
aws iam attach-user-policy --user-name portfolio-deployer --policy-arn arn:aws:iam::aws:policy/IAMFullAccess
aws iam attach-user-policy --user-name portfolio-deployer --policy-arn arn:aws:iam::aws:policy/CloudFormationFullAccess
aws iam attach-user-policy --user-name portfolio-deployer --policy-arn arn:aws:iam::aws:policy/AmazonEC2FullAccess
aws iam attach-user-policy --user-name portfolio-deployer --policy-arn arn:aws:iam::aws:policy/AmazonRDSFullAccess
aws iam attach-user-policy --user-name portfolio-deployer --policy-arn arn:aws:iam::aws:policy/AmazonElastiCacheFullAccess
aws iam attach-user-policy --user-name portfolio-deployer --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
aws iam attach-user-policy --user-name portfolio-deployer --policy-arn arn:aws:iam::aws:policy/CloudFrontFullAccess
aws iam attach-user-policy --user-name portfolio-deployer --policy-arn arn:aws:iam::aws:policy/AmazonRoute53FullAccess
aws iam attach-user-policy --user-name portfolio-deployer --policy-arn arn:aws:iam::aws:policy/SecretsManagerFullAccess
aws iam attach-user-policy --user-name portfolio-deployer --policy-arn arn:aws:iam::aws:policy/CertificateManagerFullAccess
```

### **5. Attach Custom Policies**
```bash
# Get your AWS Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Attach custom policies
aws iam attach-user-policy --user-name portfolio-deployer --policy-arn arn:aws:iam::$ACCOUNT_ID:policy/PortfolioCDKBootstrap
aws iam attach-user-policy --user-name portfolio-deployer --policy-arn arn:aws:iam::$ACCOUNT_ID:policy/PortfolioFreeTier
aws iam attach-user-policy --user-name portfolio-deployer --policy-arn arn:aws:iam::$ACCOUNT_ID:policy/PortfolioProduction
```

## 🎯 **Deployment Scenarios**

### **Free Tier Deployment**
```bash
# Attach only Free Tier policy
aws iam attach-user-policy --user-name portfolio-deployer --policy-arn arn:aws:iam::$ACCOUNT_ID:policy/PortfolioFreeTier

# Deploy Free Tier
.\scripts\deploy-free-tier.ps1 -Environment staging
```

### **Production Deployment**
```bash
# Attach Production policy
aws iam attach-user-policy --user-name portfolio-deployer --policy-arn arn:aws:iam::$ACCOUNT_ID:policy/PortfolioProduction

# Deploy Production
.\scripts\deploy-to-aws.ps1 -Environment staging
```

### **CDK Bootstrap Only**
```bash
# Attach only CDK Bootstrap policy
aws iam attach-user-policy --user-name portfolio-deployer --policy-arn arn:aws:iam::$ACCOUNT_ID:policy/PortfolioCDKBootstrap

# Bootstrap CDK
cd infrastructure
cdk bootstrap
```

## 📊 **Policy Comparison**

| Policy | EC2 | RDS | ElastiCache | S3 | CloudFront | Route53 | ACM | Secrets | ECS | ALB | ECR |
|--------|-----|-----|-------------|----|-----------|---------|-----|---------|-----|-----|-----|
| **Minimal** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **CDKBootstrap** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **FreeTier** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Production** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## ⚠️ **Security Notes**

### **Least Privilege**
- Use specific policies for your deployment type
- Don't attach all policies if not needed
- Regular permission audits

### **Resource Restrictions**
- Consider restricting policies to specific resources
- Use resource ARNs instead of "*" when possible
- Implement resource tagging for better management

### **Monitoring**
- Enable CloudTrail for audit logs
- Set up billing alerts
- Monitor unusual activity

## 🚀 **Manual Setup Steps**

1. **Create IAM user and access key manually**
2. **Attach AWS managed policies manually**
3. **Create and attach custom policies using JSON files**
4. **Configure AWS CLI with new credentials**
5. **Deploy infrastructure**

---

**🎉 Result: User with all necessary permissions to deploy Portfolio Management System on AWS!**
