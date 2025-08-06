#!/bin/bash

echo "🔨 Creating StyleScope DynamoDB Tables"
echo "====================================="

# Create episodes table
echo "Creating stylescope-episodes table..."
aws dynamodb create-table \
    --table-name stylescope-episodes \
    --attribute-definitions AttributeName=id,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1 \
    --tags Key=Project,Value=StyleScope Key=Environment,Value=Development

# Create sentiment cache table
echo "Creating stylescope-sentiment-cache table..."
aws dynamodb create-table \
    --table-name stylescope-sentiment-cache \
    --attribute-definitions AttributeName=productId,AttributeType=S \
    --key-schema AttributeName=productId,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1 \
    --tags Key=Project,Value=StyleScope Key=Environment,Value=Development

echo "✅ Tables created! Waiting for them to become active..."

# Wait for tables to be active
aws dynamodb wait table-exists --table-name stylescope-episodes --region us-east-1
aws dynamodb wait table-exists --table-name stylescope-sentiment-cache --region us-east-1

echo "🎉 All tables are ready!"
echo ""
echo "Test with: npm run test:services"