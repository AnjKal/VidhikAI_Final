#!/bin/bash

# AWS ECS Fargate Deployment Script for VidhikAI
# Builds Docker image (linux/amd64) and pushes to AWS ECR

set -e

# Configuration
AWS_REGION="us-east-1"
REPOSITORY_NAME="vidhikai"
IMAGE_TAG="latest"

echo "🚀 Starting deployment to AWS ECS Fargate..."

# Get AWS Account ID
echo "📋 Getting AWS Account ID..."
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

if [ -z "$AWS_ACCOUNT_ID" ]; then
    echo "❌ Error: Could not get AWS Account ID. Make sure AWS CLI is configured."
    exit 1
fi

echo "✅ AWS Account ID: $AWS_ACCOUNT_ID"

ECR_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPOSITORY_NAME"

echo "📦 ECR URI: $ECR_URI"

# Step 1: Create ECR repository if not exists
echo ""
echo "📦 Step 1/4: Creating or verifying ECR repository..."

aws ecr describe-repositories \
    --repository-names $REPOSITORY_NAME \
    --region $AWS_REGION >/dev/null 2>&1 || \
aws ecr create-repository \
    --repository-name $REPOSITORY_NAME \
    --region $AWS_REGION

echo "✅ ECR repository ready"

# Step 2: Login to ECR
echo ""
echo "🔐 Step 2/4: Logging into ECR..."

aws ecr get-login-password --region $AWS_REGION | \
docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

echo "✅ Docker authenticated with ECR"

# Step 3: Build Docker image for AWS (amd64)
echo ""
echo "🏗️ Step 3/4: Building Docker image for linux/amd64..."

docker buildx create --use --name ecsbuilder 2>/dev/null || true

docker buildx build \
  --platform linux/amd64 \
  -t $REPOSITORY_NAME:$IMAGE_TAG \
  --load \
  .

echo "✅ Docker image built"

# Step 4: Tag and Push Image
echo ""
echo "🏷️ Step 4/4: Tagging and pushing image..."

docker tag $REPOSITORY_NAME:$IMAGE_TAG $ECR_URI:$IMAGE_TAG

docker push $ECR_URI:$IMAGE_TAG

echo ""
echo "🎉 Docker image pushed successfully!"
echo ""

echo "📦 Image URI:"
echo "$ECR_URI:$IMAGE_TAG"

echo ""
echo "🚀 Next step: Force ECS to deploy new image"
echo ""

echo "Run:"
echo ""
echo "aws ecs update-service \\"
echo "  --cluster vidhikai-cluster \\"
echo "  --service vidhikai-service \\"
echo "  --force-new-deployment \\"
echo "  --region $AWS_REGION"
echo ""