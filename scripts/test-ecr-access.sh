#!/bin/bash
set -e

echo "🧪 Testing ECR Access from EC2..."

# Load ECR configuration
source ../ecr-config.env

echo "📋 ECR Configuration:"
echo "  Registry: $ECR_REGISTRY"
echo "  Backend Repository: $ECR_REPOSITORY_BACKEND"
echo "  Frontend Repository: $ECR_REPOSITORY_FRONTEND"
echo "  Region: $AWS_REGION"
echo ""

# Test AWS credentials
echo "🔐 Testing AWS credentials..."
aws sts get-caller-identity

# Test ECR login
echo "🔑 Testing ECR login..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY

# Test image pull
echo "📥 Testing image pull..."
docker pull $ECR_BACKEND_URI:latest || echo "Backend image not found, this is expected for first run"
docker pull $ECR_FRONTEND_URI:latest || echo "Frontend image not found, this is expected for first run"

echo "✅ ECR access test completed!"
echo ""
echo "📊 Available images in ECR:"
aws ecr describe-images --repository-name $ECR_REPOSITORY_BACKEND --region $AWS_REGION --query 'imageDetails[*].imageTags' --output table || echo "No backend images found"
aws ecr describe-images --repository-name $ECR_REPOSITORY_FRONTEND --region $AWS_REGION --query 'imageDetails[*].imageTags' --output table || echo "No frontend images found"
