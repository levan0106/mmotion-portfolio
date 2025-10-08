#!/bin/bash
set -e

echo "🧪 Testing ECR Push/Pull for Portfolio Management System"

# Load ECR configuration
source ../ecr-config.env

echo "📋 ECR Configuration:"
echo "  Registry: $ECR_REGISTRY"
echo "  Backend Repository: $ECR_REPOSITORY_BACKEND"
echo "  Frontend Repository: $ECR_REPOSITORY_FRONTEND"
echo "  Region: $AWS_REGION"
echo ""

# Login to ECR
echo "🔐 Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY

# Test backend image build and push
echo "🏗️ Building backend test image..."
docker build -t $ECR_BACKEND_URI:test .

echo "📤 Pushing backend test image..."
docker push $ECR_BACKEND_URI:test

# Test frontend image build and push
echo "🏗️ Building frontend test image..."
docker build -t $ECR_FRONTEND_URI:test ./frontend

echo "📤 Pushing frontend test image..."
docker push $ECR_FRONTEND_URI:test

# Test pull
echo "📥 Testing image pull..."
docker pull $ECR_BACKEND_URI:test
docker pull $ECR_FRONTEND_URI:test

echo "✅ ECR test completed successfully!"
echo ""
echo "📊 Repository Status:"
aws ecr describe-images --repository-name $ECR_REPOSITORY_BACKEND --region $AWS_REGION
aws ecr describe-images --repository-name $ECR_REPOSITORY_FRONTEND --region $AWS_REGION

# Cleanup test images
echo "🧹 Cleaning up test images..."
docker rmi $ECR_BACKEND_URI:test || true
docker rmi $ECR_FRONTEND_URI:test || true

echo "🎉 ECR setup verification completed!"
