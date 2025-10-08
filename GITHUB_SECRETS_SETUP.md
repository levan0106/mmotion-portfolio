# 🔐 GitHub Secrets Setup Guide

## Required GitHub Secrets for CI/CD Pipeline

Để GitHub Actions có thể deploy lên AWS ECR và EC2, bạn cần cấu hình các secrets sau trong GitHub repository:

### 1. AWS Credentials
```
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
```

### 2. ECR Configuration
```
ECR_REGISTRY=977098990721.dkr.ecr.us-east-1.amazonaws.com
ECR_REPOSITORY_BACKEND=portfolio-backend
ECR_REPOSITORY_FRONTEND=portfolio-frontend
```

### 3. EC2 Deployment Credentials
```
EC2_HOST=your-ec2-public-ip-or-domain
EC2_USER=ec2-user
EC2_SSH_KEY=your_private_ssh_key_content
```

## 📋 Setup Instructions

### Step 1: Get AWS Credentials
```bash
# Get your AWS Access Key ID and Secret
aws configure list
# Or create new IAM user with ECR and EC2 permissions
```

### Step 2: Get EC2 Information
```bash
# Get EC2 public IP
aws ec2 describe-instances --region us-east-1 --query 'Reservations[*].Instances[*].[PublicIpAddress,Tags[?Key==`Name`].Value]' --output table

# Or use your EC2 instance public IP
```

### Step 3: Configure GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with the exact name and value

### Step 4: Test Configuration

After setting up secrets, push to main branch to trigger the CI/CD pipeline:

```bash
git add .
git commit -m "feat: Setup ECR repositories and GitHub secrets"
git push origin main
```

## 🔧 IAM Permissions Required

Your AWS user needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "ec2:DescribeInstanceStatus"
      ],
      "Resource": "*"
    }
  ]
}
```

## 🚨 Security Best Practices

1. **Use IAM Roles** instead of access keys when possible
2. **Rotate credentials** regularly
3. **Limit permissions** to minimum required
4. **Monitor access** through CloudTrail
5. **Use different credentials** for different environments

## 📊 Verification

After setup, verify the configuration:

1. Check GitHub Actions logs for successful ECR login
2. Verify images are pushed to ECR repositories
3. Check EC2 deployment logs
4. Test application endpoints

## 🆘 Troubleshooting

### Common Issues:

1. **ECR Login Failed**
   - Check AWS credentials
   - Verify region configuration
   - Ensure ECR repositories exist

2. **EC2 SSH Connection Failed**
   - Verify EC2_HOST is correct
   - Check SSH key format
   - Ensure EC2 security groups allow SSH

3. **Docker Build Failed**
   - Check Dockerfile syntax
   - Verify build context
   - Check for missing dependencies

## 📞 Support

If you encounter issues:
1. Check GitHub Actions logs
2. Verify AWS credentials
3. Test ECR login manually
4. Check EC2 connectivity
