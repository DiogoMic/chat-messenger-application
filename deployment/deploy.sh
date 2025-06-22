#!/bin/bash

# AWS Chat Messenger Deployment Script
set -e

ENVIRONMENT=${1:-dev}
REGION=${2:-us-east-1}
STACK_NAME="chat-messenger-$ENVIRONMENT"

echo "Deploying Chat Messenger to $ENVIRONMENT environment in $REGION region..."

# Build the React app
echo "Building React application..."
npm run build

# Deploy CloudFormation stack
echo "Deploying infrastructure..."
aws cloudformation deploy \
  --template-file aws/cloudformation-template.yaml \
  --stack-name $STACK_NAME \
  --parameter-overrides Environment=$ENVIRONMENT \
  --capabilities CAPABILITY_IAM \
  --region $REGION

# Get stack outputs
echo "Getting stack outputs..."
WEBSOCKET_URL=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`WebSocketUrl`].OutputValue' \
  --output text)

REST_API_URL=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`RestApiUrl`].OutputValue' \
  --output text)

CLOUDFRONT_URL=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontUrl`].OutputValue' \
  --output text)

MEDIA_BUCKET=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`MediaBucketName`].OutputValue' \
  --output text)

WEBSITE_BUCKET="chat-app-frontend-$ENVIRONMENT-$(aws sts get-caller-identity --query Account --output text)"

# Update Lambda functions
echo "Updating Lambda functions..."

# Package and deploy WebSocket function
cd aws/lambda

# Create virtual environment and install dependencies
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt -t .

# Package WebSocket function
zip -r websocket-handler.zip websocket_handler.py boto3* botocore*
aws lambda update-function-code \
  --function-name "chat-websocket-$ENVIRONMENT" \
  --zip-file fileb://websocket-handler.zip \
  --region $REGION

# Package API function
zip -r api-handler.zip api_handler.py boto3* botocore*
aws lambda update-function-code \
  --function-name "chat-api-$ENVIRONMENT" \
  --zip-file fileb://api-handler.zip \
  --region $REGION

# Clean up
deactivate
rm -rf venv

cd ../..

# Create environment file for frontend
echo "Creating environment configuration..."
cat > .env.production << EOF
REACT_APP_WEBSOCKET_URL=$WEBSOCKET_URL
REACT_APP_API_URL=$REST_API_URL
REACT_APP_MEDIA_BUCKET=$MEDIA_BUCKET
REACT_APP_ENVIRONMENT=$ENVIRONMENT
EOF

# Rebuild with production environment
echo "Rebuilding with production configuration..."
npm run build

# Upload to S3
echo "Uploading frontend to S3..."
aws s3 sync dist/ s3://$WEBSITE_BUCKET --delete --region $REGION

# Set bucket policy for public access
aws s3api put-bucket-policy \
  --bucket $WEBSITE_BUCKET \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "PublicReadGetObject",
        "Effect": "Allow",
        "Principal": "*",
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::'$WEBSITE_BUCKET'/*"
      }
    ]
  }' \
  --region $REGION

# Invalidate CloudFront cache
echo "Invalidating CloudFront cache..."
DISTRIBUTION_ID=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Origins.Items[0].DomainName=='$WEBSITE_BUCKET.s3.$REGION.amazonaws.com'].Id" \
  --output text)

if [ ! -z "$DISTRIBUTION_ID" ]; then
  aws cloudfront create-invalidation \
    --distribution-id $DISTRIBUTION_ID \
    --paths "/*"
fi

echo "Deployment completed successfully!"
echo "WebSocket URL: $WEBSOCKET_URL"
echo "API URL: $REST_API_URL"
echo "Website URL: https://$CLOUDFRONT_URL"
echo "Media Bucket: $MEDIA_BUCKET"