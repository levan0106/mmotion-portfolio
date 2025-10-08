#!/bin/bash
set -e

echo "🚀 Quick Deploy Portfolio Backend to EC2"

# Check if required parameters are provided
if [ $# -lt 3 ]; then
    echo "Usage: $0 <EC2_HOST> <EC2_USER> <SSH_KEY_PATH>"
    echo "Example: $0 ec2-34-228-198-131.compute-1.amazonaws.com ec2-user mmo-portfolio-key.pem"
    exit 1
fi

EC2_HOST=$1
EC2_USER=$2
SSH_KEY_PATH=$3
PROJECT_DIR="/home/${EC2_USER}/mmotion-portfolio"

echo "📋 Deployment Configuration:"
echo "  EC2 Host: ${EC2_HOST}"
echo "  EC2 User: ${EC2_USER}"
echo "  SSH Key: ${SSH_KEY_PATH}"
echo "  Project Dir: ${PROJECT_DIR}"
echo ""

# 1. Setup EC2 instance
echo "🔧 Setting up EC2 instance..."
ssh -i "${SSH_KEY_PATH}" "${EC2_USER}@${EC2_HOST}" "bash -s" < scripts/setup-ec2.sh

# 2. Upload project files
echo "📤 Uploading project files..."
scp -i "${SSH_KEY_PATH}" docker-compose.prod.yml "${EC2_USER}@${EC2_HOST}:${PROJECT_DIR}/"
scp -i "${SSH_KEY_PATH}" env.example "${EC2_USER}@${EC2_HOST}:${PROJECT_DIR}/.env"

# 3. Configure environment
echo "⚙️ Configuring environment..."
ssh -i "${SSH_KEY_PATH}" "${EC2_USER}@${EC2_HOST}" "cd ${PROJECT_DIR} && echo 'Please edit .env file with your production values'"

echo "✅ Quick deploy completed!"
echo ""
echo "📋 Next steps:"
echo "1. SSH to EC2: ssh -i ${SSH_KEY_PATH} ${EC2_USER}@${EC2_HOST}"
echo "2. Edit .env: cd ${PROJECT_DIR} && nano .env"
echo "3. Configure AWS: aws configure"
echo "4. Set up ECR repositories"
echo "5. Configure GitHub secrets"
echo "6. Push to main branch to trigger CI/CD"
echo ""
echo "🔧 Manual deployment (if needed):"
echo "  cd ${PROJECT_DIR}"
echo "  docker-compose -f docker-compose.prod.yml up -d"
